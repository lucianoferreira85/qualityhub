export interface CsvColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  formatter?: (value: unknown, row: T) => string;
}

export function exportToCSV<T extends object>(
  data: T[],
  columns: CsvColumn<T>[],
  filename: string
): void {
  const BOM = "\uFEFF";
  const separator = ";";

  const escape = (value: string): string => {
    const str = String(value ?? "");
    if (str.includes('"') || str.includes(separator) || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columns.map((col) => escape(col.label)).join(separator);

  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = (row as Record<string, unknown>)[col.key];
        const formatted = col.formatter ? col.formatter(value, row) : String(value ?? "");
        return escape(formatted);
      })
      .join(separator)
  );

  const csv = BOM + [header, ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
