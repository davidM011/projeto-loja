import { getSupabaseServerClient, requireAuthenticatedUser } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type SearchParams = {
  saved?: string | string[];
};

function pick(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function PerfilPage({ searchParams }: { searchParams?: SearchParams }) {
  const user = await requireAuthenticatedUser();
  const supabase = getSupabaseServerClient();
  const saved = pick(searchParams?.saved);

  let profile: {
    full_name: string | null;
    phone: string | null;
    notes: string | null;
  } | null = null;

  const profileResult = await supabase
    .from("profiles")
    .select("full_name, phone, notes")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileResult.error) {
    profile = profileResult.data;
  }

  return (
    <section className="grid page-gap">
      <div className="section-head">
        <h1>Perfil</h1>
        <p>Dados da sua conta no sistema.</p>
      </div>

      {saved === "ok" && (
        <div className="alert-strip">
          <strong>Perfil atualizado</strong>
          <span>Suas informacoes foram salvas.</span>
        </div>
      )}
      {saved === "erro" && (
        <div className="alert-strip">
          <strong>Erro ao salvar</strong>
          <span>Tente novamente em instantes.</span>
        </div>
      )}

      <article className="card glass" style={{ maxWidth: 720 }}>
        <form action="/api/profile" method="post" className="form-grid">
          <label className="field">
            Email (login)
            <input value={user.email ?? ""} readOnly />
          </label>
          <label className="field">
            Nome
            <input name="fullName" defaultValue={profile?.full_name ?? ""} />
          </label>
          <label className="field">
            Telefone
            <input name="phone" defaultValue={profile?.phone ?? ""} />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Observacoes
            <textarea name="notes" rows={3} defaultValue={profile?.notes ?? ""} />
          </label>
          <button className="btn" type="submit">
            Salvar perfil
          </button>
        </form>
      </article>
    </section>
  );
}
