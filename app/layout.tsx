import "./globals.css";
import type { Metadata } from "next";
import { TopNav } from "@/components/top-nav";

export const metadata: Metadata = {
  title: "Loja - MVP",
  description: "Controle de vendas, clientes e pagamentos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <TopNav />
        <main>{children}</main>
      </body>
    </html>
  );
}
