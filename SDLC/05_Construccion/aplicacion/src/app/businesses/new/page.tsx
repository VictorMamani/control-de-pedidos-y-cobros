import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { createBusiness } from "@/modules/auth/actions";
import { getWorkspaceContext } from "@/lib/workspace";

export default async function NewBusinessPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const workspace = await getWorkspaceContext();
  if (workspace.mode === "unauthenticated") redirect("/login");
  if (workspace.mode === "onboarding") redirect("/");
  if (workspace.mode === "preview") redirect("/?error=setup");

  const ready = workspace.mode === "ready";
  const businessName = ready ? workspace.business.name : "Conexión pendiente";
  const userLabel = ready ? workspace.user.email ?? "Usuario" : "Configuración";
  return (
    <AppShell businessName={businessName} userLabel={userLabel} businesses={ready ? workspace.businesses : []} activeBusinessId={ready ? workspace.business.id : undefined}>
      <div className="mx-auto max-w-xl">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-[#6e867a] hover:text-[#16765d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18775e]"><ArrowLeft aria-hidden="true" className="size-4" /> Volver al resumen</Link>
        <section className="mt-5 rounded-xl border border-[#dfe9e4] bg-white p-5 sm:p-7">
          <h1 className="text-2xl font-bold tracking-tight text-[#18372f]">Añadir comercio</h1>
          <p className="mt-2 text-sm leading-6 text-[#61796e]">Cada comercio tiene sus propios pedidos, cotizaciones y miembros. Al crearlo, quedará seleccionado para esta sesión.</p>
          {params.error === "business-name" ? <p role="alert" className="mt-4 rounded-lg border border-[#f0d2cb] bg-[#fff4f1] px-4 py-3 text-sm text-[#a84336]">Usa entre 2 y 80 caracteres.</p> : null}
          {params.error === "business" ? <p role="alert" className="mt-4 rounded-lg border border-[#f0d2cb] bg-[#fff4f1] px-4 py-3 text-sm text-[#a84336]">No se pudo crear el comercio. Revisa la conexión con Supabase.</p> : null}
          {!ready ? <p role="status" className="mt-4 rounded-lg border border-[#f1d69e] bg-[#fff9eb] px-4 py-3 text-sm text-[#806026]">No se pudo cargar la membresía. Revisa la conexión con Supabase.</p> : null}
          <form action={createBusiness} className="mt-5 space-y-4">
            <div>
              <label htmlFor="business-name" className="mb-1.5 block text-sm font-semibold text-[#345246]">Nombre del comercio</label>
              <input id="business-name" name="name" required minLength={2} maxLength={80} autoComplete="organization" className="h-11 w-full rounded-lg border border-[#d9e5df] px-3 text-sm outline-none focus:border-[#41977a] focus:ring-2 focus:ring-[#41977a]/15" />
            </div>
            <div className="flex flex-wrap gap-3 border-t border-[#e8efec] pt-4">
              <button disabled={!ready} className="h-10 rounded-lg bg-[#18775e] px-4 text-sm font-semibold text-white hover:bg-[#12624d] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18775e] focus-visible:ring-offset-2">Crear comercio</button>
              <Link href="/" className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-semibold text-[#658075] hover:bg-[#f3f7f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18775e]">Cancelar</Link>
            </div>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
