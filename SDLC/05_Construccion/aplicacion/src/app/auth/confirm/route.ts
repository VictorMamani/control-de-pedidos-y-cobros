import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/login?error=setup", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  const requestedPath = request.nextUrl.searchParams.get("next") ?? "/";
  let safeUrl = new URL("/", request.url);
  try {
    const candidateUrl = new URL(requestedPath, request.url);
    if (candidateUrl.origin === request.nextUrl.origin) safeUrl = candidateUrl;
  } catch {
    safeUrl = new URL("/", request.url);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=confirm", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=confirm", request.url));
  }

  return NextResponse.redirect(safeUrl);
}
