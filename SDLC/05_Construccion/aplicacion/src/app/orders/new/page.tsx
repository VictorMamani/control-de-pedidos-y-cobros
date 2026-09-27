import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Info } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getWorkspaceContext } from "@/lib/workspace";
import type { WorkspaceBusiness } from "@/lib/workspace";
import { createOrder } from "@/modules/orders/actions";

function OrderForm() {
  return (
    <form action={createOrder} className="space-y-5">
      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-semibold text-[#345246]">Producto o descripción</label>
        <input id="description" name="description" required minLength={2} maxLength={120} placeholder="Ej. Teclado mecánico K552" className="h-11 w-full rounded-xl border border-[#d9e5df] bg-white px-3 text-sm outline-none placeholder:text-[#9aaca2] focus:border-[#41977a] focus:ring-4 focus:ring-[#41977a]/10" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="sku" className="mb-1.5 block text-sm font-semibold text-[#345246]">Código o referencia <span className="font-normal text-[#8a9b93]">· opcional</span></label>
          <input id="sku" name="sku" maxLength={40} placeholder="Ej. K552-RGB" className="h-11 w-full rounded-xl border border-[#d9e5df] bg-white px-3 text-sm outline-none placeholder:text-[#9aaca2] focus:border-[#41977a] focus:ring-4 focus:ring-[#41977a]/10" />
        </div>
        <div>
          <label htmlFor="customerLabel" className="mb-1.5 block text-sm font-semibold text-[#345246]">Referencia del cliente <span className="font-normal text-[#8a9b93]">· opcional</span></label>
          <input id="customerLabel" name="customerLabel" maxLength={80} placeholder="Ej. Cliente mostrador" className="h-11 w-full rounded-xl border border-[#d9e5df] bg-white px-3 text-sm outline-none placeholder:text-[#9aaca2] focus:border-[#41977a] focus:ring-4 focus:ring-[#41977a]/10" />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="quantity" className="mb-1.5 block text-sm font-semibold text-[#345246]">Cantidad</label>
          <input id="quantity" name="quantity" type="number" inputMode="decimal" min="0.001" max="10000" step="0.001" defaultValue="1" required className="h-11 w-full rounded-xl border border-[#d9e5df] bg-white px-3 text-sm outline-none focus:border-[#41977a] focus:ring-4 focus:ring-[#41977a]/10" />
        </div>
        <div>
          <label htmlFor="unitPrice" className="mb-1.5 block text-sm font-semibold text-[#345246]">Precio unitario (Bs)</label>
          <input id="unitPrice" name="unitPrice" type="number" inputMode="decimal" min="0" max="10000000" step="0.01" required className="h-11 w-full rounded-xl border border-[#d9e5df] bg-white px-3 text-sm outline-none focus:border-[#41977a] focus:ring-4 focus:ring-[#41977a]/10" />
        </div>
      </div>
      <div className="rounded-xl border border-[#dcebe3] bg-[#f5faf7] p-4 text-xs leading-5 text-[#688276]">
        <p className="flex items-start gap-2 font-semibold text-[#386453]"><Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />Registro inicial</p>
        <p className="mt-1 pl-6">El pedido inicia confirmado y pendiente de preparación. Puedes registrar cobros manuales desde el detalle.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-[#e8efec] pt-5">
        <Button type="submit" className="h-10 px-4">Guardar pedido</Button>
        <Link href="/orders" className="h-10 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#658075] hover:bg-[#f3f7f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18775e]">Cancelar</Link>
      </div>
    </form>
  );
}

function ConfigurationNotice({ preview, connectionIssue }: { preview: boolean; connectionIssue: boolean }) {
  return (
    <div className="rounded-xl border border-[#f1d69e] bg-[#fff9eb] p-4 text-sm leading-6 text-[#806026]">
      {preview
        ? "Esta vista usa registros de ejemplo. Para guardar pedidos, configura tu proyecto Supabase y aplica la migración indicada en el README de esta aplicación."
        : connectionIssue
          ? "No se pudo confirmar la conexión con Supabase. Revisa las variables locales y que todas las migraciones estén aplicadas."
          : "Crea primero el espacio de trabajo desde el Resumen para registrar un pedido."}
    </div>
  );
}

export default async function NewOrderPage({ searchParams }: PageProps<"/orders/new">) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  const workspace = await getWorkspaceContext();

  if (workspace.mode === "unauthenticated") redirect("/login");
  if (workspace.mode === "onboarding") redirect("/");

  const preview = workspace.mode === "preview";
  const canSave = workspace.mode === "ready";
  const businessName = workspace.mode === "ready" ? workspace.business.name : workspace.mode === "unavailable" ? "Conexión pendiente" : "BYTE-CX · Tienda Demo";
  const userLabel = workspace.mode === "ready" ? workspace.user.email ?? "Usuario" : "Configuración";
  const connectionIssue = workspace.mode === "unavailable";
  const businesses: WorkspaceBusiness[] = workspace.mode === "ready" ? workspace.businesses : [];
  const activeBusinessId = workspace.mode === "ready" ? workspace.business.id : undefined;

  return (
    <AppShell businessName={businessName} userLabel={userLabel} preview={preview} businesses={businesses} activeBusinessId={activeBusinessId}>
      <div className="mx-auto max-w-3xl">
        <Link href="/orders" className="inline-flex items-center gap-2 text-xs font-semibold text-[#6e867a] hover:text-[#16765d]"><ArrowLeft aria-hidden="true" className="size-4" /> Volver a pedidos</Link>
        <div className="mt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#19755d]">Registro operativo</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#18372f]">Nuevo pedido</h1>
          <p className="mt-1.5 text-sm text-[#71877d]">Guarda una referencia y el precio acordado para el seguimiento interno.</p>
        </div>
        <section className="mt-6 rounded-2xl border border-[#e1eae6] bg-white p-5 shadow-[0_6px_24px_rgba(31,70,57,0.035)] sm:p-7">
          {!canSave ? <ConfigurationNotice preview={preview} connectionIssue={connectionIssue} /> : null}
          {error && error !== "setup" ? <p role="alert" className="mb-4 rounded-xl border border-[#f0d2cb] bg-[#fff4f1] px-4 py-3 text-sm text-[#a84336]">{error === "invalid" ? "Revisa la descripción, cantidad y precio. Usa hasta 3 decimales en la cantidad y 2 en el precio." : "No se pudo guardar el pedido. Revisa la conexión con Supabase."}</p> : null}
          {canSave ? <OrderForm /> : <fieldset disabled className="mt-5 opacity-60"><OrderForm /></fieldset>}
        </section>
        <p className="mt-4 text-xs leading-5 text-[#84958e]">No ingreses datos de tarjetas, cuentas bancarias, IMEI ni información personal innecesaria.</p>
      </div>
    </AppShell>
  );
}
