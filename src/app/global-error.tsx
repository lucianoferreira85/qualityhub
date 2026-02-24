"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro critico:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          fontFamily:
            'Inter, "Segoe UI", system-ui, -apple-system, sans-serif',
          backgroundColor: "#F5F3FF",
          color: "#1A1A2E",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "420px" }}>
          <div
            style={{
              position: "relative",
              display: "inline-block",
              marginBottom: "32px",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "16px",
                background: "#FEE2E2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#EF4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>
          </div>

          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              lineHeight: 1.3,
              marginBottom: "12px",
              color: "#1A1A2E",
            }}
          >
            Erro critico
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              lineHeight: 1.5,
              color: "#6B7280",
              marginBottom: "8px",
            }}
          >
            Ocorreu um erro inesperado na aplicacao. Tente recarregar a pagina
            ou volte ao inicio.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: "0.75rem",
                lineHeight: 1.5,
                color: "#9CA3AF",
                marginBottom: "24px",
              }}
            >
              Codigo: {error.digest}
            </p>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              marginTop: "24px",
            }}
          >
            <button
              onClick={reset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                height: "40px",
                padding: "0 20px",
                backgroundColor: "#7C3AED",
                color: "#ffffff",
                borderRadius: "8px",
                border: "none",
                fontWeight: 500,
                fontSize: "0.875rem",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              Tentar novamente
            </button>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/";
                }
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                height: "40px",
                padding: "0 20px",
                backgroundColor: "transparent",
                color: "#6B7280",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                fontWeight: 500,
                fontSize: "0.875rem",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Voltar ao inicio
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
