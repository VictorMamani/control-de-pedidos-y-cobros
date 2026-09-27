"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ACTIVE_BUSINESS_COOKIE, getWorkspaceContext } from "@/lib/workspace";

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

export async function signIn(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=setup");
  }

  const credentials = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!credentials.success) {
    redirect("/login?error=invalid");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(credentials.data);

  if (error) {
    redirect("/login?error=credentials");
  }

  redirect("/");
}

export async function signUp(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/signup?error=setup");
  }

  const credentials = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!credentials.success) {
    redirect("/signup?error=invalid");
  }

  const supabase = await createSupabaseServerClient();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const { data, error } = await supabase.auth.signUp({
    ...credentials.data,
    options: { emailRedirectTo: `${siteUrl}/auth/confirm` },
  });

  if (error) {
    redirect("/signup?error=account");
  }

  if (data.session) {
    redirect("/");
  }

  redirect("/login?notice=verify");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_BUSINESS_COOKIE);

  redirect("/login");
}

const businessSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export async function createBusiness(formData: FormData) {
  const workspace = await getWorkspaceContext();

  if (workspace.mode === "unauthenticated") {
    redirect("/login");
  }

  if (workspace.mode !== "onboarding" && workspace.mode !== "ready") {
    redirect("/?error=business");
  }

  const destination = workspace.mode === "ready" ? "/businesses/new" : "/";
  const parsed = businessSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    redirect(`${destination}?error=business-name`);
  }

  const { data: businessId, error } = await workspace.supabase.rpc("create_business", {
    p_name: parsed.data.name,
  });

  if (error || !businessId) {
    redirect(`${destination}?error=business`);
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BUSINESS_COOKIE, businessId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/");
  redirect("/");
}

const businessIdSchema = z.string().uuid();

export async function selectBusiness(formData: FormData) {
  const parsed = businessIdSchema.safeParse(formData.get("businessId"));
  if (!parsed.success) redirect("/?error=business-selection");

  const workspace = await getWorkspaceContext();
  if (workspace.mode === "unauthenticated") redirect("/login");
  if (workspace.mode !== "ready") redirect("/");

  const selected = workspace.businesses.find((business) => business.id === parsed.data);
  if (!selected) redirect("/?error=business-selection");

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BUSINESS_COOKIE, selected.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/");
  redirect("/");
}
