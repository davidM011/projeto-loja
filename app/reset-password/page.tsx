"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function bootstrapRecoverySession() {
      const code = searchParams.get("code");
      if (!code) return;
      await supabase.auth.exchangeCodeForSession(code);
    }
    bootstrapRecoverySession();
  }, [searchParams, supabase.auth]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas nao conferem.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("Senha alterada com sucesso. Voce ja pode entrar.");
    setTimeout(() => router.push("/login"), 1200);
  }

  return (
    <section className="grid" style={{ maxWidth: 460, margin: "2rem auto" }}>
      <article className="card">
        <h1>Redefinir senha</h1>
        <p>Digite sua nova senha para concluir a recuperacao.</p>

        <form onSubmit={onSubmit} className="form-grid">
          <label className="field">
            Nova senha
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <label className="field">
            Confirmar nova senha
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </label>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>

        {error ? <p style={{ color: "#b02e0c" }}>{error}</p> : null}
        {message ? <p style={{ color: "#31572c" }}>{message}</p> : null}
      </article>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<section className="grid" style={{ maxWidth: 460, margin: "2rem auto" }}><article className="card"><p>Carregando...</p></article></section>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
