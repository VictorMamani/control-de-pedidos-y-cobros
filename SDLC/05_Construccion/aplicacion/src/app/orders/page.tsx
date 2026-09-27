import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { OrderTable } from "@/components/order-table";
import { getWorkspaceContext } from "@/lib/workspace";
import { previewOrders } from "@/modules/orders/preview-data";
import { listOrders } from "@/modules/orders/data-access";
import type { OrderView } from "@/modules/orders/types";
import type { WorkspaceBusiness } from "@/lib/workspace";

function OrdersView({
  orders,
  businessName,
  userLabel,
  preview,
  created,
  connectionIssue = false,
  businesses,
  activeBusinessId,
}: {
  orders: OrderView[];
  businessName: string;
  userLabel: string;
  preview: boolean;
  created: boolean;
  connectionIssue?: boolean;
  businesses?: WorkspaceBusiness[];
  activeBusinessId?: string;
}) {
  return (
    <AppShell businessName={businessName} userLabel={userLabel} preview={preview} businesses={businesses} activeBusinessId={activeBusinessId}>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#19755d]">Operaciones</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#18372f]">Pedidos</h1>
          <p className="mt-1.5 text-sm text-[#71877d]">Consulta su etapa comercial, preparación y cobros anotados.</p>
        </div>
        <Link href="/orders/new" className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-[#18775e] px-4 text-sm font-semibold text-white transition hover:bg-[#12624d] sm:self-auto">
          <Plus aria-hidden="true" className="size-4" /> Nuevo pedido
        </Link>
      </div>

      {created ? <p role="status" className="mt-5 rounded-xl border border-[#cde5d9] bg-[#eff8f3] px-4 py-3 text-sm font-medium text-[#28785f]">El pedido se guardó correctamente.</p> : null}
      {connectionIssue ? <p role="alert" className="mt-5 rounded-xl border border-[#f1d69e] bg-[#fff9eb] px-4 py-3 text-sm text-[#806026]">No se pudo cargar la información. Revisa la configuración de Supabase y que todas las migraciones estén aplicadas.</p> : null}

      <section className="mt-6 overflow-hidden rounded-2xl border border-[#e1eae6] bg-white shadow-[0_6px_24px_rgba(31,70,57,0.035)]">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-[#203d33]">Todos los pedidos</h2>
            <p className="mt-0.5 text-xs text-[#81938b]">{preview ? "Datos de ejemplo" : `${orders.length} registros recientes`}</p>
          </div>
          <span className="rounded-full bg-[#edf4f1] px-2.5 py-1 text-[10px] font-semibold text-[#427565]">{orders.length} en lista</span>
        </div>
        <OrderTable orders={orders} />
        {preview ? <p className="border-t border-[#edf1ef] px-5 py-3 text-[11px] text-[#8a7a5e]">Estos datos son ficticios. Los cambios requieren conectar Supabase.</p> : null}
      </section>
    </AppShell>
  );
}

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const params = await searchParams;
  const created = typeof params.created === "string" ? params.created : undefined;
  const workspace = await getWorkspaceContext();

  if (workspace.mode === "unauthenticated") redirect("/login");
  if (workspace.mode === "onboarding") redirect("/");

  if (workspace.mode === "preview") {
    return <OrdersView orders={previewOrders} businessName="BYTE-CX · Tienda Demo" userLabel="Alex Mendoza" preview created={created === "1"} />;
  }
  if (workspace.mode === "unavailable") {
    return <OrdersView orders={[]} businessName="Conexión pendiente" userLabel="Configuración" preview={false} created={false} connectionIssue />;
  }

  let orders: OrderView[];
  try {
    orders = await listOrders(workspace.supabase, workspace.business.id);
  } catch {
    return <OrdersView orders={[]} businessName={workspace.business.name} userLabel={workspace.user.email ?? "Usuario"} preview={false} created={false} connectionIssue businesses={workspace.businesses} activeBusinessId={workspace.business.id} />;
  }
  return <OrdersView orders={orders} businessName={workspace.business.name} userLabel={workspace.user.email ?? "Usuario"} preview={false} created={created === "1"} businesses={workspace.businesses} activeBusinessId={workspace.business.id} />;
}
