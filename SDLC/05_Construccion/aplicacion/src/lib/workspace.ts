import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BusinessRole = "owner" | "manager" | "seller";

export type WorkspaceBusiness = {
  id: string;
  name: string;
  role: BusinessRole;
};

export const ACTIVE_BUSINESS_COOKIE = "bytecx_active_business_id";

export type WorkspaceContext =
  | { mode: "preview" }
  | { mode: "unauthenticated" }
  | { mode: "onboarding"; supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>; user: { id: string; email?: string } }
  | { mode: "unavailable" }
  | {
      mode: "ready";
      supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
      user: { id: string; email?: string };
      business: WorkspaceBusiness;
      businesses: WorkspaceBusiness[];
    };

export async function getWorkspaceContext(): Promise<WorkspaceContext> {
  if (!isSupabaseConfigured()) {
    return { mode: "preview" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (userError || !userResult.user) {
    return { mode: "unauthenticated" };
  }

  const user = { id: userResult.user.id, email: userResult.user.email ?? undefined };
  const { data: memberships, error: membershipError } = await supabase
    .from("business_memberships")
    .select("business_id, role, created_at")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(100);

  if (membershipError) {
    return { mode: "unavailable" };
  }

  if (!memberships || memberships.length === 0) {
    return { mode: "onboarding", supabase, user };
  }

  const { data: businessRows, error: businessError } = await supabase
    .from("businesses")
    .select("id, name")
    .in("id", memberships.map((membership) => membership.business_id));

  if (businessError || !businessRows || businessRows.length !== memberships.length) {
    return { mode: "unavailable" };
  }

  const businessNames = new Map(businessRows.map((business) => [business.id, business.name]));
  const businesses: WorkspaceBusiness[] = memberships.map((membership) => ({
    id: membership.business_id,
    name: businessNames.get(membership.business_id) ?? "",
    role: membership.role as BusinessRole,
  }));
  if (businesses.some((business) => !business.name)) return { mode: "unavailable" };

  const cookieStore = await cookies();
  const requestedBusinessId = cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value;
  const business = businesses.find((item) => item.id === requestedBusinessId) ?? businesses[0];

  return {
    mode: "ready",
    supabase,
    user,
    business,
    businesses,
  };
}
