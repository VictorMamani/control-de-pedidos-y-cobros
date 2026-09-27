import Link from "next/link";
import { ArrowRight, FilePlus2, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { OrderTable } from "@/components/order-table";
import { formatBobs } from "@/lib/money";
import type { WorkspaceBusiness } from "@/lib/workspace";
import type { BusinessSummary } from "@/modules/orders/data-access";
import type { OrderView } from "@/modules/orders/types";

function todayLabel() {
  return new Intl.DateTimeFormat("es-BO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/La_Paz",
  }).format(new Date());
}

export function Dashboard({
  orders,
  businessName,
  userLabel,
  preview,
  summary,
  businesses,
  activeBusinessId,
  userId,
}: {
  orders: OrderView[];
  businessName: string;
  userLabel: string;
  preview: boolean;
  summary?: BusinessSummary;
  businesses?: WorkspaceBusiness[];
  activeBusinessId?: string;
  userId?: string;
}) {
  const resolvedSummary = summary ?? {
    openOrders: orders.filter((order) => order.commercialStatus === "confirmed").length,
    preparingOrders: orders.filter((order) => order.fulfillmentStatus === "preparing").length,
    readyOrders: orders.filter((order) => order.fulfillmentStatus === "ready").length,
    pendingCents: orders.reduce((sum, order) => sum + Math.max(order.totalCents - order.paidCents, 0), 0),
    quoteCount: 0,
    recentActivity: [],
  };

  return (
    <AppShell
      businessName={businessName}
      userLabel={userLabel}
      preview={preview}
      businesses={businesses}
      activeBusinessId={activeBusinessId}
    >
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium capitalize text-[#557368]">{todayLabel()}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#18372f] sm:text-[34px]">Operaciones de hoy</h1>
          <p className="mt-1.5 max-w-[65ch] text-sm leading-6 text-[#61796e]">
            Pedidos, preparación y saldos anotados de {businessName}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <Link href="/quotations/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#cfe2d8] bg-white px-3.5 text-sm font-semibold text-[#28785f] hover:bg-[#f5faf7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18775e]">
            <FilePlus2 aria-hidden="true" className="size-4" /> Nueva cotización
          </Link>
          <Link href="/orders/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#18775e] px-3.5 text-sm font-semibold text-white hover:bg-[#12624d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18775e] focus-visible:ring-offset-2">
            <Plus aria-hidden="true" className="size-4" /> Nuevo pedido
          </Link>
        </div>
      </div>

      <section aria-label="Resumen del comercio" className="mt-7 grid grid-cols-2 divide-x divide-y divide-[#dce7e2] border-y border-[#dce7e2] bg-white sm:grid-cols-3 sm:divide-y-0 xl:grid-cols-5">
        <SummaryItem label="Pedidos abiertos" value={String(resolvedSummary.openOrders)} />
        <SummaryItem label="En preparación" value={String(resolvedSummary.preparingOrders)} />
        <SummaryItem label="Listos" value={String(resolvedSummary.readyOrders)} />
        <SummaryItem label="Cotizaciones abiertas" value={String(resolvedSummary.quoteCount)} />
        <SummaryItem label="Saldo pendiente" value={formatBobs(resolvedSummary.pendingCents)} />
      </section>

      <div className="mt-8 grid items-start gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.75fr)]">
        <section className="min-w-0">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#203d33]">Pedidos recientes</h2>
              <p className="mt-1 text-xs text-[#71877d]">Estado comercial, preparación y saldo por pedido</p>
            </div>
            <Link href="/orders" className="inline-flex items-center gap-1 text-xs font-semibold text-[#16765d] hover:text-[#115d4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18775e]">
              Ver todos <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-[#dfe9e4] bg-white">
            <OrderTable orders={orders} compact />
          </div>
          {preview ? <p className="mt-2 text-[11px] text-[#7c6b50]">Registros sintéticos de solo lectura; no se guardan cambios.</p> : null}
        </section>

        <section aria-labelledby="recent-activity-title" className="min-w-0">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 id="recent-activity-title" className="text-base font-bold text-[#203d33]">Actividad reciente</h2>
              <p className="mt-1 text-xs text-[#71877d]">Acciones anotadas por el equipo</p>
            </div>
            <Link href="/activity" className="inline-flex items-center gap-1 text-xs font-semibold text-[#16765d] hover:text-[#115d4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18775e]">
              Historial <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          </div>
          {resolvedSummary.recentActivity.length > 0 ? (
            <ol className="divide-y divide-[#e8efec] border-y border-[#dfe9e4] bg-white">
              {resolvedSummary.recentActivity.map((event, index) => (
                <li key={`${event.action}-${event.createdAt}-${index}`} className="py-3">
                  <p className="text-sm font-medium text-[#29463b]">{event.message}</p>
                  <p className="mt-1 text-[11px] text-[#71877d]">{event.createdAt}{event.actorId ? ` · ${event.actorId === userId ? "Tú" : shortActor(event.actorId)}` : " · Usuario desconocido"}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="border-y border-[#dfe9e4] py-4 text-sm leading-6 text-[#71877d]">
              {preview ? "El modo de vista previa no incluye un registro persistente de actividad." : "Todavía no hay actividad para este comercio."}
            </p>
          )}
          <p className="mt-4 text-xs leading-5 text-[#6f8178]">Los cobros son apuntes del comercio. No verifican depósitos ni pagos recibidos por una entidad financiera.</p>
        </section>
      </div>
    </AppShell>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-4 py-3.5 sm:px-5">
      <p className="text-[11px] font-medium text-[#71877d]">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold tabular-nums text-[#203d33]">{value}</p>
    </div>
  );
}

function shortActor(id: string) {
  return `Usuario · ${id.slice(0, 8)}`;
}
