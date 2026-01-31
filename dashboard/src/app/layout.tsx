import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clone Digital - Agency OS",
  description: "Gerencie seu conteúdo automatizado com IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
