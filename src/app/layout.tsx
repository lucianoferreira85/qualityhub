import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QualityHub - Sistema de Gestao da Qualidade",
  description:
    "Plataforma SaaS multi-tenant para gestao da qualidade e conformidade ISO. Auditorias, nao-conformidades, acoes corretivas, documentos, indicadores e riscos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
          <Toaster
            richColors
            position="top-right"
            toastOptions={{
              className: "!rounded-card !border-stroke-secondary !shadow-dialog",
              duration: 4000,
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
