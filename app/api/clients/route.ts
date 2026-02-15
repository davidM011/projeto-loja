import { NextResponse } from "next/server";
import { getSupabaseServerClient, requireAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const form = await req.formData();
  const name = String(form.get("name") ?? "").trim();
  const whatsapp = String(form.get("whatsapp") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();

  if (!name || !whatsapp) {
    return NextResponse.redirect(new URL("/clientes", req.url), { status: 303 });
  }

  try {
    await requireAuthenticatedUser();
    const supabase = getSupabaseServerClient();
    await supabase.from("clients").insert({
      name,
      whatsapp,
      notes: notes || null,
    });
  } catch {
    return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  }

  return NextResponse.redirect(new URL("/clientes", req.url), { status: 303 });
}
