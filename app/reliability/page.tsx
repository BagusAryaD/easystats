"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calculator } from "lucide-react";
import { buildNumericColumn } from "@/lib/csv";
import { loadDataset } from "@/lib/store";
import { postJson } from "@/lib/api";
import type { ReliabilityResponse } from "@/lib/api-types";
import type { Dataset } from "@/lib/types";
import {
  Alert,
  FormulaBox,
  NarrativeBox,
  StatCard,
  SectionLabel,
} from "@/components/ui";

const INTERP_STYLES: Record<string, string> = {
  "interp-excellent": "bg-[#1a7a3c]",
  "interp-good": "bg-[#2f9e5b]",
  "interp-acceptable": "bg-[#e0a800] text-ink",
  "interp-poor": "bg-[#d97706]",
  "interp-bad": "bg-[#c0392b]",
};

export default function ReliabilityPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [ds, setDs] = useState<Dataset | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<ReliabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const d = loadDataset();
    if (!d) {
      router.replace("/");
      return;
    }
    setDs(d);
    setReady(true);
  }, [router]);

  if (!ready || !ds) return <div className="p-10 text-center text-soft">Memuat...</div>;

  const numericColumns = ds.headers.filter((h) => ds.columnTypes[h] === "numeric");

  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length < 2) {
      setError("Pilih minimal 2 item.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const items: Record<string, (number | null)[]> = {};
      for (const name of selected) {
        items[name] = buildNumericColumn(name, ds.headers, ds.rows, ds.columnTypes);
      }
      const res = await postJson<ReliabilityResponse>("/api/reliability", { items });
      if (!res.ok) {
        setError(res.error ?? "Terjadi kesalahan.");
      } else {
        setResult(res);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <header className="sticky top-0 z-10 flex items-center gap-6 border-b border-edge bg-surface px-6 py-3.5 shadow-sm">
        <Link href="/preview" className="flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:gap-3">
          <ArrowLeft size={16} /> Kembali ke Preview
        </Link>
        <Link href="/tutorial" className="flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:gap-3">
          <BookOpen size={16} /> Cara Copy ke Word
        </Link>
      </header>

      <div className="mx-auto max-w-[900px] px-5 pb-16 pt-7">
        <div className="mb-5 flex items-center gap-2.5">
          <h1 className="text-2xl font-extrabold">Uji Reliabilitas — Cronbach&apos;s Alpha</h1>
        </div>

        {numericColumns.length < 2 ? (
          <Alert variant="error">
            Hanya ditemukan {numericColumns.length} kolom numerik pada data Anda. Uji
            reliabilitas membutuhkan minimal 2 item numerik.
            <br />
            <Link href="/preview" className="font-bold underline">
              ← Kembali ke Preview
            </Link>{" "}
            untuk memeriksa data.
          </Alert>
        ) : (
          <form onSubmit={submit}>
            <label className="mb-2.5 flex w-fit cursor-pointer items-center gap-2 text-sm text-soft">
              <input
                type="checkbox"
                checked={selected.length === numericColumns.length}
                onChange={(e) => setSelected(e.target.checked ? [...numericColumns] : [])}
                className="h-4 w-4"
              />
              Pilih semua item
            </label>

            <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {numericColumns.map((name) => (
                <label
                  key={name}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm transition ${
                    selected.includes(name)
                      ? "border-brand-500 bg-brand-50"
                      : "border-edge bg-surface"
                  }`}
                >
                  <input type="checkbox" checked={selected.includes(name)} onChange={() => toggle(name)} className="h-4 w-4" />
                  <span className="truncate">{name}</span>
                </label>
              ))}
            </div>

            {error && (
              <Alert variant="error">
                <strong>Error:</strong> {error}
              </Alert>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-7 py-3 text-[0.95rem] font-bold text-white shadow transition hover:-translate-y-px hover:bg-brand-600 disabled:opacity-60"
            >
              <Calculator size={18} /> {loading ? "Menghitung..." : "Hitung Reliabilitas"}
            </button>
          </form>
        )}

        {result && result.ok && result.detailed && result.interp && (
          <div className="mt-6">
            <div className={`mb-5 flex items-center gap-4 rounded-2xl p-5 text-white shadow-lg ${INTERP_STYLES[result.interp.css] ?? "bg-brand-500"}`}>
              <div>
                <div className="text-sm opacity-90">Cronbach&apos;s Alpha</div>
                <div className="text-[2.2rem] font-extrabold leading-tight">
                  {result.detailed.alpha.toFixed(4)}
                </div>
                <div className="font-semibold">{result.interp.level}</div>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-3.5">
              <StatCard value={result.detailed.alpha.toFixed(4)} label="Nilai Alpha" />
              <StatCard value={result.detailed.k} label="Jumlah Item" />
              <StatCard value={result.detailed.n} label="N Responden Digunakan" />
              <StatCard value={ds.rows.length - result.detailed.n} label="Responden Dikeluarkan" />
            </div>

            <FormulaBox
              title="Rumus Umum Cronbach's Alpha"
              tex={`\\alpha=\\frac{k}{k-1}\\left(1-\\frac{\\sum\\sigma_i^2}{\\sigma_t^2}\\right)`}
              copyTex={`\\alpha = \\frac{k}{k-1}(1-\\frac{\\sum \\sigma_i^2}{\\sigma_t^2})`}
            />

            <details open className="mb-2.5 rounded-xl border border-edge bg-surface shadow-sm">
              <summary className="cursor-pointer p-3.5 font-bold">Detail Perhitungan</summary>
              <div className="p-4 pt-0">
                <SectionLabel>Varians Per Item</SectionLabel>
                <div className="overflow-x-auto rounded-lg border border-edge">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="border-b-2 border-edge bg-[#f8f8fc] p-2 text-left">Item</th>
                        <th className="border-b-2 border-edge bg-[#f8f8fc] p-2 text-left">Mean</th>
                        <th className="border-b-2 border-edge bg-[#f8f8fc] p-2 text-left">Varians (σᵢ²)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(result.detailed.itemDetail).map(([name, info]) => (
                        <tr key={name} className="hover:bg-[#f8f8fd]">
                          <td className="p-2">{name}</td>
                          <td className="p-2">{info.mean.toFixed(4)}</td>
                          <td className="p-2">{info.variance.toFixed(4)}</td>
                        </tr>
                      ))}
                      <tr className="bg-[#f0faf4] font-bold">
                        <td className="p-2" colSpan={2}>Σσᵢ²</td>
                        <td className="p-2">{result.detailed.sumItemVariances.toFixed(4)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <SectionLabel>Komponen</SectionLabel>
                <div className="max-w-md overflow-x-auto rounded-lg border border-edge">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr><td className="p-2 font-bold">n</td><td className="p-2">{result.detailed.n}</td></tr>
                      <tr><td className="p-2 font-bold">k</td><td className="p-2">{result.detailed.k}</td></tr>
                      <tr><td className="p-2 font-bold">Σσᵢ²</td><td className="p-2">{result.detailed.sumItemVariances.toFixed(4)}</td></tr>
                      <tr className="bg-[#f0faf4]"><td className="p-2 font-bold">σt²</td><td className="p-2">{result.detailed.totalVariance.toFixed(4)}</td></tr>
                    </tbody>
                  </table>
                </div>

                <FormulaBox
                  tex={`\\alpha=\\frac{${result.detailed.k}}{${result.detailed.k - 1}}\\left(1-\\frac{${result.detailed.sumItemVariances.toFixed(4)}}{${result.detailed.totalVariance.toFixed(4)}}\\right)=${result.detailed.alpha.toFixed(4)}`}
                  copyTex={`\\alpha = \\frac{${result.detailed.k}}{${result.detailed.k - 1}}(1-\\frac{${result.detailed.sumItemVariances.toFixed(4)}}{${result.detailed.totalVariance.toFixed(4)}}) = ${result.detailed.alpha.toFixed(4)}`}
                />
              </div>
            </details>

            <details className="mb-2.5 rounded-xl border border-edge bg-surface shadow-sm">
              <summary className="cursor-pointer p-3.5 font-bold">Pedoman Interpretasi</summary>
              <div className="overflow-x-auto p-4 pt-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="border-b-2 border-edge bg-[#f8f8fc] p-2 text-left">Rentang Alpha</th>
                      <th className="border-b-2 border-edge bg-[#f8f8fc] p-2 text-left">Tingkat Reliabilitas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["≥ 0,90", "Sangat Tinggi", "interp-excellent"],
                      ["0,80 – 0,89", "Tinggi", "interp-good"],
                      ["0,70 – 0,79", "Cukup", "interp-acceptable"],
                      ["0,60 – 0,69", "Rendah", "interp-poor"],
                      ["< 0,60", "Tidak Reliabel", "interp-bad"],
                    ].map(([range, label, css]) => (
                      <tr key={label} className={result!.interp!.level === label ? "bg-[#fffbeb] font-bold" : "hover:bg-[#f8f8fd]"}>
                        <td className="p-2">{range}</td>
                        <td className="p-2">
                          {label}
                          {result.interp!.level === label && (
                            <span className="ml-2 text-xs font-bold text-brand-500">← nilai Anda</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>

            <NarrativeBox text={result.narrative ?? ""} copy />
          </div>
        )}
      </div>
    </main>
  );
}
