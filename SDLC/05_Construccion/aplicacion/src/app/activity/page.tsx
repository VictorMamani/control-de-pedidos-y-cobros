import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock3, Package } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getWorkspaceContext } from "@/lib/workspace";
import { listBusinessActivity } from "@/modules/orders/data-access";
import type { HistoryItem } from "@/modules/orders/data-access";
import type { WorkspaceBusiness } from "@/lib/workspace";

function ActivityList({
  events,
  businessName,
  userLabel,
  userId,
  preview,
  businesses,
  activeBusinessId,
  failed = false,
}: {
  events: HistoryItem[];
  businessName: string;
  userLabel: string;
  userId?: string;
  preview: boolean;
  businesses?: WorkspaceBusiness[];
  activeBusinessId?: string;
  failed?: boolean;
}) {
  return (
    <AppShell businessName={businessName} userLabel={userLabel} preview={preview} businesses={businesses} activeBusinessId={activeBusinessId}>
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-[#18372f]">Historial de actividad</h1>
        <p className="mt-1.5 text-sm leading-6 text-[#61796e]">Cambios registrados en cotizaciones, pedidos, preparación y cobros de {businessName}.</p>
      </div>
      {failed ? <p role="alert" className="mt-5 rounded-lg border border-[#f0d2cb] bg-[#fff4f1] px-4 py-3 text-sm text-[#a84336]">No se pudo consultar el historial. Revisa la conexión con Supabase.</p> : null}
      {preview ? <p role="status" className="mt-5 rounded-lg border border-[#f1d69e] bg-[#fff9eb] px-4 py-3 text-sm text-[#806026]">La vista previa no conserva un historial; estos datos no representan eventos persistidos.</p> : null}
      <section aria-label="Eventos recientes" className="mt-6 border-y border-[#dfe9e4] bg-white">
        {events.length === 0 ? <div className="px-5 py-10"><p className="text-sm font-semibold text-[#29463b]">No hay eventos para mostrar</p><p className="mt-1 text-sm leading-6 text-[#71877d]">Los cambios que se guarden aparecerán aquí con hora y actor.</p><Link href="/orders" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#16765d] hover:underline"><Package aria-hidden="true" className="size-3.5" /> Ver pedidos</Link></div> : (
          <ol className="divide-y divide-[#edf1ef]">
            {events.map((event, index) => (
              <li key={`${event.action}-${event.createdAt}-${index}`} className="flex gap-3 px-4 py-4 sm:px-5">
                <Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#347b64]" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#29463b]">{event.message}</p>
                  <p className="mt-1 text-[11px] text-[#71877d]">{event.createdAt}{event.actorId ? ` · ${event.actorId === userId ? "Tú" : `Usuario · ${event.actorId.slice(0, 8)}`}` : " · Usuario desconocido"}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </AppShell>
  );
}

export default async function ActivityPage() {
  const workspace = await getWorkspaceContext();
  if (workspace.mode === "unauthenticated") redirect("/login");
  if (workspace.mode === "onboarding") redirect("/");
  if (workspace.mode === "preview") return <ActivityList events={[]} businessName="BYTE-CX · Tienda Demo" userLabel="Vista de aprendizaje" preview />;
  if (workspace.mode === "unavailable") return <ActivityList events={[]} businessName="Conexión pendiente" userLabel="Configuración" preview={false} failed />;
  let events: HistoryItem[] = [];
  let failed = false;
  try { events = await listBusinessActivity(workspace.supabase, workspace.business.id); } catch { failed = true; }
  return <ActivityList events={events} businessName={workspace.business.name} userLabel={workspace.user.email ?? "Usuario"} userId={workspace.user.id} preview={false} businesses={workspace.businesses} activeBusinessId={workspace.business.id} failed={failed} />;
}
