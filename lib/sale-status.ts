import type { PaymentStatus, SaleStatus } from "@/lib/types";

export function getSaleStatus(total: number, confirmedTotal: number, paymentStatuses: PaymentStatus[]): SaleStatus {
  const hasOverdue = paymentStatuses.includes("ATRASADO");

  if (confirmedTotal <= 0) {
    return hasOverdue ? "ATRASADA" : "PENDENTE";
  }

  if (confirmedTotal >= total) {
    return "PAGA";
  }

  return hasOverdue ? "ATRASADA" : "PARCIAL";
}
