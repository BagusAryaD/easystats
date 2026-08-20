import Papa from "papaparse";
import type { ColumnType } from "./types";

/**
 * Deteksi delimiter paling mungkin dari beberapa baris pertama teks.
 * Tab diprioritaskan karena paste dari Excel/Google Sheets selalu memakai tab.
 */
export function detectDelimiter(text: string): string {
  const norm = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = norm.split("\n").filter((l) => l.trim() !== "");
  const sample = lines.slice(0, 3).join("\n");

  if (sample.includes("\t")) return "\t";

  const candidates = [",", ";", "|"];
  let best = ",";
  let bestCount = 0;
  for (const c of candidates) {
    const count = sample.split(c).length - 1;
    if (count > bestCount) {
      best = c;
      bestCount = count;
    }
  }
  return bestCount > 0 ? best : ",";
}

export interface ParsedData {
  headers: string[];
  rows: string[][];
}

/**
 * Parse teks mentah (CSV/TSV) menjadi headers + rows. Baris pertama = header.
 * Baris kosong dilewati; jumlah sel per baris diselaraskan dengan jumlah header.
 */
export function parseDelimited(text: string, delimiter: string): ParsedData {
  const result = Papa.parse<string[]>(text, {
    delimiter,
    skipEmptyLines: true,
    transform: (v: string) => (v ?? "").trim(),
  });

  if (!result.data.length) return { headers: [], rows: [] };

  const headers = (result.data[0] ?? []).map((h) => (h ?? "").trim());

  const rows = result.data
    .slice(1)
    .map((row) => {
      const cells = Array.isArray(row) ? row.map((c) => (c ?? "").trim()) : [];
      while (cells.length < headers.length) cells.push("");
      return cells.slice(0, headers.length);
    })
    .filter((row) => row.some((c) => c !== ""));

  return { headers, rows };
}

export function isNumeric(v: string): boolean {
  return v.trim() !== "" && !Number.isNaN(Number(v));
}

export function detectColumnType(values: string[]): ColumnType {
  for (const v of values) {
    if (v === "") continue;
    if (!isNumeric(v)) return "categorical";
  }
  return "numeric";
}

/**
 * Bangun array nilai untuk dikirim ke API. Untuk kolom numerik, nilai yang
 * bukan angka diubah menjadi null (missing). Untuk kategorik selalu null.
 */
export function buildNumericColumn(
  name: string,
  headers: string[],
  rows: string[][],
  columnTypes: Record<string, ColumnType>
): (number | null)[] {
  const idx = headers.indexOf(name);
  return rows.map((row) => {
    const raw = row[idx] ?? "";
    if (columnTypes[name] !== "numeric") return null;
    if (raw === "") return null;
    const n = Number(raw);
    return Number.isNaN(n) ? null : n;
  });
}
