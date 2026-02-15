import type { NewPaymentInput, PaymentRecord, PaymentStatus } from "@/lib/types";

export function getAutomaticDueDate(saleDate: Date): Date {
  const nextMonth = new Date(Date.UTC(saleDate.getUTCFullYear(), saleDate.getUTCMonth() + 1, 10));
  return nextMonth;
}

export function paymentStatusFromDueDate(dueDate: Date | null, paidAt: Date | null, now = new Date()): PaymentStatus {
  if (paidAt) return "CONFIRMADO";
  if (dueDate && dueDate.getTime() < now.getTime()) return "ATRASADO";
  return "PENDENTE";
}

export function normalizePaymentOnCreate(input: NewPaymentInput): PaymentRecord {
  const isNextMonth = input.method === "MES_SEGUINTE";
  const dueDate = isNextMonth ? getAutomaticDueDate(input.saleDate) : null;

  return {
    method: input.method,
    amount: input.amount,
    status: isNextMonth ? "PENDENTE" : "CONFIRMADO",
    dueDate,
    paidAt: isNextMonth ? null : new Date(),
    cardInstallments: input.method === "CARTAO" ? (input.cardInstallments ?? 1) : null,
    cardBrand: input.method === "CARTAO" ? (input.cardBrand ?? null) : null,
  };
}
