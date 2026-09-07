import type { Metadata, Viewport } from "next";
import StyledComponentsRegistry from "./registry";

export const metadata: Metadata = {
  title: "Lista Fácil Mercado",
  description: "Sua lista de compras de mercado, simples e compartilhada.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#176b3a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
      </body>
    </html>
  );
}
