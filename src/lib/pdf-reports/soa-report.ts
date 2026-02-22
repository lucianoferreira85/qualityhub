import {
  createPdfDocument,
  addHeader,
  addFooter,
  addSectionTitle,
  addInfoGrid,
  addTable,
  checkPageBreak,
} from "@/lib/pdf";

const IMPL_LABELS: Record<string, string> = {
  not_implemented: "Não Implementado",
  partially_implemented: "Parcialmente",
  fully_implemented: "Implementado",
};

interface SoaReportData {
  standardName: string;
  entries: {
    applicable: boolean;
    justification: string | null;
    implementationStatus: string | null;
    control: { code: string; title: string; domain: string | null };
  }[];
}

export function generateSoaReport(data: SoaReportData, tenantName?: string) {
  const doc = createPdfDocument({ orientation: "landscape" });

  addHeader(doc, {
    title: `Declaração de Aplicabilidade (SoA)`,
    tenantName,
  });

  let y = 32;

  // Stats
  const total = data.entries.length;
  const applicable = data.entries.filter((e) => e.applicable).length;
  const notApplicable = total - applicable;
  const implemented = data.entries.filter(
    (e) => e.applicable && e.implementationStatus === "fully_implemented"
  ).length;
  const partial = data.entries.filter(
    (e) => e.applicable && e.implementationStatus === "partially_implemented"
  ).length;
  const implPercent =
    applicable > 0 ? Math.round((implemented / applicable) * 100) : 0;

  y = addSectionTitle(doc, `Norma: ${data.standardName}`, y);
  y = addInfoGrid(
    doc,
    [
      { label: "Total de Controles", value: String(total) },
      { label: "Aplicáveis", value: String(applicable) },
      { label: "Não Aplicáveis", value: String(notApplicable) },
      { label: "Implementados", value: String(implemented) },
      { label: "Parcialmente Implementados", value: String(partial) },
      { label: "% Implementação", value: `${implPercent}%` },
    ],
    y,
    3
  );

  // Group by domain
  const domains = new Map<string, typeof data.entries>();
  data.entries.forEach((entry) => {
    const domain = entry.control.domain || "Sem Domínio";
    if (!domains.has(domain)) domains.set(domain, []);
    domains.get(domain)!.push(entry);
  });

  for (const [domain, entries] of Array.from(domains.entries())) {
    y = checkPageBreak(doc, y, 25);
    y = addSectionTitle(doc, domain, y);

    const headers = [
      "Código",
      "Controle",
      "Aplicável",
      "Status",
      "Justificativa",
    ];
    const rows = entries.map((e) => [
      e.control.code,
      e.control.title,
      e.applicable ? "Sim" : "Não",
      e.applicable
        ? IMPL_LABELS[e.implementationStatus || ""] || "Não definido"
        : "N/A",
      e.justification || "—",
    ]);

    y = addTable(doc, {
      headers,
      rows,
      y,
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 80 },
        2: { cellWidth: 22 },
        3: { cellWidth: 35 },
      },
    });
  }

  addFooter(doc, { tenantName });

  doc.save(`soa_${data.standardName.replace(/\s+/g, "_").toLowerCase()}.pdf`);
}
