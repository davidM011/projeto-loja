import { mockClients, mockDashboard, mockProducts, mockReceivables, mockSales } from "@/lib/mock-data";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";

type Row = Record<string, unknown>;

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function toIsoDate(value: unknown): string {
  if (typeof value === "string") return value.slice(0, 10);
  return "";
}

function getNextMonthDay10(base = new Date()): string {
  const date = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 10));
  return date.toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export interface ClientOption {
  id: string;
  name: string;
  whatsapp?: string;
}

export interface ProductOption {
  id: string;
  name: string;
  price: number;
}

export interface SaleOption {
  id: string;
  code: string;
  client: string;
  total: number;
}

export interface ReceivableItem {
  id: string;
  saleId: string;
  clientId: string;
  client: string;
  saleCode: string;
  method: string;
  dueDate: string | null;
  amount: number;
  status: string;
}

export interface ReceivablesFilters {
  status?: string;
  method?: string;
  clientId?: string;
  period?: "TODOS" | "HOJE" | "PROX_7" | "ATRASADAS";
}

export interface ClientDetailData {
  id: string;
  name: string;
  whatsapp: string;
  notes: string;
  totalOpen: number;
  overdueCount: number;
  totalPurchases: number;
  totalPaid: number;
  recentSales: Array<{ id: string; code: string; date: string; total: number; status: string }>;
  openPayments: ReceivableItem[];
}

function filterReceivable(item: ReceivableItem, filters: ReceivablesFilters): boolean {
  const status = filters.status ?? "TODOS";
  const method = filters.method ?? "TODOS";
  const clientId = filters.clientId ?? "TODOS";
  const period = filters.period ?? "TODOS";

  if (status !== "TODOS" && item.status !== status) return false;
  if (method !== "TODOS" && item.method !== method) return false;
  if (clientId !== "TODOS" && item.clientId !== clientId) return false;

  if (period === "TODOS") return true;

  const today = todayIso();
  const in7 = new Date();
  in7.setDate(in7.getDate() + 7);
  const in7Iso = in7.toISOString().slice(0, 10);
  const due = item.dueDate;

  if (period === "ATRASADAS") {
    return item.status === "ATRASADO";
  }

  if (!due) return false;
  if (period === "HOJE") return due === today;
  if (period === "PROX_7") return due >= today && due <= in7Iso;

  return true;
}

export async function getDashboardData() {
  if (!hasSupabaseEnv()) {
    const overdueAmount = mockReceivables.filter((p) => p.status === "ATRASADO").reduce((acc, p) => acc + p.amount, 0);
    const lowStockCount = mockProducts.filter((p) => (p.stock ?? 0) <= 5).length;
    return { ...mockDashboard, overdueAmount, lowStockCount };
  }

  const supabase = getSupabaseServerClient();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
  const in7Days = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 7)).toISOString().slice(0, 10);

  const [salesResult, openPaymentsResult, day10Result, dueSoonResult, salesForNamesResult, clientsResult, lowStockResult] = await Promise.all([
    supabase.from("sales").select("total, sale_date").gte("sale_date", monthStart).lt("sale_date", monthEnd),
    supabase.from("payments").select("amount, status").in("status", ["PENDENTE", "ATRASADO"]),
    supabase
      .from("payments")
      .select("id")
      .eq("method", "MES_SEGUINTE")
      .eq("due_date", getNextMonthDay10(now))
      .in("status", ["PENDENTE", "ATRASADO"]),
    supabase
      .from("payments")
      .select("id, sale_id, method, due_date, amount, status")
      .in("status", ["PENDENTE", "ATRASADO"])
      .not("due_date", "is", null)
      .gte("due_date", now.toISOString().slice(0, 10))
      .lte("due_date", in7Days)
      .order("due_date", { ascending: true })
      .limit(12),
    supabase.from("sales").select("id, client_id"),
    supabase.from("clients").select("id, name"),
    supabase.from("products").select("id, stock").not("stock", "is", null).lte("stock", 5),
  ]);

  if (
    salesResult.error ||
    openPaymentsResult.error ||
    day10Result.error ||
    dueSoonResult.error ||
    salesForNamesResult.error ||
    clientsResult.error ||
    lowStockResult.error
  ) {
    const overdueAmount = mockReceivables.filter((p) => p.status === "ATRASADO").reduce((acc, p) => acc + p.amount, 0);
    const lowStockCount = mockProducts.filter((p) => (p.stock ?? 0) <= 5).length;
    return { ...mockDashboard, overdueAmount, lowStockCount };
  }

  const soldMonth = (salesResult.data as Row[]).reduce((acc, item) => acc + asNumber(item.total), 0);
  const openAmount = (openPaymentsResult.data as Row[]).reduce((acc, item) => acc + asNumber(item.amount), 0);
  const nextDay10Count = (day10Result.data as Row[]).length;
  const overdueAmount = (openPaymentsResult.data as Row[])
    .filter((item) => asString(item.status) === "ATRASADO")
    .reduce((acc, item) => acc + asNumber(item.amount), 0);
  const lowStockCount = (lowStockResult.data as Row[]).length;

  const saleToClient = new Map<string, string>();
  for (const sale of salesForNamesResult.data as Row[]) {
    saleToClient.set(asString(sale.id), asString(sale.client_id));
  }

  const clientName = new Map<string, string>();
  for (const client of clientsResult.data as Row[]) {
    clientName.set(asString(client.id), asString(client.name));
  }

  const nextDue = (dueSoonResult.data as Row[]).map((item) => {
    const saleId = asString(item.sale_id);
    const clientId = saleToClient.get(saleId) ?? "";

    return {
      id: asString(item.id),
      client: clientName.get(clientId) ?? "-",
      saleCode: saleId.slice(0, 8),
      method: asString(item.method),
      dueDate: toIsoDate(item.due_date),
      amount: asNumber(item.amount),
      status: asString(item.status),
    };
  });

  return { soldMonth, openAmount, nextDay10Count, overdueAmount, lowStockCount, nextDue };
}

export async function getClientsData() {
  if (!hasSupabaseEnv()) return mockClients;

  const supabase = getSupabaseServerClient();
  const [clientsResult, salesResult, paymentsResult] = await Promise.all([
    supabase.from("clients").select("id, name, whatsapp").order("name"),
    supabase.from("sales").select("id, client_id"),
    supabase.from("payments").select("sale_id, amount, status"),
  ]);

  if (clientsResult.error || salesResult.error || paymentsResult.error) return mockClients;

  const orderCount = new Map<string, number>();
  const saleToClient = new Map<string, string>();
  for (const sale of salesResult.data as Row[]) {
    const clientId = asString(sale.client_id);
    const saleId = asString(sale.id);
    saleToClient.set(saleId, clientId);
    orderCount.set(clientId, (orderCount.get(clientId) ?? 0) + 1);
  }

  const debtByClient = new Map<string, number>();
  for (const payment of paymentsResult.data as Row[]) {
    const status = asString(payment.status);
    if (status === "CONFIRMADO") continue;

    const saleId = asString(payment.sale_id);
    const clientId = saleToClient.get(saleId);
    if (!clientId) continue;

    debtByClient.set(clientId, (debtByClient.get(clientId) ?? 0) + asNumber(payment.amount));
  }

  return (clientsResult.data as Row[]).map((item) => ({
    id: asString(item.id),
    name: asString(item.name),
    whatsapp: asString(item.whatsapp),
    orders: orderCount.get(asString(item.id)) ?? 0,
    debt: debtByClient.get(asString(item.id)) ?? 0,
  }));
}

export async function getClientDetailData(clientId: string): Promise<ClientDetailData | null> {
  if (!clientId) return null;

  if (!hasSupabaseEnv()) {
    const client = mockClients.find((c) => c.id === clientId) ?? mockClients[0];
    const openPayments = mockReceivables
      .filter((r) => r.client === client.name)
      .filter((r) => r.status !== "CONFIRMADO")
      .map((r) => ({
        id: r.id,
        saleId: r.saleCode,
        clientId: client.id,
        client: r.client,
        saleCode: r.saleCode,
        method: r.method,
        dueDate: r.dueDate,
        amount: r.amount,
        status: r.status,
      }));

    return {
      id: client.id,
      name: client.name,
      whatsapp: client.whatsapp,
      notes: "",
      totalOpen: openPayments.filter((p) => p.status !== "CONFIRMADO").reduce((a, b) => a + b.amount, 0),
      overdueCount: openPayments.filter((p) => p.status === "ATRASADO").length,
      totalPurchases: mockSales.filter((s) => s.client === client.name).length,
      totalPaid: mockReceivables
        .filter((r) => r.client === client.name && r.status === "CONFIRMADO")
        .reduce((a, b) => a + b.amount, 0),
      recentSales: mockSales.filter((s) => s.client === client.name).map((s) => ({ id: s.id, code: s.code, date: s.date, total: s.total, status: s.status })),
      openPayments,
    };
  }

  const supabase = getSupabaseServerClient();
  const clientResult = await supabase.from("clients").select("id, name, whatsapp, notes").eq("id", clientId).maybeSingle();
  if (clientResult.error || !clientResult.data) return null;

  const salesResult = await supabase
    .from("sales")
    .select("id, sale_date, total, status")
    .eq("client_id", clientId)
    .order("sale_date", { ascending: false })
    .limit(20);

  if (salesResult.error) return null;

  const salesRows = salesResult.data as Row[];
  const saleIds = salesRows.map((s) => asString(s.id)).filter(Boolean);

  let paymentsRows: Row[] = [];
  if (saleIds.length > 0) {
    const paymentsResult = await supabase
      .from("payments")
      .select("id, sale_id, method, due_date, amount, status")
      .in("sale_id", saleIds)
      .order("due_date", { ascending: true });

    if (!paymentsResult.error) paymentsRows = paymentsResult.data as Row[];
  }

  const clientName = asString(clientResult.data?.name);

  const openPayments: ReceivableItem[] = paymentsRows
    .filter((item) => asString(item.status) !== "CONFIRMADO")
    .map((item) => ({
      id: asString(item.id),
      saleId: asString(item.sale_id),
      clientId,
      client: clientName,
      saleCode: asString(item.sale_id).slice(0, 8),
      method: asString(item.method),
      dueDate: item.due_date == null ? null : toIsoDate(item.due_date),
      amount: asNumber(item.amount),
      status: asString(item.status),
    }));

  return {
    id: asString(clientResult.data.id),
    name: clientName,
    whatsapp: asString(clientResult.data.whatsapp),
    notes: asString(clientResult.data.notes),
    totalOpen: openPayments.filter((p) => p.status !== "CONFIRMADO").reduce((a, b) => a + b.amount, 0),
    overdueCount: openPayments.filter((p) => p.status === "ATRASADO").length,
    totalPurchases: salesRows.length,
    totalPaid: paymentsRows
      .filter((p) => asString(p.status) === "CONFIRMADO")
      .reduce((acc, p) => acc + asNumber(p.amount), 0),
    recentSales: salesRows.map((s) => ({
      id: asString(s.id),
      code: asString(s.id).slice(0, 8),
      date: toIsoDate(s.sale_date),
      total: asNumber(s.total),
      status: asString(s.status),
    })),
    openPayments,
  };
}

export async function getClientOptions(): Promise<ClientOption[]> {
  if (!hasSupabaseEnv()) {
    return mockClients.map((item) => ({ id: item.id, name: item.name, whatsapp: item.whatsapp }));
  }

  const supabase = getSupabaseServerClient();
  const result = await supabase.from("clients").select("id, name, whatsapp").order("name");

  if (result.error) {
    return mockClients.map((item) => ({ id: item.id, name: item.name, whatsapp: item.whatsapp }));
  }

  return (result.data as Row[]).map((item) => ({
    id: asString(item.id),
    name: asString(item.name),
    whatsapp: asString(item.whatsapp),
  }));
}

export async function getProductsData() {
  if (!hasSupabaseEnv()) return mockProducts;

  const supabase = getSupabaseServerClient();
  const result = await supabase.from("products").select("id, name, sale_price, stock, cost_price").order("name");

  if (result.error) return mockProducts;

  return (result.data as Row[]).map((item) => ({
    id: asString(item.id),
    name: asString(item.name),
    price: asNumber(item.sale_price),
    stock: item.stock == null ? null : asNumber(item.stock),
    cost: item.cost_price == null ? null : asNumber(item.cost_price),
  }));
}

export async function getProductOptions(): Promise<ProductOption[]> {
  if (!hasSupabaseEnv()) {
    return mockProducts.map((item) => ({ id: item.id, name: item.name, price: item.price }));
  }

  const supabase = getSupabaseServerClient();
  const result = await supabase.from("products").select("id, name, sale_price").order("name");

  if (result.error) {
    return mockProducts.map((item) => ({ id: item.id, name: item.name, price: item.price }));
  }

  return (result.data as Row[]).map((item) => ({
    id: asString(item.id),
    name: asString(item.name),
    price: asNumber(item.sale_price),
  }));
}

export async function getSalesData() {
  if (!hasSupabaseEnv()) return mockSales;

  const supabase = getSupabaseServerClient();
  const [salesResult, clientsResult] = await Promise.all([
    supabase.from("sales").select("id, client_id, sale_date, total, status").order("sale_date", { ascending: false }),
    supabase.from("clients").select("id, name"),
  ]);

  if (salesResult.error || clientsResult.error) return mockSales;

  const clientName = new Map<string, string>();
  for (const client of clientsResult.data as Row[]) {
    clientName.set(asString(client.id), asString(client.name));
  }

  return (salesResult.data as Row[]).map((sale) => ({
    id: asString(sale.id),
    code: asString(sale.id).slice(0, 8),
    client: clientName.get(asString(sale.client_id)) ?? "-",
    date: toIsoDate(sale.sale_date),
    total: asNumber(sale.total),
    status: asString(sale.status),
  }));
}

export async function getSaleOptions(): Promise<SaleOption[]> {
  if (!hasSupabaseEnv()) {
    return mockSales.map((sale) => ({
      id: sale.id,
      code: sale.id.slice(0, 8),
      client: sale.client,
      total: sale.total,
    }));
  }

  const supabase = getSupabaseServerClient();
  const [salesResult, clientsResult] = await Promise.all([
    supabase.from("sales").select("id, client_id, total").order("created_at", { ascending: false }).limit(100),
    supabase.from("clients").select("id, name"),
  ]);

  if (salesResult.error || clientsResult.error) {
    return mockSales.map((sale) => ({
      id: sale.id,
      code: sale.id.slice(0, 8),
      client: sale.client,
      total: sale.total,
    }));
  }

  const clientName = new Map<string, string>();
  for (const client of clientsResult.data as Row[]) {
    clientName.set(asString(client.id), asString(client.name));
  }

  return (salesResult.data as Row[]).map((sale) => ({
    id: asString(sale.id),
    code: asString(sale.id).slice(0, 8),
    client: clientName.get(asString(sale.client_id)) ?? "-",
    total: asNumber(sale.total),
  }));
}

export async function getReceivablesData(filters: ReceivablesFilters = {}) {
  let rows: ReceivableItem[] = [];

  if (!hasSupabaseEnv()) {
    rows = mockReceivables.map((item) => ({
      ...item,
      saleId: item.saleCode,
      clientId: item.client,
    }));
  } else {
    const supabase = getSupabaseServerClient();
    const [paymentsResult, salesResult, clientsResult] = await Promise.all([
      supabase
        .from("payments")
        .select("id, sale_id, method, due_date, amount, status")
        .order("created_at", { ascending: false })
        .limit(300),
      supabase.from("sales").select("id, client_id"),
      supabase.from("clients").select("id, name"),
    ]);

    if (paymentsResult.error || salesResult.error || clientsResult.error) {
      rows = mockReceivables.map((item) => ({
        ...item,
        saleId: item.saleCode,
        clientId: item.client,
      }));
    } else {
      const saleToClient = new Map<string, string>();
      for (const sale of salesResult.data as Row[]) {
        saleToClient.set(asString(sale.id), asString(sale.client_id));
      }

      const clientName = new Map<string, string>();
      for (const client of clientsResult.data as Row[]) {
        clientName.set(asString(client.id), asString(client.name));
      }

      rows = (paymentsResult.data as Row[]).map((item) => {
        const saleId = asString(item.sale_id);
        const clientId = saleToClient.get(saleId) ?? "";

        return {
          id: asString(item.id),
          saleId,
          clientId,
          client: clientName.get(clientId) ?? "-",
          saleCode: saleId.slice(0, 8),
          method: asString(item.method),
          dueDate: item.due_date == null ? null : toIsoDate(item.due_date),
          amount: asNumber(item.amount),
          status: asString(item.status),
        };
      });
    }
  }

  return rows.filter((item) => filterReceivable(item, filters));
}
