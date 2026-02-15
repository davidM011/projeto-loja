import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // no-op
  }

  return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
}
