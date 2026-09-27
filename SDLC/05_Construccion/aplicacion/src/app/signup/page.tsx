import Link from "next/link";
import { ArrowRight, KeyRound, Mail } from "lucide-react";
import { signUp } from "@/modules/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  const configured = isSupabaseConfigured();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f7f6] px-5 py-12">
      <section className="w-full max-w-md rounded-2xl border border-[#e1eae6] bg-white p-6 shadow-sm sm:p-8">
        <Link href="/login" className="text-sm font-semibold text-[#16765d] hover:underline">BYTE-CX</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.15em] text-[#19755d]">Acceso</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#18372f]">Crea tu cuenta</h1>
        <p className="mt-2 text-sm leading-6 text-[#71877d]">Después podrás crear un espacio de trabajo para tu comercio.</p>
        {!configured ? <p role="status" className="mt-5 rounded-xl border border-[#f1d69e] bg-[#fff9eb] px-4 py-3 text-sm leading-5 text-[#806026]">Conecta Supabase antes de crear una cuenta.</p> : null}
        {error ? <p role="alert" className="mt-5 rounded-xl border border-[#f0d2cb] bg-[#fff4f1] px-4 py-3 text-sm text-[#a84336]">{error === "invalid" ? "Usa un correo válido y una contraseña de al menos 8 caracteres." : error === "setup" ? "Configura Supabase antes de registrarte." : "No se pudo crear la cuenta. Puede que el correo ya esté registrado."}</p> : null}
        <form action={signUp} className="mt-6 space-y-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-[#345246]">Correo electrónico</label>
            <div className="relative"><Mail aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#81978c]" /><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} className="h-11 w-full rounded-xl border border-[#d9e5df] pl-10 pr-3 text-sm outline-none focus:border-[#41977a] focus:ring-4 focus:ring-[#41977a]/10" /></div>
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-[#345246]">Contraseña</label>
            <div className="relative"><KeyRound aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#81978c]" /><input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} className="h-11 w-full rounded-xl border border-[#d9e5df] pl-10 pr-3 text-sm outline-none focus:border-[#41977a] focus:ring-4 focus:ring-[#41977a]/10" /></div>
            <p className="mt-1.5 text-xs text-[#84958e]">Usa al menos 8 caracteres.</p>
          </div>
          <button disabled={!configured} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#18775e] px-4 text-sm font-semibold text-white transition hover:bg-[#12624d] disabled:cursor-not-allowed disabled:opacity-50">Crear cuenta <ArrowRight aria-hidden="true" className="size-4" /></button>
        </form>
        <p className="mt-6 text-center text-sm text-[#71877d]">¿Ya tienes cuenta? <Link href="/login" className="font-semibold text-[#16765d] hover:underline">Inicia sesión</Link></p>
      </section>
    </main>
  );
}
