"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  FileClock,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
} from "lucide-react";
import type { ReactNode } from "react";
import { selectBusiness, signOut } from "@/modules/auth/actions";
import type { WorkspaceBusiness } from "@/lib/workspace";

type AppShellProps = {
  children: ReactNode;
  businessName: string;
  userLabel: string;
  preview?: boolean;
  businesses?: WorkspaceBusiness[];
  activeBusinessId?: string;
};

const primaryLinks = [
  { href: "/", label: "Resumen", icon: LayoutDashboard },
  { href: "/orders", label: "Pedidos", icon: Package },
  { href: "/quotations", label: "Cotizaciones", icon: FileText },
  { href: "/activity", label: "Historial", icon: FileClock },
];

export function AppShell({ children, businessName, userLabel, preview = false, businesses = [], activeBusinessId }: AppShellProps) {
  const pathname = usePathname();
  const initials = userLabel.slice(0, 1).toLocaleUpperCase("es-BO");

  return (
    <div className="min-h-screen bg-[#f3f7f6] text-[#18332d]">
      <aside className="bg-[#173a32] text-[#d8e6e0] lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[248px] lg:flex-col">
        <div className="flex items-center gap-3 px-5 py-4 lg:px-6 lg:pt-6">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#dcefe5] text-lg font-black text-[#173a32]">B</div>
          <div className="min-w-0">
            <p className="font-bold tracking-tight text-white">BYTE-CX</p>
            <p className="text-xs text-[#aac4b8]">Operaciones de venta</p>
          </div>
        </div>

        <div className="hidden px-6 pb-2 pt-7 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8eafa1] lg:block">
          Espacio de trabajo
        </div>
        <nav aria-label="Navegación principal" className="grid grid-cols-2 gap-1 px-3 pb-3 sm:flex sm:flex-wrap lg:block lg:px-3">
          {primaryLinks.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#173a32] sm:gap-3 lg:mb-1 ${
                  active ? "bg-[#285247] font-semibold text-white" : "text-[#bdd0c7] hover:bg-[#20483d] hover:text-white"
                }`}
              >
                <Icon aria-hidden="true" className="size-[18px]" />
                {label}
                {label === "Pedidos" && active ? <ChevronRight aria-hidden="true" className="ml-auto size-4" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="hidden px-3 lg:mt-auto lg:block">
          <div className="mb-3 rounded-xl border border-[#42665a] bg-[#20483d] p-3" aria-label="Comercio activo">
            <p className="text-[10px] text-[#aac4b8]">Comercio activo</p>
            <p className="mt-1 truncate text-sm font-semibold text-white">{businessName}</p>
          </div>
          <div className="-mx-3 mt-2 flex items-center gap-3 border-t border-[#36594e] px-5 py-4">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#dcefe5] text-xs font-bold text-[#173a32]">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{userLabel}</p>
              <p className="text-[10px] text-[#aac4b8]">{preview ? "Vista de aprendizaje" : "Sesión activa"}</p>
            </div>
            {!preview ? (
              <form action={signOut}>
                <button aria-label="Cerrar sesión" className="rounded-lg p-2 text-[#bdd0c7] hover:bg-[#285247] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                  <LogOut aria-hidden="true" className="size-4" />
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="flex min-h-[68px] flex-wrap items-center justify-between gap-3 border-b border-[#e0e9e5] bg-white px-5 py-3 sm:px-8">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#70877e]">BYTE-CX</span>
            <ChevronRight aria-hidden="true" className="size-4 text-[#9cafaa]" />
            <span className="font-semibold text-[#18332d]">{pageTitle(pathname)}</span>
          </div>
          {businesses.length > 1 && activeBusinessId ? (
            <form action={selectBusiness} className="flex min-w-0 items-center gap-2" aria-label="Cambiar comercio activo">
              <label htmlFor="active-business" className="sr-only">Comercio activo</label>
              <select id="active-business" name="businessId" defaultValue={activeBusinessId} className="h-9 max-w-[13rem] rounded-lg border border-[#d9e5df] bg-white px-2 text-xs font-semibold text-[#28453b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18775e] sm:max-w-[16rem]">
                {businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}
              </select>
              <button className="h-9 rounded-lg border border-[#cfe2d8] px-3 text-xs font-semibold text-[#28785f] hover:bg-[#f5faf7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18775e]">Cambiar</button>
              <Link href="/businesses/new" aria-label="Añadir otro comercio" title="Añadir otro comercio" className="grid size-9 shrink-0 place-items-center rounded-lg text-[#28785f] hover:bg-[#f5faf7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18775e]"><Plus aria-hidden="true" className="size-4" /></Link>
            </form>
          ) : preview ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[#f1d69e] bg-[#fff9eb] px-3 py-1.5 text-[11px] font-semibold text-[#936018]">
              <span className="size-1.5 rounded-full bg-[#d49425]" />
              Vista previa · datos ficticios
            </span>
          ) : (
            <div className="flex items-center gap-3">
              <span className="hidden max-w-56 truncate text-xs text-[#6d8379] sm:inline">{businessName}</span>
              {businesses.length === 1 ? <Link href="/businesses/new" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#d9e5df] px-3 text-xs font-semibold text-[#28785f] hover:bg-[#f5faf7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18775e]"><Plus aria-hidden="true" className="size-3.5" /><span className="hidden sm:inline">Añadir comercio</span></Link> : null}
            </div>
          )}
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-8 sm:py-9">{children}</main>
      </div>
    </div>
  );
}

function pageTitle(pathname: string) {
  if (pathname === "/") return "Resumen";
  if (pathname.startsWith("/orders/new")) return "Nuevo pedido";
  if (pathname.startsWith("/orders/")) return "Detalle del pedido";
  if (pathname.startsWith("/orders")) return "Pedidos";
  if (pathname.startsWith("/quotations/new")) return "Nueva cotización";
  if (pathname.startsWith("/quotations/")) return "Detalle de cotización";
  if (pathname.startsWith("/quotations")) return "Cotizaciones";
  if (pathname.startsWith("/activity")) return "Historial";
  if (pathname.startsWith("/businesses")) return "Comercios";
  return "BYTE-CX";
}
