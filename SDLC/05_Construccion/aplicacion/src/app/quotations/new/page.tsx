import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { QuotationLineEditor } from "@/components/quotation-line-editor";
import { getWorkspaceContext } from "@/lib/workspace";
import { createQuotation } from "@/modules/orders/actions";

const errors: Record<string, string> = {
  invalid: "Revisa el nombre del cliente, la fecha y los datos de cada línea.",
  lines: "Añade al menos una línea completa.",
  save: "No se pudo guardar la cotización. Revisa tu conexión con Supabase.",
};

export default async function NewQuotationPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  const workspace = await getWorkspaceContext();
  if (workspace.mode === "unauthenticated") redirect("/login");
  if (workspace.mode === "onboarding") redirect("/");

  const ready = workspace.mode === "ready";
  const preview = workspace.mode === "preview";
  const businessName = ready ? workspace.business.name : preview ? "BYTE-CX · Tienda Demo" : "Conexión pendiente";
  const userLabel = ready ? workspace.user.email ?? "Usuario" : preview ? "Vista de aprendizaje" : "Configuración";
  const businesses = ready ? workspace.businesses : [];
  const activeBusinessId = ready ? workspace.business.id : undefined;

  return (
    <AppShell businessName={businessName} userLabel={userLabel} preview={preview} businesses={businesses} activeBusinessId={activeBusinessId}>
      <div className="mx-auto max-w-4xl">
        <Link href="/quotations" className="inline-flex items-center gap-2 text-xs font-semibold text-[#6e867a] hover:text-[#16765d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18775e]"><ArrowLeft aria-hidden="true" className="size-4" /> Volver a cotizaciones</Link>
        <div className="mt-5 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-[#18372f]">Nueva cotización</h1>
          <p className="mt-1.5 text-sm leading-6 text-[#61796e]">Guarda una propuesta con sus precios actuales. Al aceptarla, las líneas se copian en el pedido.</p>
        </div>
        <section className="mt-6 rounded-xl border border-[#dfe9e4] bg-white p-5 sm:p-7">
          {!ready ? <p role="status" className="mb-5 rounded-lg border border-[#f1d69e] bg-[#fff9eb] px-4 py-3 text-sm leading-5 text-[#806026]">{preview ? "Vista de solo lectura. Conecta Supabase para guardar una cotización." : "No se pudo conectar con el comercio. Revisa las variables y migraciones de Supabase."}</p> : null}
          {error ? <p role="alert" className="mb-5 rounded-lg border border-[#f0d2cb] bg-[#fff4f1] px-4 py-3 text-sm text-[#a84336]">{errors[error] ?? "No se pudo completar la operación."}</p> : null}
          <form action={createQuotation} className="space-y-6">
            <fieldset disabled={!ready} className="grid gap-4 border-b border-[#e8efec] pb-6 sm:grid-cols-2">
              <div>
                <label htmlFor="customerName" className="mb-1.5 block text-sm font-semibold text-[#345246]">Referencia del cliente · opcional</label>
                <input id="customerName" name="customerName" maxLength={80} autoComplete="off" placeholder="Ej. Cliente mostrador" className="h-10 w-full rounded-lg border border-[#d9e5df] px-3 text-sm outline-none focus:border-[#41977a] focus:ring-2 focus:ring-[#41977a]/15" />
              </div>
              <div>
                <label htmlFor="contactValue" className="mb-1.5 block text-sm font-semibold text-[#345246]">Dato de contacto · opcional</label>
                <input id="contactValue" name="contactValue" maxLength={100} autoComplete="off" className="h-10 w-full rounded-lg border border-[#d9e5df] px-3 text-sm outline-none focus:border-[#41977a] focus:ring-2 focus:ring-[#41977a]/15" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="validUntil" className="mb-1.5 block text-sm font-semibold text-[#345246]">Válida hasta · opcional</label>
                <input id="validUntil" name="validUntil" type="date" className="h-10 w-full max-w-xs rounded-lg border border-[#d9e5df] px-3 text-sm outline-none focus:border-[#41977a] focus:ring-2 focus:ring-[#41977a]/15" />
              </div>
            </fieldset>
            <QuotationLineEditor disabled={!ready} />
            <div className="flex flex-wrap items-center gap-3 border-t border-[#e8efec] pt-5">
              {ready ? <Button type="submit" className="h-10 px-4">Guardar borrador</Button> : <Button type="button" disabled className="h-10 px-4">Guardar borrador</Button>}
              <Link href="/quotations" className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold text-[#658075] hover:bg-[#f3f7f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18775e]">Cancelar</Link>
            </div>
          </form>
        </section>
        <p className="mt-3 text-xs leading-5 text-[#71877d]">Registra solo la referencia mínima necesaria. Usa información ficticia mientras desarrollas.</p>
      </div>
    </AppShell>
  );
}
