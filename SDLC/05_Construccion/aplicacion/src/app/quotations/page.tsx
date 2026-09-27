import Link from "next/link";
import { redirect } from "next/navigation";
import { FilePlus2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { formatBobs } from "@/lib/money";
import { getWorkspaceContext } from "@/lib/workspace";
import type { WorkspaceBusiness } from "@/lib/workspace";
import { listQuotations } from "@/modules/orders/data-access";
import type { QuotationStatus, QuotationView } from "@/modules/orders/types";

const statusLabels: Record<QuotationStatus, string> = {
  draft: "Borrador",
  sent: "Enviada",
  accepted: "Aceptada",
  declined: "Rechazada",
  expired: "Vencida",
};

function QuotationList({
  quotations,
  businessName,
  userLabel,
  preview,
  businesses,
  activeBusinessId,
  created,
  failed,
}: {
  quotations: QuotationView[];
  businessName: string;
  userLabel: string;
  preview: boolean;
  businesses?: WorkspaceBusiness[];
  activeBusinessId?: string;
  created: boolean;
  failed: boolean;
}) {
  return (
    <AppShell businessName={businessName} userLabel={userLabel} preview={preview} businesses={businesses} activeBusinessId={activeBusinessId}>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#18372f]">Cotizaciones</h1>
          <p className="mt-1.5 max-w-[65ch] text-sm leading-6 text-[#61796e]">Propuestas con estado, vigencia y líneas guardadas antes de crear un pedido.</p>
        </div>
        <Link href="/quotations/new" className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-[#18775e] px-3.5 text-sm font-semibold text-white hover:bg-[#12624d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18775e] focus-visible:ring-offset-2">
          <FilePlus2 aria-hidden="true" className="size-4" /> Nueva cotización
        </Link>
      </div>
      {created ? <p role="status" className="mt-5 rounded-lg border border-[#cde5d9] bg-[#eff8f3] px-4 py-3 text-sm text-[#28785f]">Se guardó el borrador de la cotización.</p> : null}
      {failed ? <p role="alert" className="mt-5 rounded-lg border border-[#f0d2cb] bg-[#fff4f1] px-4 py-3 text-sm text-[#a84336]">No se pudieron cargar las cotizaciones. Revisa la conexión con Supabase.</p> : null}
      {preview ? <p className="mt-5 rounded-lg border border-[#f1d69e] bg-[#fff9eb] px-4 py-3 text-sm text-[#806026]">Vista de solo lectura. Conecta Supabase para crear o actualizar cotizaciones.</p> : null}

      <section className="mt-6 overflow-hidden rounded-xl border border-[#dfe9e4] bg-white">
        <table className="w-full min-w-[660px] border-collapse text-left">
          <caption className="sr-only">Cotizaciones recientes de {businessName}</caption>
          <thead>
            <tr className="border-b border-[#e7eeeb] text-[10px] font-bold uppercase tracking-[0.08em] text-[#71877d]">
              <th scope="col" className="px-5 py-3">Referencia</th>
              <th scope="col" className="px-3 py-3">Cliente</th>
              <th scope="col" className="px-3 py-3">Estado</th>
              <th scope="col" className="px-3 py-3">Vigencia</th>
              <th scope="col" className="px-5 py-3 text-right">Total BOB</th>
            </tr>
          </thead>
          <tbody>
            {quotations.map((quotation) => (
              <tr key={quotation.id} className="border-b border-[#edf1ef] last:border-0 hover:bg-[#fbfdfc]">
                <th scope="row" className="px-5 py-4 text-sm font-semibold">
                  <Link href={`/quotations/${quotation.id}`} className="text-[#17664f] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18775e]">{quotation.reference}</Link>
                  <span className="mt-1 block text-[11px] font-normal text-[#71877d]">{quotation.createdLabel}</span>
                </th>
                <td className="px-3 py-4 text-sm text-[#526c60]">{quotation.customerLabel}</td>
                <td className="px-3 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${quotation.status === "accepted" ? "bg-[#e4f3ed] text-[#28785f]" : quotation.status === "declined" || quotation.status === "expired" ? "bg-[#f6eae8] text-[#91483e]" : "bg-[#edf4f1] text-[#426e5e]"}`}>{statusLabels[quotation.status]}</span></td>
                <td className="px-3 py-4 text-sm tabular-nums text-[#526c60]">{quotation.validUntil ?? "Sin fecha"}</td>
                <td className="px-5 py-4 text-right text-sm font-semibold tabular-nums text-[#28453b]">{formatBobs(quotation.totalCents)}</td>
              </tr>
            ))}
            {quotations.length === 0 ? <tr><td colSpan={5} className="px-6 py-12 text-center"><h2 className="text-sm font-semibold text-[#24443a]">Todavía no hay cotizaciones</h2><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[#71877e]">Crea un borrador con una o más líneas. Luego podrás marcarlo como enviado y convertirlo en pedido al aceptarlo.</p><Link href="/quotations/new" className="mt-4 inline-flex h-9 items-center rounded-lg border border-[#cfe2d8] px-3 text-xs font-semibold text-[#28785f] hover:bg-[#f5faf7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18775e]">Crear primera cotización</Link></td></tr> : null}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}

export default async function QuotationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const workspace = await getWorkspaceContext();
  if (workspace.mode === "unauthenticated") redirect("/login");
  if (workspace.mode === "onboarding") redirect("/");
  if (workspace.mode === "preview") return <QuotationList quotations={[]} businessName="BYTE-CX · Tienda Demo" userLabel="Vista de aprendizaje" preview created={params.created === "1"} failed={false} />;
  if (workspace.mode === "unavailable") return <QuotationList quotations={[]} businessName="Conexión pendiente" userLabel="Configuración" preview={false} created={false} failed />;

  let quotations: QuotationView[] = [];
  let failed = false;
  try { quotations = await listQuotations(workspace.supabase, workspace.business.id); } catch { failed = true; }
  return <QuotationList quotations={quotations} businessName={workspace.business.name} userLabel={workspace.user.email ?? "Usuario"} preview={false} businesses={workspace.businesses} activeBusinessId={workspace.business.id} created={params.created === "1"} failed={failed} />;
}
