export type PaymentMethod = "PIX" | "DINHEIRO" | "CARTAO" | "TRANSFERENCIA" | "MES_SEGUINTE";

export type PaymentStatus = "PENDENTE" | "CONFIRMADO" | "ATRASADO";

export type SaleStatus = "PENDENTE" | "PARCIAL" | "PAGA" | "ATRASADA" | "CANCELADA";

export interface NewPaymentInput {
  method: PaymentMethod;
  amount: number;
  saleDate: Date;
  cardInstallments?: number | null;
  cardBrand?: string | null;
}

export interface PaymentRecord {
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  dueDate: Date | null;
  paidAt: Date | null;
  cardInstallments: number | null;
  cardBrand: string | null;
}
