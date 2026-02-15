"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type Mode = "login" | "signup" | "forgot";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (mode === "login") {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        setError(loginError.message);
      } else {
        router.push(nextPath);
        router.refresh();
      }
    } else if (mode === "signup") {
      if (!fullName.trim()) {
        setError("Informe seu nome para criar a conta.");
        setLoading(false);
        return;
      }

      const { error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });
      if (signupError) {
        setError(signupError.message);
      } else {
        setMessage("Conta criada. Se o projeto exigir confirmacao por email, confirme antes de entrar.");
      }
    } else {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (resetError) {
        setError(resetError.message);
      } else {
        setMessage("Enviamos um link para redefinir a senha. Verifique caixa de entrada e spam.");
      }
    }

    setLoading(false);
  }

  const showPassword = mode !== "forgot";

  return (
    <section className="grid" style={{ maxWidth: 460, margin: "2rem auto" }}>
      <article className="card">
        <h1>{mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Recuperar senha"}</h1>
        <p>Use um login para acessar o sistema compartilhado.</p>

        <form onSubmit={onSubmit} className="form-grid">
          {mode === "signup" ? (
            <label className="field">
              Nome completo
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </label>
          ) : null}

          <label className="field">
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>

          {showPassword ? (
            <label className="field">
              Senha
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
          ) : null}

          <button className="btn" type="submit" disabled={loading}>
            {loading
              ? "Processando..."
              : mode === "login"
                ? "Entrar"
                : mode === "signup"
                  ? "Criar conta"
                  : "Enviar link de recuperacao"}
          </button>
        </form>

        <div style={{ marginTop: "0.8rem", display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
          {mode !== "signup" ? (
            <button className="btn btn-secondary" type="button" onClick={() => setMode("signup")}>
              Criar nova conta
            </button>
          ) : null}

          {mode !== "login" ? (
            <button className="btn btn-secondary" type="button" onClick={() => setMode("login")}>
              Ja tenho conta
            </button>
          ) : null}

          {mode !== "forgot" ? (
            <button className="btn btn-secondary" type="button" onClick={() => setMode("forgot")}>
              Esqueci minha senha
            </button>
          ) : null}
        </div>

        {error ? <p style={{ color: "#b02e0c" }}>{error}</p> : null}
        {message ? <p style={{ color: "#31572c" }}>{message}</p> : null}
      </article>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<section className="grid" style={{ maxWidth: 460, margin: "2rem auto" }}><article className="card"><p>Carregando...</p></article></section>}>
      <LoginContent />
    </Suspense>
  );
}
