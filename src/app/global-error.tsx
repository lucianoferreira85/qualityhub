"use client";

export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center px-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Erro critico
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Ocorreu um erro inesperado. Tente recarregar a pagina.
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Recarregar
          </button>
        </div>
      </body>
    </html>
  );
}
