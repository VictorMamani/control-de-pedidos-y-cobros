import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Check, Clock3 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { formatBobs, formatQuantity } from "@/lib/money";
import { getWorkspaceContext } from "@/lib/workspace";
import type { WorkspaceBusiness } from "@/lib/workspace";
import { getQuotationDetail, type QuotationDetailView } from "@/modules/orders/data-access";
import type { QuotationStatus } from "@/modules/orders/types";
import { acceptQuotation, changeQuotationStatus } from "@/modules/orders/actions";

const statusLabels: Record<QuotationStatus, string> = {
  draft: "Borrador",
  sent: "Enviada",
  accepted: "Aceptada",
  declined: "Rechazada",
  expired: "Vencida",
};

const errors: Record<string, string> = {
  transition: "Esta cotización ya cambió de estado o aún no está enviada.",
  expired: "La fecha de vigencia pasó; no se puede aceptar.",
  save: "No se pudo guardar el cambio.",
  setup: "Conecta Supabase para cambiar el estado de la cotización.",
  connection: "No se pudo conectar con Supabase.",
};

function QuotationDetail({
  detail,
  businessName,
  userLabel,
  preview,
  error,
  updated,
  businesses,
  activeBusinessId,
  userId,
}: {
  detail: QuotationDetailView;
  businessName: string;
  userLabel: string;
  preview: boolean;
  error?: string;
  updated: boolean;
  businesses?: WorkspaceBusiness[];
  activeBusinessId?: string;
  userId?: string;
}) {
  const { quotation, lines } = detail;
  return (
    <AppShell businessName={businessName} userLabel={userLabel} preview={preview} businesses={businesses} activeBusinessId={activeBusinessId}>
      <div className="mx-auto max-w-5xl">
        <Link href="/quotations" className="inline-flex items-center gap-2 text-xs font-semibold text-[#6e867a] hover:text-[#16765d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18775e]"><ArrowLeft aria-hidden="true" className="size-4" /> Volver a cotizaciones</Link>
        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold text-[#557368]">{quotation.reference}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#18372f]">Cotización para {quotation.customerLabel}</h1>
            <p className="mt-1.5 text-sm text-[#71877d]">Creada {quotation.createdLabel} · Vigencia: {quotation.validUntil ?? "sin fecha"}</p>
          </div>
          <span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${quotation.status === "accepted" ? "bg-[#e4f3ed] text-[#28785f]" : quotation.status === "declined" || quotation.status === "expired" ? "bg-[#f6eae8] text-[#91483e]" : "bg-[#edf4f1] text-[#426e5e]"}`}>{statusLabels[quotation.status]}</span>
        </div>

        {error ? <p role="alert" className="mt-5 rounded-lg border border-[#f0d2cb] bg-[#fff4f1] px-4 py-3 text-sm text-[#a84336]">{errors[error] ?? "No se pudo completar el cambio."}</p> : null}
        {updated ? <p role="status" className="mt-5 rounded-lg border border-[#cde5d9] bg-[#eff8f3] px-4 py-3 text-sm text-[#28785f]">Se actualizó el estado de la cotización.</p> : null}
        {preview ? <p role="status" className="mt-5 rounded-lg border border-[#f1d69e] bg-[#fff9eb] px-4 py-3 text-sm text-[#806026]">Vista de solo lectura. Conecta Supabase para modificar cotizaciones.</p> : null}

        <section className="mt-6 overflow-hidden rounded-xl border border-[#dfe9e4] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[550px] text-left text-sm">
              <caption className="sr-only">Líneas de la cotización {quotation.reference}</caption>
              <thead><tr className="border-b border-[#e7eeeb] text-[10px] font-bold uppercase tracking-[0.08em] text-[#71877d]"><th scope="col" className="px-5 py-3">Descripción</th><th scope="col" className="px-3 py-3">Cantidad</th><th scope="col" className="px-3 py-3">Precio unitario</th><th scope="col" className="px-5 py-3 text-right">Importe</th></tr></thead>
              <tbody>{lines.map((line) => <tr key={line.id} className="border-b border-[#edf1ef] last:border-0"><th scope="row" className="px-5 py-4 font-semibold text-[#29463b]">{line.description}{line.sku ? <span className="mt-1 block text-[11px] font-normal text-[#71877d]">Ref. {line.sku}</span> : null}</th><td className="px-3 py-4 tabular-nums text-[#526c60]">{formatQuantity(line.quantity)}</td><td className="px-3 py-4 tabular-nums text-[#526c60]">{formatBobs(line.unitPriceCents)}</td><td className="px-5 py-4 text-right font-semibold tabular-nums text-[#28453b]">{formatBobs(line.totalCents)}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-[#e7eeeb] px-5 py-4"><p className="text-sm font-semibold text-[#526c60]">Total BOB</p><p className="text-lg font-bold tabular-nums text-[#1d3830]">{formatBobs(quotation.totalCents)}</p></div>
        </section>

        {!preview && quotation.status === "draft" ? <form action={changeQuotationStatus} className="mt-5"><input type="hidden" name="quotationId" value={quotation.id} /><input type="hidden" name="nextStatus" value="sent" /><button className="h-10 rounded-lg bg-[#18775e] px-4 text-sm font-semibold text-white hover:bg-[#12624d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18775e] focus-visible:ring-offset-2">Marcar como enviada</button></form> : null}
        {!preview && quotation.status === "sent" ? (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <form action={acceptQuotation}><input type="hidden" name="quotationId" value={quotation.id} /><button className="h-10 rounded-lg bg-[#18775e] px-4 text-sm font-semibold text-white hover:bg-[#12624d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18775e] focus-visible:ring-offset-2">Aceptar y crear pedido</button></form>
            <form action={changeQuotationStatus} className="flex items-center gap-2"><input type="hidden" name="quotationId" value={quotation.id} /><input type="hidden" name="nextStatus" value="declined" /><button className="h-10 rounded-lg border border-[#dfd1ce] px-3 text-sm font-semibold text-[#86544d] hover:bg-[#fff6f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a84336]">Marcar rechazada</button></form>
            <form action={changeQuotationStatus}><input type="hidden" name="quotationId" value={quotation.id} /><input type="hidden" name="nextStatus" value="expired" /><button className="h-10 rounded-lg px-3 text-sm font-semibold text-[#697b73] hover:bg-[#f3f7f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18775e]">Marcar vencida</button></form>
          </div>
        ) : null}
        {quotation.status === "accepted" && detail.orderId ? <Link href={`/orders/${detail.orderId}`} className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-[#cfe2d8] px-4 text-sm font-semibold text-[#28785f] hover:bg-[#f5faf7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18775e]"><Check aria-hidden="true" className="size-4" /> Abrir pedido generado</Link> : null}

        <section className="mt-8 border-t border-[#dfe9e4] pt-5">
          <h2 className="text-base font-bold text-[#203d33]">Historial de la cotización</h2>
          {detail.history.length === 0 ? <p className="mt-3 text-sm text-[#71877d]">Sin eventos registrados.</p> : <ol className="mt-4 space-y-3">{detail.history.map((item, index) => <li key={`${item.action}-${index}`} className="flex gap-3"><Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#347b64]" /><div><p className="text-sm font-medium text-[#29463b]">{item.message}</p><p className="mt-1 text-[11px] text-[#71877d]">{item.createdAt}{item.actorId ? ` · ${item.actorId === userId ? "Tú" : `Usuario · ${item.actorId.slice(0, 8)}`}` : " · Usuario desconocido"}</p></div></li>)}</ol>}
        </section>
        <p className="mt-6 text-xs leading-5 text-[#71877d]">Los importes describen una propuesta comercial. Aceptar genera un pedido y conserva las líneas acordadas como copia independiente.</p>
      </div>
    </AppShell>
  );
}

export default async function QuotationDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const workspace = await getWorkspaceContext();
  if (workspace.mode === "unauthenticated") redirect("/login");
  if (workspace.mode === "onboarding") redirect("/");
  if (workspace.mode === "preview") notFound();
  if (workspace.mode === "unavailable") return <AppShell businessName="Conexión pendiente" userLabel="Configuración"><p role="alert" className="rounded-lg border border-[#f1d69e] bg-[#fff9eb] p-4 text-sm text-[#806026]">No se pudo consultar la cotización. Revisa la configuración de Supabase.</p></AppShell>;

  let detail: QuotationDetailView | null;
  try {
    detail = await getQuotationDetail(workspace.supabase, workspace.business.id, id);
  } catch {
    return <AppShell businessName={workspace.business.name} userLabel={workspace.user.email ?? "Usuario"} businesses={workspace.businesses} activeBusinessId={workspace.business.id}><p role="alert" className="rounded-lg border border-[#f1d69e] bg-[#fff9eb] p-4 text-sm text-[#806026]">No se pudo consultar la cotización. Revisa la conexión con Supabase.</p></AppShell>;
  }
  if (!detail) notFound();
  return <QuotationDetail detail={detail} businessName={workspace.business.name} userLabel={workspace.user.email ?? "Usuario"} preview={false} error={typeof query.error === "string" ? query.error : undefined} updated={query.updated === "1"} businesses={workspace.businesses} activeBusinessId={workspace.business.id} userId={workspace.user.id} />;
}
