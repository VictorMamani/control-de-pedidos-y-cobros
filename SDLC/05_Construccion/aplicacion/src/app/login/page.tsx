import Link from "next/link";
import { ArrowRight, KeyRound, Mail } from "lucide-react";
import { signIn } from "@/modules/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const errorMessages: Record<string, string> = {
  setup: "Primero configura las variables de Supabase en .env.local.",
  invalid: "Escribe un correo válido y una contraseña de al menos 8 caracteres.",
  credentials: "No se pudo iniciar sesión con esos datos.",
  confirm: "No se pudo confirmar la cuenta. Revisa el enlace de correo o solicita otro.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  const notice = typeof params.notice === "string" ? params.notice : undefined;
  const configured = isSupabaseConfigured();

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden flex-col justify-between bg-[#173a32] p-12 text-white lg:flex xl:p-16">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-[#dcefe5] text-lg font-black text-[#173a32]">B</div>
          <div><p className="font-bold">BYTE-CX</p><p className="text-xs text-[#aac4b8]">Operaciones de venta</p></div>
        </div>
        <div className="max-w-lg">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9fc5b5]">Control de pedidos</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight">Ten claro qué sigue en cada venta.</h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-[#c2d5cd]">Un espacio para organizar pedidos, preparación y cobros anotados de tu comercio.</p>
        </div>
        <p className="text-xs text-[#aac4b8]">BYTE-CX · Aplicación de aprendizaje</p>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid size-10 place-items-center rounded-xl bg-[#dcefe5] font-black text-[#173a32]">B</div>
            <div><p className="font-bold text-[#173a32]">BYTE-CX</p><p className="text-xs text-[#71877d]">Operaciones de venta</p></div>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#19755d]">Bienvenido</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#18372f]">Inicia sesión</h2>
          <p className="mt-2 text-sm leading-6 text-[#71877d]">Usa la cuenta de tu espacio de trabajo para continuar.</p>

          {notice === "verify" ? <p role="status" className="mt-5 rounded-xl border border-[#cde5d9] bg-[#eff8f3] px-4 py-3 text-sm text-[#28785f]">Revisa tu correo para confirmar la cuenta y luego inicia sesión.</p> : null}
          {!configured ? <p role="status" className="mt-5 rounded-xl border border-[#f1d69e] bg-[#fff9eb] px-4 py-3 text-sm leading-5 text-[#806026]">Supabase aún no está conectado. La vista de pedidos sigue disponible como demostración.</p> : null}
          {error ? <p role="alert" className="mt-5 rounded-xl border border-[#f0d2cb] bg-[#fff4f1] px-4 py-3 text-sm text-[#a84336]">{errorMessages[error] ?? "No se pudo completar la operación."}</p> : null}

          <form action={signIn} className="mt-7 space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-[#345246]">Correo electrónico</label>
              <div className="relative">
                <Mail aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#81978c]" />
                <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} className="h-11 w-full rounded-xl border border-[#d9e5df] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#41977a] focus:ring-4 focus:ring-[#41977a]/10" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-[#345246]">Contraseña</label>
              <div className="relative">
                <KeyRound aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#81978c]" />
                <input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} maxLength={128} className="h-11 w-full rounded-xl border border-[#d9e5df] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#41977a] focus:ring-4 focus:ring-[#41977a]/10" />
              </div>
            </div>
            <button disabled={!configured} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#18775e] px-4 text-sm font-semibold text-white transition hover:bg-[#12624d] disabled:cursor-not-allowed disabled:opacity-50">
              Iniciar sesión <ArrowRight aria-hidden="true" className="size-4" />
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-[#71877d]">¿Primera vez aquí? <Link href="/signup" className="font-semibold text-[#16765d] hover:underline">Crea una cuenta</Link></p>
          <p className="mt-8 text-center text-[11px] leading-5 text-[#8a9b93]">No introduzcas datos bancarios ni claves de otros servicios.</p>
        </div>
      </section>
    </main>
  );
}
