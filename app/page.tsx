"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ClipboardPaste,
  FileSpreadsheet,
  FileUp,
  Info,
  PlayCircle,
  Upload,
} from "lucide-react";
import { detectColumnType, detectDelimiter, parseDelimited } from "@/lib/csv";
import { saveDataset } from "@/lib/store";
import type { ColumnType, Dataset } from "@/lib/types";
import { Alert } from "@/components/ui";

const MAX_FILE = 5 * 1024 * 1024;

const DELIMITER_LABELS: Record<string, string> = {
  "\t": "Tab",
  ",": "Koma",
  ";": "Titik-koma",
  "|": "Pipe",
};

function validateAndSave(
  text: string,
  source: string
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!text || text.trim() === "") {
    return { ok: false, errors: ["Data kosong atau tidak terbaca."] };
  }

  const delimiter = detectDelimiter(text);
  const { headers, rows } = parseDelimited(text, delimiter);

  if (!headers.length || headers.every((h) => h === "")) {
    errors.push("Baris pertama (header) kosong atau tidak terbaca. Pastikan baris pertama berisi nama kolom.");
  }

  const counts: Record<string, number> = {};
  for (const h of headers) {
    if (h === "") continue;
    counts[h] = (counts[h] ?? 0) + 1;
  }
  const dupes = Object.entries(counts)
    .filter(([, c]) => c > 1)
    .map(([k]) => k);
  if (dupes.length) {
    errors.push(`Ditemukan nama kolom duplikat: ${dupes.join(", ")}. Setiap kolom wajib memiliki nama unik.`);
  }

  if (headers.length < 2) {
    errors.push(`Hanya ditemukan ${headers.length} kolom. Minimal diperlukan 2 kolom.`);
  }

  if (rows.length < 2) {
    errors.push(`Hanya ditemukan ${rows.length} baris data. Minimal diperlukan 2 baris.`);
  }

  if (errors.length) return { ok: false, errors };

  const columnTypes: Record<string, ColumnType> = {};
  for (const h of headers) {
    const idx = headers.indexOf(h);
    columnTypes[h] = detectColumnType(rows.map((r) => r[idx] ?? ""));
  }

  const ds: Dataset = {
    headers,
    rows,
    columnTypes,
    source,
    delimiterLabel: DELIMITER_LABELS[delimiter] ?? delimiter,
  };
  saveDataset(ds);

  return { ok: true, errors };
}

export default function LandingPage() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"upload" | "paste">("upload");
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [pasted, setPasted] = useState("");

  const go = (text: string, source: string) => {
    setErrors([]);
    const result = validateAndSave(text, source);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    router.push("/preview");
  };

  const handleFile = (file: File) => {
    if (file.size > MAX_FILE) {
      setErrors([`Ukuran file terlalu besar (${(file.size / 1024 / 1024).toFixed(2)} MB). Maksimum 5 MB.`]);
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setErrors(["Ekstensi file tidak valid. Hanya .csv yang diizinkan."]);
      return;
    }
    setFileName(file.name);
    setErrors([]);
    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setLoading(false);
      go(String(reader.result ?? ""), "upload");
    };
    reader.onerror = () => {
      setLoading(false);
      setErrors(["File tidak dapat dibaca."]);
    };
    reader.readAsText(file);
  };

  const runDemo = async () => {
    setErrors([]);
    setLoading(true);
    try {
      const res = await fetch("/demo.csv");
      const text = await res.text();
      go(text, "demo");
    } catch {
      setErrors(["File demo tidak dapat dimuat."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pb-10">
      <div className="px-5 pb-3 pt-10 text-center">
        <div className="mx-auto mb-2 flex items-center justify-center gap-2.5">
          <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-brand-500 text-white shadow-md">
            <BarChart3 size={22} />
          </div>
          <span className="text-[1.6rem] font-extrabold tracking-tight text-brand-500">
            EasyStats
          </span>
        </div>
        <p className="mx-auto max-w-[420px] text-[0.88rem] text-soft">
          Statistik Mudah untuk Penelitian Anda
        </p>
        <p className="mx-auto mt-1 max-w-[480px] text-[0.85rem] leading-relaxed text-[#666]">
          Upload atau paste data kuesioner Anda, langsung dapatkan hasil uji
          statistik beserta narasi siap pakai untuk laporan.
        </p>
      </div>

      <div className="mx-auto max-w-[720px] px-5">
        {errors.length > 0 && (
          <Alert variant="error">
            <strong>Data tidak dapat diproses:</strong>
            <ul className="mt-1 list-disc pl-5">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </Alert>
        )}

        <div className="mx-auto mb-4 flex w-fit max-w-full gap-1 rounded-xl bg-[#e7e8f3] p-1.5">
          <button
            type="button"
            onClick={() => setTab("upload")}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
              tab === "upload"
                ? "bg-surface text-brand-500 shadow"
                : "text-[#777] hover:text-brand-500"
            }`}
          >
            <FileUp size={16} /> Upload File
          </button>
          <button
            type="button"
            onClick={() => setTab("paste")}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
              tab === "paste"
                ? "bg-surface text-brand-500 shadow"
                : "text-[#777] hover:text-brand-500"
            }`}
          >
            <ClipboardPaste size={16} /> Paste Data
          </button>
        </div>

        {tab === "upload" ? (
          <div className="rounded-2xl border border-edge bg-surface p-5 shadow-sm">
            <div
              className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#c7c7e0] p-8 text-center transition hover:border-brand-500 hover:bg-brand-50"
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("border-brand-500", "bg-brand-50");
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove("border-brand-500", "bg-brand-50");
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("border-brand-500", "bg-brand-50");
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
            >
              <input
                ref={fileInput}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <div className="mb-1.5 flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-brand-50">
                <Upload size={26} className="text-brand-500" />
              </div>
              <div className="font-semibold">Klik atau seret file CSV ke sini</div>
              <div className="text-sm text-soft">Maksimum 5 MB</div>
              {fileName && (
                <div className="mt-1 flex max-w-full items-center gap-1 text-sm font-semibold text-green-700">
                  {fileName}
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => fileInput.current?.click()}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3.5 text-base font-bold text-white shadow transition hover:-translate-y-px hover:bg-brand-600"
            >
              {loading ? "Memproses..." : "Lanjut ke Preview"}
              <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-edge bg-surface p-5 shadow-sm">
            <textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder={
                "Paste data di sini, langsung dari Excel atau Google Sheets\nBaris pertama harus berisi nama item, misal: Item1  Item2  Item3"
              }
              className="min-h-[160px] w-full resize-y rounded-xl border-2 border-edge p-3.5 font-mono text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-[3px] focus:ring-brand-500/15"
            />
            <p className="mt-2.5 flex items-start gap-1.5 text-[0.82rem] text-soft">
              <Info size={14} className="mt-0.5 shrink-0 text-[#ccc]" />
              Sistem otomatis mendeteksi pemisah kolom (tab, koma, titik-koma, atau pipe).
              Cukup select cell di Excel/Sheets lalu copy-paste langsung ke sini.
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={() => go(pasted, "paste")}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3.5 text-base font-bold text-white shadow transition hover:-translate-y-px hover:bg-brand-600"
            >
              {loading ? "Memproses..." : "Lanjut ke Preview"}
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        <div className="mx-auto mt-4 max-w-[420px]">
          <div className="mb-1 text-[0.75rem] font-bold text-soft">
            Contoh struktur data:
          </div>
          <div className="overflow-x-auto rounded-lg border border-edge bg-surface">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="bg-[#f8f8fc]">
                  <th className="border-b border-edge px-3 py-1.5 font-bold text-brand-500">Item_1</th>
                  <th className="border-b border-edge px-3 py-1.5 font-bold text-brand-500">Item_2</th>
                  <th className="border-b border-edge px-3 py-1.5 font-bold text-brand-500">Item_3</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="px-3 py-1">4</td><td className="px-3 py-1">3</td><td className="px-3 py-1">5</td></tr>
                <tr><td className="px-3 py-1">2</td><td className="px-3 py-1">5</td><td className="px-3 py-1">4</td></tr>
                <tr><td className="px-3 py-1">5</td><td className="px-3 py-1">4</td><td className="px-3 py-1">3</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-1 flex items-start gap-1 text-[0.72rem] text-soft">
            <Info size={11} className="mt-0.5 shrink-0" />
            Baris pertama = nama kolom. Setiap baris berikutnya = satu responden.
          </p>
        </div>

        <div className="my-3 text-center">
          <button
            type="button"
            disabled={loading}
            onClick={runDemo}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-edge bg-surface px-5 py-2.5 text-sm font-bold text-brand-500 transition hover:-translate-y-px hover:bg-brand-50"
          >
            <PlayCircle size={18} /> Coba Data Demo
          </button>
        </div>

        <div className="mb-2 mt-5 text-center text-xs font-bold uppercase tracking-widest text-soft">
          Mulai dalam 4 langkah mudah
        </div>
        <div className="mx-auto flex max-w-[640px] flex-wrap justify-center gap-5">
          {[
            { icon: Upload, label: "Upload / Paste" },
            { icon: FileSpreadsheet, label: "Preview Data" },
            { icon: ClipboardPaste, label: "Pilih Item" },
            { icon: ArrowRight, label: "Lihat Hasil" },
          ].map((s, i) => (
            <div key={s.label} className="w-[100px] text-center text-[0.8rem] text-[#777]">
              <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                <s.icon size={13} />
              </div>
              {i + 1}. {s.label}
            </div>
          ))}
        </div>

        <div className="mt-5 text-center text-sm">
          <a
            href="/tutorial"
            className="inline-flex items-center gap-1.5 font-semibold text-brand-500 hover:underline"
          >
            <BookOpen size={15} /> Cara copy rumus LaTeX hasil uji ke Microsoft Word
          </a>
        </div>
      </div>
    </main>
  );
}
