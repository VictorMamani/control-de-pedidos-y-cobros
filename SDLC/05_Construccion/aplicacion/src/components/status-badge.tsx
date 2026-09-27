import type { FulfillmentStatus, OrderStatus } from "@/modules/orders/types";

const fulfillmentLabels: Record<FulfillmentStatus, { label: string; className: string }> = {
  not_started: { label: "Sin iniciar", className: "bg-[#eef3fb] text-[#426a9e]" },
  preparing: { label: "En preparación", className: "bg-[#eef3fb] text-[#426a9e]" },
  ready: { label: "Listo para retirar", className: "bg-[#fff3dc] text-[#9a6517]" },
  delivered: { label: "Entregado", className: "bg-[#e4f3ed] text-[#28785f]" },
};

export function FulfillmentBadge({ status }: { status: FulfillmentStatus }) {
  const item = fulfillmentLabels[status];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.className}`}>{item.label}</span>;
}

export function OrderBadge({ status }: { status: OrderStatus }) {
  const cancelled = status === "cancelled";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cancelled ? "bg-[#fae9e6] text-[#a84336]" : "bg-[#e4f3ed] text-[#28785f]"}`}>
      <span className={`size-1.5 rounded-full ${cancelled ? "bg-[#c75a4d]" : "bg-[#3f9a79]"}`} />
      {cancelled ? "Cancelado" : "Pedido confirmado"}
    </span>
  );
}
