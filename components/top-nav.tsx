import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/supabase-server";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/vendas", label: "Vendas" },
  { href: "/contas-receber", label: "Contas a receber" },
  { href: "/clientes", label: "Clientes" },
  { href: "/produtos", label: "Produtos" },
];

export async function TopNav() {
  const user = await getAuthenticatedUser();
  const canNavigate = Boolean(user);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <strong>Projeto Loja MVP</strong>
        <nav className="nav">
          {canNavigate
            ? links.map((item) => (
                <Link className="nav-link" key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))
            : null}

          {canNavigate ? (
            <form action="/api/auth/logout" method="post">
              <button className="nav-link nav-btn" type="submit">
                Sair
              </button>
            </form>
          ) : (
            <Link className="nav-link" href="/login">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
