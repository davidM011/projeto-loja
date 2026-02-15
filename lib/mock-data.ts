export const mockDashboard = {
  soldMonth: 4820.0,
  openAmount: 1430.5,
  nextDay10Count: 4,
  nextDue: [
    { id: "p1", client: "Ana", saleCode: "V-102", method: "MES_SEGUINTE", dueDate: "2026-03-10", amount: 300, status: "PENDENTE" },
    { id: "p2", client: "Carlos", saleCode: "V-101", method: "MES_SEGUINTE", dueDate: "2026-02-10", amount: 120, status: "ATRASADO" },
  ],
};

export const mockClients = [
  { id: "c1", name: "Ana", whatsapp: "11999990001", orders: 3, debt: 300 },
  { id: "c2", name: "Carlos", whatsapp: "11999990002", orders: 5, debt: 120 },
  { id: "c3", name: "Bruna", whatsapp: "11999990003", orders: 2, debt: 0 },
];

export const mockProducts = [
  { id: "pr1", name: "Camisa Polo", price: 89.9, stock: 24, cost: 41.5 },
  { id: "pr2", name: "Calca Jeans", price: 149.9, stock: 15, cost: 72.3 },
  { id: "pr3", name: "Tenis Casual", price: 199.9, stock: 9, cost: 115.0 },
];

export const mockSales = [
  { id: "s1", code: "V-101", client: "Carlos", date: "2026-02-08", total: 240, status: "ATRASADA" },
  { id: "s2", code: "V-102", client: "Ana", date: "2026-02-14", total: 300, status: "PARCIAL" },
  { id: "s3", code: "V-103", client: "Bruna", date: "2026-02-14", total: 180, status: "PAGA" },
];

export const mockReceivables = [
  { id: "r1", client: "Carlos", saleCode: "V-101", method: "MES_SEGUINTE", dueDate: "2026-02-10", amount: 120, status: "ATRASADO" },
  { id: "r2", client: "Ana", saleCode: "V-102", method: "MES_SEGUINTE", dueDate: "2026-03-10", amount: 300, status: "PENDENTE" },
  { id: "r3", client: "Bruna", saleCode: "V-103", method: "PIX", dueDate: null, amount: 180, status: "CONFIRMADO" },
];
