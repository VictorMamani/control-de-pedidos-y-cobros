import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Check, Clock3, Package, ReceiptText, Wallet } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { FulfillmentBadge, OrderBadge } from "@/components/status-badge";
import { getWorkspaceContext } from "@/lib/workspace";
import type { WorkspaceBusiness } from "@/lib/workspace";
import { formatBobs, formatQuantity } from "@/lib/money";
import { getOrderDetail, type OrderDetailView } from "@/modules/orders/data-access";
import { previewOrders } from "@/modules/orders/preview-data";
import type { FulfillmentStatus, OrderView } from "@/modules/orders/types";
import { cancelOrder, changeFulfillment, recordPayment, reversePayment } from "@/modules/orders/actions";

type HistoryItem = OrderDetailView["history"][number];
type PaymentItem = OrderDetailView["payments"][number];
type LineItem = OrderDetailView["lines"][number];

const nextSteps: Partial<Record<FulfillmentStatus, { value: "preparing" | "ready" | "delivered"; label: string }>> = {
  not_started: { value: "preparing", label: "Iniciar preparación" },
  preparing: { value: "ready", label: "Marcar listo para retirar" },
  ready: { value: "delivered", label: "Marcar como entregado" },
};

function paymentMethod(method: string) {
  const labels: Record<string, string> = {
    cash: "Efectivo",
    transfer_reported: "Transferencia anotada",
    qr_reported: "QR anotado",
    other: "Otro método anotado",
  };
  return labels[method] ?? method;
}

function errorMessage(error?: string) {
  if (!error) return null;
  const messages: Record<string, string> = {
    setup: "Los cambios están desactivados en la vista previa.",
    connection: "No se pudo conectar con la base de datos.",
    transition: "Ese cambio de preparación no está permitido desde el estado actual.",
    balance: "El importe supera el saldo pendiente del pedido.",
    reversed: "Ese cobro ya se había revertido.",
    permission: "Tu rol no puede cancelar pedidos.",
    "payments-open": "Primero revierte los cobros vigentes para cancelar este pedido.",
    expired: "La cotización venció y ya no se puede convertir.",
    save: "No se pudo guardar el cambio. Revisa la conexión e inténtalo otra vez.",
  };
  return messages[error] ?? "No se pudo completar el cambio.";
}

function TransitionForm({ order }: { order: OrderView }) {
  const next = nextSteps[order.fulfillmentStatus];
  if (!next || order.commercialStatus === "cancelled") {
    return <p className="text-xs text-[#71877d]">La preparación de este pedido ya finalizó.</p>;
  }

  return (
    <form action={changeFulfillment}>
      <input type="hidden" name="orderId" value={order.id} />
      <input type="hidden" name="nextStatus" value={next.value} />
      <button className="h-10 rounded-xl bg-[#18775e] px-4 text-sm font-semibold text-white transition hover:bg-[#12624d]">{next.label}</button>
    </form>
  );
}

function PaymentForm({ order, balanceCents }: { order: OrderView; balanceCents: number }) {
  if (balanceCents <= 0 || order.commercialStatus === "cancelled") {
    return <p className="text-xs text-[#71877d]">No hay saldo pendiente para anotar.</p>;
  }

  return (
    <form action={recordPayment} className="space-y-4">
      <input type="hidden" name="orderId" value={order.id} />
      <div>
        <label htmlFor="amount" className="mb-1.5 block text-xs font-semibold text-[#345246]">Importe anotado (Bs)</label>
        <input id="amount" name="amount" type="number" inputMode="decimal" min="0.01" max={balanceCents / 100} step="0.01" required className="h-10 w-full rounded-xl border border-[#d9e5df] bg-white px-3 text-sm outline-none focus:border-[#41977a] focus:ring-4 focus:ring-[#41977a]/10" />
        <p className="mt-1 text-[10px] text-[#84958e]">Saldo pendiente: {formatBobs(balanceCents)}</p>
      </div>
      <div>
        <label htmlFor="methodLabel" className="mb-1.5 block text-xs font-semibold text-[#345246]">Método informado</label>
        <select id="methodLabel" name="methodLabel" required defaultValue="cash" className="h-10 w-full rounded-xl border border-[#d9e5df] bg-white px-3 text-sm outline-none focus:border-[#41977a] focus:ring-4 focus:ring-[#41977a]/10">
          <option value="cash">Efectivo</option>
          <option value="transfer_reported">Transferencia anotada</option>
          <option value="qr_reported">QR anotado</option>
          <option value="other">Otro</option>
        </select>
      </div>
      <button className="h-10 w-full rounded-xl border border-[#cfe2d8] bg-[#f5faf7] px-4 text-sm font-semibold text-[#28785f] transition hover:bg-[#eaf5ee]">Anotar cobro</button>
    </form>
  );
}

function Timeline({ history, createdLabel, userId }: { history: HistoryItem[]; createdLabel: string; userId?: string }) {
  const items: HistoryItem[] = history.length > 0 ? history : [{ action: "order.created", message: "Pedido registrado", actorId: userId ?? null, createdAt: createdLabel }];

  return (
    <ol className="space-y-4">
      {items.map((item, index) => (
        <li key={`${item.action}-${item.createdAt}-${index}`} className="flex gap-3">
          <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#edf4f1] text-[#347b64]">
            {item.action === "order.fulfillment.changed" && item.message.endsWith("entregado") ? <Check aria-hidden="true" className="size-3.5" /> : <Clock3 aria-hidden="true" className="size-3.5" />}
          </span>
          <div>
            <p className="text-xs font-semibold text-[#29463b]">{item.message}</p>
            <p className="mt-1 text-[11px] text-[#83958c]">{item.createdAt}{item.actorId ? ` · ${item.actorId === userId ? "Tú" : `Usuario · ${item.actorId.slice(0, 8)}`}` : " · Usuario desconocido"}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function OrderDetail({
  order,
  lines,
  payments,
  history,
  businessName,
  userLabel,
  preview,
  error,
  updated,
  paymentRecorded,
  reversed,
  cancelled,
  converted,
  userId,
  businesses,
  activeBusinessId,
  role,
}: {
  order: OrderView;
  lines: LineItem[];
  payments: PaymentItem[];
  history: HistoryItem[];
  businessName: string;
  userLabel: string;
  preview: boolean;
  error?: string;
  updated: boolean;
  paymentRecorded: boolean;
  reversed: boolean;
  cancelled: boolean;
  converted: boolean;
  userId?: string;
  businesses?: WorkspaceBusiness[];
  activeBusinessId?: string;
  role?: WorkspaceBusiness["role"];
}) {
  const balanceCents = Math.max(order.totalCents - order.paidCents, 0);
  const hasActivePayments = payments.some((payment) => !payment.isReversal && !payment.reversedById);
  const canCancel = role === "owner" || role === "manager";

  return (
    <AppShell businessName={businessName} userLabel={userLabel} preview={preview} businesses={businesses} activeBusinessId={activeBusinessId}>
      <div className="mx-auto max-w-6xl">
        <Link href="/orders" className="inline-flex items-center gap-2 text-xs font-semibold text-[#6e867a] hover:text-[#16765d]"><ArrowLeft aria-hidden="true" className="size-4" /> Volver a pedidos</Link>
        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#19755d]">Detalle del pedido · {order.reference}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#18372f]">{order.itemDescription}</h1>
            <p className="mt-1.5 text-sm text-[#71877d]">{order.customerLabel} · Registrado {order.createdLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2"><OrderBadge status={order.commercialStatus} /><FulfillmentBadge status={order.fulfillmentStatus} /></div>
        </div>

        {error ? <p role="alert" className="mt-5 rounded-xl border border-[#f0d2cb] bg-[#fff4f1] px-4 py-3 text-sm text-[#a84336]">{errorMessage(error)}</p> : null}
        {updated ? <p role="status" className="mt-5 rounded-xl border border-[#cde5d9] bg-[#eff8f3] px-4 py-3 text-sm text-[#28785f]">Se actualizó la etapa de preparación.</p> : null}
        {paymentRecorded ? <p role="status" className="mt-5 rounded-xl border border-[#cde5d9] bg-[#eff8f3] px-4 py-3 text-sm text-[#28785f]">El cobro quedó anotado manualmente.</p> : null}
        {reversed ? <p role="status" className="mt-5 rounded-xl border border-[#cde5d9] bg-[#eff8f3] px-4 py-3 text-sm text-[#28785f]">El cobro se revirtió y el saldo se actualizó.</p> : null}
        {cancelled ? <p role="status" className="mt-5 rounded-xl border border-[#cde5d9] bg-[#eff8f3] px-4 py-3 text-sm text-[#28785f]">El pedido quedó cancelado; su historial se conserva.</p> : null}
        {order.commercialStatus === "cancelled" && order.cancelledReason ? <p className="mt-3 text-sm text-[#71877d]">Motivo de cancelación: {order.cancelledReason}</p> : null}
        {converted ? <p role="status" className="mt-5 rounded-xl border border-[#cde5d9] bg-[#eff8f3] px-4 py-3 text-sm text-[#28785f]">Pedido creado desde la cotización. Las líneas y precios quedaron copiados como snapshot.</p> : null}
        {preview ? <p className="mt-5 rounded-xl border border-[#f1d69e] bg-[#fff9eb] px-4 py-3 text-sm text-[#806026]">Datos ficticios. Los cambios están desactivados hasta conectar Supabase.</p> : null}

        <div className="mt-6 grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
          <div className="min-w-0 space-y-5">
            <section className="overflow-hidden rounded-2xl border border-[#e1eae6] bg-white shadow-[0_6px_24px_rgba(31,70,57,0.035)]">
              <div className="flex items-center gap-3 border-b border-[#e7eeeb] px-5 py-4"><Package aria-hidden="true" className="size-4 text-[#347b64]" /><div><h2 className="text-sm font-bold text-[#203d33]">Detalle de productos</h2><p className="mt-0.5 text-xs text-[#81938b]">Instantáneas de la descripción y precio acordado</p></div></div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead><tr className="border-b border-[#edf1ef] text-[10px] font-bold uppercase tracking-[0.08em] text-[#80958c]"><th className="px-5 py-3">Producto</th><th className="px-3 py-3">Cantidad</th><th className="px-3 py-3">Precio unitario</th><th className="px-5 py-3 text-right">Importe</th></tr></thead>
                  <tbody>{lines.map((line) => <tr key={line.id} className="border-b border-[#edf1ef] last:border-0"><td className="px-5 py-4"><p className="font-semibold text-[#29463b]">{line.description}</p>{line.sku ? <p className="mt-1 text-[11px] text-[#83958c]">Ref. {line.sku}</p> : null}</td><td className="px-3 py-4 tabular-nums text-[#526c60]">{formatQuantity(line.quantity)}</td><td className="px-3 py-4 tabular-nums text-[#526c60]">{formatBobs(line.unitPriceCents)}</td><td className="px-5 py-4 text-right font-semibold tabular-nums text-[#28453b]">{formatBobs(line.totalCents)}</td></tr>)}</tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-[#e7eeeb] px-5 py-4"><p className="text-sm font-semibold text-[#526c60]">Total del pedido</p><p className="text-lg font-bold tabular-nums text-[#1d3830]">{formatBobs(order.totalCents)}</p></div>
            </section>

            <section className="rounded-2xl border border-[#e1eae6] bg-white p-5 shadow-[0_6px_24px_rgba(31,70,57,0.035)]">
              <div className="flex items-center gap-3"><Clock3 aria-hidden="true" className="size-4 text-[#347b64]" /><div><h2 className="text-sm font-bold text-[#203d33]">Preparación y entrega</h2><p className="mt-0.5 text-xs text-[#81938b]">Avanza una etapa a la vez; cada cambio queda en el historial.</p></div></div>
              <div className="mt-5 flex flex-col justify-between gap-4 rounded-xl bg-[#f5faf7] p-4 sm:flex-row sm:items-center">
                <div><p className="text-xs font-semibold text-[#29463b]">Estado actual</p><div className="mt-2"><FulfillmentBadge status={order.fulfillmentStatus} /></div></div>
                {preview ? <button disabled className="h-10 rounded-xl bg-[#18775e] px-4 text-sm font-semibold text-white opacity-50">Cambio desactivado</button> : <TransitionForm order={order} />}
              </div>
            </section>

            <section className="rounded-2xl border border-[#e1eae6] bg-white p-5 shadow-[0_6px_24px_rgba(31,70,57,0.035)]">
              <div className="flex items-center gap-3"><ReceiptText aria-hidden="true" className="size-4 text-[#347b64]" /><div><h2 className="text-sm font-bold text-[#203d33]">Historial</h2><p className="mt-0.5 text-xs text-[#81938b]">Registro de cambios del pedido</p></div></div>
              <div className="mt-5"><Timeline history={history} createdLabel={order.createdLabel} userId={userId} /></div>
            </section>
            {!preview && canCancel && order.commercialStatus === "confirmed" && order.fulfillmentStatus !== "delivered" ? (
              <details className="rounded-xl border border-[#ead8d4] bg-white p-4">
                <summary className="cursor-pointer text-sm font-semibold text-[#91483e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a84336]">Cancelar pedido</summary>
                {hasActivePayments ? <p className="mt-3 text-xs leading-5 text-[#7d625c]">Revertir primero los cobros vigentes para conservar el saldo y el historial coherentes.</p> : (
                  <form action={cancelOrder} className="mt-4 space-y-3">
                    <input type="hidden" name="orderId" value={order.id} />
                    <label htmlFor="cancel-reason" className="block text-xs font-semibold text-[#654a45]">Motivo breve</label>
                    <textarea id="cancel-reason" name="reason" required minLength={3} maxLength={160} rows={2} className="w-full rounded-lg border border-[#e4d5d1] bg-white px-3 py-2 text-sm outline-none focus:border-[#a84336] focus:ring-2 focus:ring-[#a84336]/15" />
                    <p id="cancel-reason-help" className="text-[11px] text-[#71877d]">No incluyas datos personales o financieros.</p>
                    <button className="h-9 rounded-lg border border-[#e2c9c4] px-3 text-xs font-semibold text-[#91483e] hover:bg-[#fff6f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a84336]">Confirmar cancelación</button>
                  </form>
                )}
              </details>
            ) : null}
          </div>

          <aside className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-[#e1eae6] bg-white p-5 shadow-[0_6px_24px_rgba(31,70,57,0.035)]">
              <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-[#203d33]">Cobros anotados</h2><p className="mt-0.5 text-xs text-[#81938b]">No confirma el ingreso de dinero</p></div><Wallet aria-hidden="true" className="size-4 text-[#a36b1a]" /></div>
              <div className="mt-4 rounded-xl bg-[#f8faf9] p-4"><div className="flex items-center justify-between text-xs"><span className="text-[#71877d]">Anotado neto</span><span className="font-semibold tabular-nums text-[#28453b]">{formatBobs(order.paidCents)}</span></div><div className="mt-2 flex items-center justify-between text-xs"><span className="text-[#71877d]">Saldo</span><span className="font-semibold tabular-nums text-[#a36b1a]">{formatBobs(balanceCents)}</span></div></div>
              {preview ? <div className="mt-5"><button disabled className="h-10 w-full rounded-xl border border-[#cfe2d8] bg-[#f5faf7] px-4 text-sm font-semibold text-[#28785f] opacity-50">Anotación desactivada</button></div> : <div className="mt-5"><PaymentForm order={order} balanceCents={balanceCents} /></div>}
              <div className="mt-5 border-t border-[#edf1ef] pt-4">
                <h3 className="text-xs font-bold text-[#526c60]">Movimientos</h3>
                {payments.length === 0 ? <p className="mt-3 text-xs text-[#84958e]">Todavía no hay cobros anotados.</p> : <ul className="mt-3 divide-y divide-[#edf1ef]">{payments.map((payment) => <li key={payment.id} className="py-3 first:pt-0 last:pb-0"><div className="flex items-start justify-between gap-3 text-xs"><div><p className="font-semibold text-[#29463b]">{payment.isReversal ? "Reversión de cobro" : paymentMethod(payment.methodLabel)}</p><p className="mt-1 text-[10px] text-[#83958c]">{payment.recordedAt} · {payment.recordedBy === userId ? "Tú" : `Usuario · ${payment.recordedBy.slice(0, 8)}`}</p>{payment.reversedById ? <p className="mt-1 text-[10px] font-medium text-[#91483e]">Revertido · el registro original se conserva</p> : null}{payment.reversalReason ? <p className="mt-1 text-[10px] text-[#71877d]">Motivo: {payment.reversalReason}</p> : null}{payment.reversesEntryId ? <p className="mt-1 text-[10px] text-[#83958c]">Relacionado con {payment.reversesEntryId.slice(0, 8)}</p> : null}</div><span className={`shrink-0 font-semibold tabular-nums ${payment.isReversal ? "text-[#a84336]" : "text-[#28785f]"}`}>{formatBobs(payment.amountCents)}</span></div>{!preview && !payment.isReversal && !payment.reversedById && order.commercialStatus === "confirmed" ? <details className="mt-2"><summary className="cursor-pointer text-[11px] font-semibold text-[#8a4a40] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a84336]">Revertir anotación</summary><form action={reversePayment} className="mt-2 space-y-2"><input type="hidden" name="orderId" value={order.id} /><input type="hidden" name="paymentId" value={payment.id} /><label htmlFor={`reason-${payment.id}`} className="block text-[11px] font-medium text-[#654a45]">Motivo · opcional</label><input id={`reason-${payment.id}`} name="reason" maxLength={160} className="h-9 w-full rounded-lg border border-[#e4d5d1] px-2 text-xs outline-none focus:border-[#a84336] focus:ring-2 focus:ring-[#a84336]/15" /><p className="text-[10px] text-[#71877d]">No incluyas datos personales o financieros.</p><button className="h-8 rounded-lg border border-[#e2c9c4] px-2.5 text-[11px] font-semibold text-[#91483e] hover:bg-[#fff6f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a84336]">Registrar reversión</button></form></details> : null}</li>)}</ul>}
              </div>
            </section>
            <p className="rounded-xl border border-[#dcebe3] bg-[#f5faf7] p-4 text-[11px] leading-5 text-[#688276]">Los importes de esta sección son registros informados por el comercio. No se conecta a bancos, QR ni proveedores de pago.</p>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function previewDetail(order: OrderView) {
  const lines: LineItem[] = [{ id: order.id, description: order.itemDescription, sku: null, quantity: 1, unitPriceCents: order.totalCents, totalCents: order.totalCents }];
  const payments: PaymentItem[] = order.paidCents > 0 ? [{
    id: `${order.id}-payment`, amountCents: order.paidCents, isReversal: false, reversesEntryId: null,
    reversedById: null, reversalReason: null, recordedBy: "demo", methodLabel: "cash", recordedAt: order.createdLabel,
  }] : [];
  const history: HistoryItem[] = [{ action: "order.created", message: "Pedido de demostración", actorId: "demo", createdAt: order.createdLabel }];
  return { order, lines, payments, history };
}

export default async function OrderDetailPage({ params, searchParams }: PageProps<"/orders/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const error = typeof query.error === "string" ? query.error : undefined;
  const workspace = await getWorkspaceContext();

  if (workspace.mode === "unauthenticated") redirect("/login");
  if (workspace.mode === "onboarding") redirect("/");

  if (workspace.mode === "preview") {
    const order = previewOrders.find((item) => item.id === id);
    if (!order) notFound();
    const detail = previewDetail(order);
    return <OrderDetail {...detail} businessName="BYTE-CX · Tienda Demo" userLabel="Alex Mendoza" preview error={error} updated={false} paymentRecorded={false} reversed={false} cancelled={false} converted={false} userId="demo" />;
  }

  if (workspace.mode === "unavailable") {
    return <AppShell businessName="Conexión pendiente" userLabel="Configuración"><p className="rounded-xl border border-[#f1d69e] bg-[#fff9eb] p-4 text-sm text-[#806026]">No se pudo consultar el pedido. Revisa las variables y migraciones de Supabase.</p></AppShell>;
  }

  let detail: OrderDetailView | null;
  try {
    detail = await getOrderDetail(workspace.supabase, workspace.business.id, id);
  } catch {
    return <AppShell businessName={workspace.business.name} userLabel={workspace.user.email ?? "Usuario"} businesses={workspace.businesses} activeBusinessId={workspace.business.id}><p role="alert" className="rounded-xl border border-[#f1d69e] bg-[#fff9eb] p-4 text-sm text-[#806026]">No se pudo consultar el pedido. Revisa la conexión con Supabase.</p></AppShell>;
  }
  if (!detail) notFound();

  return (
    <OrderDetail
      {...detail}
      businessName={workspace.business.name}
      userLabel={workspace.user.email ?? "Usuario"}
      preview={false}
      error={error}
      updated={query.updated === "1"}
      paymentRecorded={query.payment === "recorded"}
      reversed={query.reversed === "1"}
      cancelled={query.cancelled === "1"}
      converted={query.converted === "1"}
      userId={workspace.user.id}
      businesses={workspace.businesses}
      activeBusinessId={workspace.business.id}
      role={workspace.business.role}
    />
  );
}
