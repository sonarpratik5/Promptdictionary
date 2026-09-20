import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeAuthRedirect } from "@/features/auth/credentials";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next");
  const next = requestedNext === "/auth/reset" ? requestedNext : safeAuthRedirect(requestedNext);
  if (!code) {
    return NextResponse.redirect(new URL("/auth?error=confirmation", request.url));
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL("/auth?error=confirmation", request.url));
  } catch {
    return NextResponse.redirect(new URL("/auth?error=confirmation", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
