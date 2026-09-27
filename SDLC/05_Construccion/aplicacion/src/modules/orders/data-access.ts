import type { SupabaseServerClient } from "@/lib/supabase/server";
import { lineAmountCents, numericToCents } from "@/lib/money";
import type { FulfillmentStatus, OrderStatus, OrderView, QuotationStatus, QuotationView } from "@/modules/orders/types";

const dateFormatter = new Intl.DateTimeFormat("es-BO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/La_Paz",
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function asDetails(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function historyMessage(action: string, details: Record<string, unknown>) {
  const stateLabels: Record<string, string> = {
    not_started: "sin iniciar",
    preparing: "en preparación",
    ready: "listo para retirar",
    delivered: "entregado",
  };
  const from = typeof details.from === "string" ? stateLabels[details.from] ?? details.from : null;
  const to = typeof details.to === "string" ? stateLabels[details.to] ?? details.to : null;

  if (action === "order.created") return "Pedido registrado";
  if (action === "order.created_from_quotation") return "Pedido creado desde una cotización aceptada";
  if (action === "order.fulfillment.changed" && from && to) return `Preparación: ${from} → ${to}`;
  if (action === "order.cancelled") return "Pedido cancelado";
  if (action === "payment.recorded") return `Cobro de BOB ${String(details.amount ?? "") } anotado`;
  if (action === "payment.reversed") return `Cobro de BOB ${String(details.amount ?? "") } revertido`;
  if (action === "quotation.created") return "Cotización creada";
  if (action === "quotation.status.changed") return `Cotización marcada como ${String(details.to ?? "actualizada")}`;
  if (action === "quotation.accepted") return "Cotización aceptada";
  return action.replaceAll(".", " ");
}

export type HistoryItem = {
  action: string;
  message: string;
  actorId: string | null;
  createdAt: string;
};

export type OrderDetailView = {
  order: OrderView;
  lines: Array<{
    id: string;
    description: string;
    sku: string | null;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
  }>;
  payments: Array<{
    id: string;
    amountCents: number;
    isReversal: boolean;
    reversesEntryId: string | null;
    reversedById: string | null;
    reversalReason: string | null;
    recordedBy: string;
    methodLabel: string;
    recordedAt: string;
  }>;
  history: HistoryItem[];
};

export type BusinessSummary = {
  openOrders: number;
  preparingOrders: number;
  readyOrders: number;
  pendingCents: number;
  quoteCount: number;
  recentActivity: HistoryItem[];
};

export type QuotationDetailView = {
  quotation: QuotationView;
  orderId: string | null;
  lines: Array<{
    id: string;
    description: string;
    sku: string | null;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
  }>;
  history: HistoryItem[];
};

export async function listOrders(
  supabase: SupabaseServerClient,
  businessId: string,
): Promise<OrderView[]> {
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, reference, customer_label, commercial_status, fulfillment_status, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (ordersError) throw new Error("No se pudieron cargar los pedidos.");
  const orderIds = (orders ?? []).map((order) => order.id);
  if (orderIds.length === 0) return [];

  const [lineResult, paymentResult] = await Promise.all([
    supabase.from("order_lines")
      .select("order_id, description_snapshot, quantity, unit_price")
      .eq("business_id", businessId).in("order_id", orderIds),
    supabase.from("payment_entries")
      .select("order_id, amount, reverses_entry_id")
      .eq("business_id", businessId).in("order_id", orderIds),
  ]);
  if (lineResult.error || paymentResult.error) throw new Error("No se pudieron cargar los detalles de los pedidos.");

  const descriptions = new Map<string, string[]>();
  const totals = new Map<string, number>();
  for (const line of lineResult.data ?? []) {
    descriptions.set(line.order_id, [...(descriptions.get(line.order_id) ?? []), line.description_snapshot]);
    totals.set(line.order_id, (totals.get(line.order_id) ?? 0) + lineAmountCents(Number(line.quantity), numericToCents(line.unit_price)));
  }

  const paidCents = new Map<string, number>();
  for (const payment of paymentResult.data ?? []) {
    const sign = payment.reverses_entry_id ? -1 : 1;
    paidCents.set(payment.order_id, (paidCents.get(payment.order_id) ?? 0) + sign * numericToCents(payment.amount));
  }

  return orders.map((order) => ({
    id: order.id,
    reference: order.reference,
    customerLabel: order.customer_label || "Sin referencia de cliente",
    itemDescription: (descriptions.get(order.id) ?? []).join(", ") || "Pedido sin líneas",
    totalCents: totals.get(order.id) ?? 0,
    paidCents: Math.max(0, paidCents.get(order.id) ?? 0),
    commercialStatus: order.commercial_status as OrderStatus,
    fulfillmentStatus: order.fulfillment_status as FulfillmentStatus,
    createdLabel: formatDate(order.created_at),
  }));
}

export async function listQuotations(
  supabase: SupabaseServerClient,
  businessId: string,
): Promise<QuotationView[]> {
  const { data, error } = await supabase.from("quotations")
    .select("id, reference, customer_label_snapshot, total, status, valid_until, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("No se pudieron cargar las cotizaciones.");

  return (data ?? []).map((quotation) => ({
    id: quotation.id,
    reference: quotation.reference,
    customerLabel: quotation.customer_label_snapshot || "Sin referencia de cliente",
    totalCents: numericToCents(quotation.total),
    status: quotation.status as QuotationStatus,
    validUntil: quotation.valid_until,
    createdLabel: formatDate(quotation.created_at),
  }));
}

export async function getQuotationDetail(
  supabase: SupabaseServerClient,
  businessId: string,
  quotationId: string,
): Promise<QuotationDetailView | null> {
  const { data: quotation, error: quotationError } = await supabase.from("quotations")
    .select("id, reference, customer_label_snapshot, total, status, valid_until, created_at")
    .eq("business_id", businessId).eq("id", quotationId).maybeSingle();
  if (quotationError) throw new Error("No se pudo cargar la cotización.");
  if (!quotation) return null;

  const [lineResult, eventResult, orderResult] = await Promise.all([
    supabase.from("quotation_lines").select("id, description_snapshot, sku_snapshot, quantity, unit_price")
      .eq("business_id", businessId).eq("quotation_id", quotationId).order("created_at", { ascending: true }),
    supabase.from("audit_events").select("action, actor_id, details, created_at")
      .eq("business_id", businessId).eq("entity_type", "quotation").eq("entity_id", quotationId)
      .order("created_at", { ascending: true }).limit(100),
    supabase.from("orders").select("id").eq("business_id", businessId).eq("quotation_id", quotationId).maybeSingle(),
  ]);
  if (lineResult.error || eventResult.error || orderResult.error) throw new Error("No se pudo cargar el detalle de la cotización.");

  return {
    quotation: {
      id: quotation.id,
      reference: quotation.reference,
      customerLabel: quotation.customer_label_snapshot || "Sin referencia de cliente",
      totalCents: numericToCents(quotation.total),
      status: quotation.status as QuotationStatus,
      validUntil: quotation.valid_until,
      createdLabel: formatDate(quotation.created_at),
    },
    orderId: orderResult.data?.id ?? null,
    lines: (lineResult.data ?? []).map((line) => {
      const unitPriceCents = numericToCents(line.unit_price);
      return {
        id: line.id,
        description: line.description_snapshot,
        sku: line.sku_snapshot,
        quantity: Number(line.quantity),
        unitPriceCents,
        totalCents: lineAmountCents(Number(line.quantity), unitPriceCents),
      };
    }),
    history: (eventResult.data ?? []).map((event) => ({
      action: event.action,
      message: historyMessage(event.action, asDetails(event.details)),
      actorId: event.actor_id,
      createdAt: formatDate(event.created_at),
    })),
  };
}

export async function listBusinessActivity(
  supabase: SupabaseServerClient,
  businessId: string,
): Promise<HistoryItem[]> {
  const { data, error } = await supabase.from("audit_events")
    .select("action, actor_id, details, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(250);
  if (error) throw new Error("No se pudo cargar el historial del comercio.");
  return (data ?? []).map((event) => ({
    action: event.action,
    message: historyMessage(event.action, asDetails(event.details)),
    actorId: event.actor_id,
    createdAt: formatDate(event.created_at),
  }));
}

export async function getOrderDetail(
  supabase: SupabaseServerClient,
  businessId: string,
  orderId: string,
): Promise<OrderDetailView | null> {
  const { data: order, error: orderError } = await supabase.from("orders")
    .select("id, reference, customer_label, commercial_status, fulfillment_status, cancelled_reason, created_at")
    .eq("business_id", businessId).eq("id", orderId).maybeSingle();
  if (orderError) throw new Error("No se pudo cargar el pedido.");
  if (!order) return null;

  const [lineResult, paymentResult, eventResult] = await Promise.all([
    supabase.from("order_lines").select("id, description_snapshot, sku_snapshot, quantity, unit_price")
      .eq("business_id", businessId).eq("order_id", orderId).order("created_at", { ascending: true }),
    supabase.from("payment_entries").select("id, amount, method_label, reverses_entry_id, reversal_reason, recorded_by, recorded_at")
      .eq("business_id", businessId).eq("order_id", orderId).order("recorded_at", { ascending: false }),
    supabase.from("audit_events").select("entity_type, entity_id, action, actor_id, details, created_at")
      .eq("business_id", businessId).order("created_at", { ascending: false }).limit(250),
  ]);
  if (lineResult.error || paymentResult.error || eventResult.error) throw new Error("No se pudo cargar el historial del pedido.");

  const lines = (lineResult.data ?? []).map((line) => {
    const unitPriceCents = numericToCents(line.unit_price);
    return {
      id: line.id,
      description: line.description_snapshot,
      sku: line.sku_snapshot,
      quantity: Number(line.quantity),
      unitPriceCents,
      totalCents: lineAmountCents(Number(line.quantity), unitPriceCents),
    };
  });
  const reversalByEntry = new Map<string, (typeof paymentResult.data)[number]>();
  for (const payment of paymentResult.data ?? []) {
    if (payment.reverses_entry_id) reversalByEntry.set(payment.reverses_entry_id, payment);
  }
  const payments = (paymentResult.data ?? []).map((payment) => ({
    id: payment.id,
    amountCents: numericToCents(payment.amount) * (payment.reverses_entry_id ? -1 : 1),
    isReversal: Boolean(payment.reverses_entry_id),
    reversesEntryId: payment.reverses_entry_id,
    reversedById: reversalByEntry.get(payment.id)?.id ?? null,
    reversalReason: payment.reversal_reason,
    recordedBy: payment.recorded_by,
    methodLabel: payment.method_label,
    recordedAt: formatDate(payment.recorded_at),
  }));
  const orderEventSequence: Record<string, number> = {
    "quotation.accepted": 1,
    "order.created_from_quotation": 2,
    "order.created": 2,
  };
  const history = (eventResult.data ?? []).filter((event) => {
    const details = asDetails(event.details);
    return (event.entity_type === "order" && event.entity_id === orderId) || details.order_id === orderId;
  }).sort((left, right) => {
    const timeOrder = new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
    if (timeOrder !== 0) return timeOrder;
    return (orderEventSequence[left.action] ?? 10) - (orderEventSequence[right.action] ?? 10);
  }).map((event) => {
    const details = asDetails(event.details);
    return {
      action: event.action,
      message: historyMessage(event.action, details),
      actorId: event.actor_id,
      createdAt: formatDate(event.created_at),
    };
  });
  const totalCents = lines.reduce((sum, line) => sum + line.totalCents, 0);
  const paidCents = payments.reduce((sum, payment) => sum + payment.amountCents, 0);

  return {
    order: {
      id: order.id,
      reference: order.reference,
      customerLabel: order.customer_label || "Sin referencia de cliente",
      itemDescription: lines.map((line) => line.description).join(", ") || "Pedido sin líneas",
      totalCents,
      paidCents: Math.max(0, paidCents),
      commercialStatus: order.commercial_status as OrderStatus,
      fulfillmentStatus: order.fulfillment_status as FulfillmentStatus,
      createdLabel: formatDate(order.created_at),
      cancelledReason: order.cancelled_reason,
    },
    lines,
    payments,
    history,
  };
}

export async function getBusinessSummary(
  supabase: SupabaseServerClient,
  businessId: string,
): Promise<BusinessSummary> {
  const [summaryResult, quotationResult, activityResult] = await Promise.all([
    supabase.rpc("get_business_dashboard", { p_business_id: businessId }).single(),
    supabase.from("quotations").select("id", { count: "exact", head: true })
      .eq("business_id", businessId).in("status", ["draft", "sent"]),
    supabase.from("audit_events").select("action, actor_id, details, created_at")
      .eq("business_id", businessId).order("created_at", { ascending: false }).limit(8),
  ]);
  if (summaryResult.error || quotationResult.error || activityResult.error) {
    throw new Error("No se pudo cargar el resumen del comercio.");
  }

  return {
    openOrders: Number(summaryResult.data.open_orders),
    preparingOrders: Number(summaryResult.data.preparing_orders),
    readyOrders: Number(summaryResult.data.ready_orders),
    pendingCents: Number(summaryResult.data.pending_cents),
    quoteCount: quotationResult.count ?? 0,
    recentActivity: (activityResult.data ?? []).map((event) => {
      const details = asDetails(event.details);
      return {
        action: event.action,
        message: historyMessage(event.action, details),
        actorId: event.actor_id,
        createdAt: formatDate(event.created_at),
      };
    }),
  };
}
