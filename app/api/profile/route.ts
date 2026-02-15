import { NextResponse } from "next/server";
import { getSupabaseServerClient, requireAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const form = await req.formData();
  const fullName = String(form.get("fullName") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();

  const redirectUrl = new URL("/perfil", req.url);

  try {
    const user = await requireAuthenticatedUser();
    const supabase = getSupabaseServerClient();

    const result = await supabase.from("profiles").upsert(
      {
        id: user.id,
        full_name: fullName || null,
        phone: phone || null,
        notes: notes || null,
      },
      { onConflict: "id" }
    );

    if (result.error) {
      redirectUrl.searchParams.set("saved", "erro");
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }
  } catch {
    return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  }

  redirectUrl.searchParams.set("saved", "ok");
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
