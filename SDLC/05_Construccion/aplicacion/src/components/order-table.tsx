import Link from "next/link";
import { ArrowUpRight, Package, Smartphone } from "lucide-react";
import type { OrderView } from "@/modules/orders/types";
import { FulfillmentBadge, OrderBadge } from "@/components/status-badge";
import { formatBobs } from "@/lib/money";

export function OrderTable({ orders, compact = false }: { orders: OrderView[]; compact?: boolean }) {
  if (orders.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#edf4f1] text-[#367b64]">
          <Package aria-hidden="true" className="size-5" />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-[#24443a]">Todavía no hay pedidos</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[#71877e]">Registra el primero para empezar a seguir su preparación y los cobros anotados.</p>
        <Link href="/orders/new" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#16765d] hover:text-[#115d4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18775e]">
          Crear primer pedido <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    );
  }

  const visibleOrders = compact ? orders.slice(0, 5) : orders;

  return (
    <div role="region" aria-label="Tabla de pedidos" tabIndex={0} className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#18775e]">
      <table className="w-full min-w-[740px] border-collapse text-left">
        <caption className="sr-only">Pedidos con estados comercial y de preparación, cobros anotados y total</caption>
        <thead>
          <tr className="border-y border-[#e7eeeb] text-[10px] font-bold uppercase tracking-[0.09em] text-[#80958c]">
            <th scope="col" className="px-5 py-3">Registro</th>
            <th scope="col" className="px-3 py-3">Etapa comercial</th>
            <th scope="col" className="px-3 py-3">Preparación</th>
            <th scope="col" className="px-3 py-3">Cobro anotado</th>
            <th scope="col" className="px-5 py-3 text-right">Total BOB</th>
          </tr>
        </thead>
        <tbody>
          {visibleOrders.map((order) => {
            const balance = Math.max(order.totalCents - order.paidCents, 0);
            const Icon = order.itemDescription.toLocaleLowerCase("es-BO").includes("galaxy") ? Smartphone : Package;
            return (
              <tr key={order.id} className="border-b border-[#edf1ef] last:border-0 hover:bg-[#fbfdfc]">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#edf4f1] text-[#347b64]">
                      <Icon aria-hidden="true" className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <Link href={`/orders/${order.id}`} className="truncate text-sm font-semibold text-[#203c33] hover:text-[#16765d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18775e]">{order.itemDescription}</Link>
                      <p className="mt-0.5 text-[11px] text-[#758a81]"><span className="font-semibold text-[#16765d]">{order.reference}</span> · {order.createdLabel}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3.5"><OrderBadge status={order.commercialStatus} /></td>
                <td className="px-3 py-3.5"><FulfillmentBadge status={order.fulfillmentStatus} /></td>
                <td className="px-3 py-3.5">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${balance === 0 ? "bg-[#e4f3ed] text-[#28785f]" : order.paidCents > 0 ? "bg-[#fff3dc] text-[#9a6517]" : "bg-[#fae9e6] text-[#a84336]"}`}>
                    {order.totalCents <= 0 ? "Sin importe" : balance === 0 ? "Anotado completo" : order.paidCents > 0 ? `Parcial · ${formatBobs(balance)}` : "Pendiente"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right text-sm font-semibold tabular-nums text-[#28453b]">{formatBobs(order.totalCents)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
