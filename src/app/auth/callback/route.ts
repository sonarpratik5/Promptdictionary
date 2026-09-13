import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") === "/auth/reset" ? "/auth/reset" : "/";
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
