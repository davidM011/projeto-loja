import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/operacao", label: "Operacao" },
  { href: "/fiado", label: "Fiado" },
  { href: "/clientes", label: "Clientes" },
  { href: "/relatorios", label: "Relatorios" },
];

export function TopNav() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <strong>Projeto Loja MVP</strong>
        <nav className="nav">
          {links.map((item) => (
            <Link className="nav-link" key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <form action="/api/auth/logout" method="post">
            <button className="nav-link nav-btn" type="submit">
              Sair
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
