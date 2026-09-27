import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Dashboard } from "@/components/dashboard";
import { previewOrders } from "@/modules/orders/preview-data";
import { getBusinessSummary, listOrders } from "@/modules/orders/data-access";
import type { BusinessSummary } from "@/modules/orders/data-access";
import type { OrderView } from "@/modules/orders/types";
import { getWorkspaceContext } from "@/lib/workspace";
import { createBusiness } from "@/modules/auth/actions";

function WorkspaceSetup({ userLabel, error }: { userLabel: string; error?: string }) {
  return (
    <AppShell businessName="Configura tu comercio" userLabel={userLabel}>
      <section className="mx-auto max-w-2xl rounded-2xl border border-[#e1eae6] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#19755d]">Primer paso</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#18372f]">Crea tu espacio de trabajo</h1>
        <p className="mt-2 text-sm leading-6 text-[#71877d]">El espacio representa al comercio que usará el sistema. Los pedidos quedarán separados por comercio y el acceso se aplicará también en PostgreSQL.</p>
        {error ? <p role="alert" className="mt-5 rounded-xl border border-[#f0d2cb] bg-[#fff4f1] px-4 py-3 text-sm text-[#a84336]">{error === "business-first" ? "Crea el espacio de trabajo antes de registrar pedidos." : error === "business-name" ? "El nombre debe tener entre 2 y 80 caracteres." : "No se pudo crear el comercio. Revisa la conexión y la migración de Supabase."}</p> : null}
        <form action={createBusiness} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-[#345246]" htmlFor="business-name">Nombre del comercio</label>
          <input id="business-name" name="name" required minLength={2} maxLength={80} placeholder="Ej. BYTE-CX Tienda Demo" className="h-11 w-full rounded-xl border border-[#d9e5df] bg-white px-3 text-sm text-[#18332d] outline-none placeholder:text-[#9aaca2] focus:border-[#41977a] focus:ring-4 focus:ring-[#41977a]/10" />
          <button className="h-10 rounded-xl bg-[#18775e] px-4 text-sm font-semibold text-white transition hover:bg-[#12624d]">Crear espacio</button>
        </form>
      </section>
    </AppShell>
  );
}

function DatabaseSetupNotice() {
  return (
    <AppShell businessName="Conexión pendiente" userLabel="Configuración">
      <section className="mx-auto max-w-2xl rounded-2xl border border-[#e1eae6] bg-white p-6 sm:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#19755d]">Configuración del entorno</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#18372f]">La base de datos necesita atención</h1>
        <p className="mt-2 text-sm leading-6 text-[#71877d]">La app pudo contactar su configuración de Supabase, pero no encontró la estructura esperada. Aplica la migración que está en <code className="rounded bg-[#edf4f1] px-1.5 py-0.5 text-xs">supabase/migrations</code> y vuelve a cargar.</p>
      </section>
    </AppShell>
  );
}

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  const workspace = await getWorkspaceContext();

  if (workspace.mode === "unauthenticated") {
    redirect("/login");
  }

  if (workspace.mode === "preview") {
    return <Dashboard orders={previewOrders} businessName="BYTE-CX · Tienda Demo" userLabel="Alex Mendoza" preview />;
  }

  if (workspace.mode === "onboarding") {
    return <WorkspaceSetup userLabel={workspace.user.email ?? "Usuario"} error={error} />;
  }

  if (workspace.mode === "unavailable") {
    return <DatabaseSetupNotice />;
  }

  let orders: OrderView[];
  let summary: BusinessSummary;
  try {
    [orders, summary] = await Promise.all([
      listOrders(workspace.supabase, workspace.business.id),
      getBusinessSummary(workspace.supabase, workspace.business.id),
    ]);
  } catch {
    return <DatabaseSetupNotice />;
  }
  return <Dashboard
    orders={orders}
    summary={summary}
    businessName={workspace.business.name}
    userLabel={workspace.user.email ?? "Usuario"}
    preview={false}
    businesses={workspace.businesses}
    activeBusinessId={workspace.business.id}
    userId={workspace.user.id}
  />;
}
