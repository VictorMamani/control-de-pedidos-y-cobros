export type OrderStatus = "confirmed" | "cancelled";
export type FulfillmentStatus = "not_started" | "preparing" | "ready" | "delivered";

export type OrderView = {
  id: string;
  reference: string;
  customerLabel: string;
  itemDescription: string;
  totalCents: number;
  paidCents: number;
  commercialStatus: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  createdLabel: string;
  cancelledReason?: string | null;
};

export type QuotationStatus = "draft" | "sent" | "accepted" | "declined" | "expired";

export type QuotationView = {
  id: string;
  reference: string;
  customerLabel: string;
  totalCents: number;
  status: QuotationStatus;
  validUntil: string | null;
  createdLabel: string;
};
