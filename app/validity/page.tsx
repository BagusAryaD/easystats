"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { buildNumericColumn } from "@/lib/csv";
import { loadDataset } from "@/lib/store";
import { postJson } from "@/lib/api";
import type { ValidityResponse } from "@/lib/api-types";
import type { Dataset } from "@/lib/types";
import { BookOpen } from "lucide-react";
import {
  Alert,
  Badge,
  FormulaBox,
  NarrativeBox,
  Pill,
  SectionLabel,
  StatCard,
  CopyButton,
} from "@/components/ui";

export default function ValidityPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [ds, setDs] = useState<Dataset | null>(null);
  const [technique, setTechnique] = useState<"item_total" | "item_total_corrected">("item_total");
  const [method, setMethod] = useState<"pearson" | "spearman">("pearson");
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<ValidityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

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
      const res = await postJson<ValidityResponse>("/api/validity", { items, technique, method });
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

  const coefSymbol = method === "spearman" ? "ρ" : "r";
  const generalTex = method === "spearman"
    ? "\\rho=1-\\frac{6\\sum d^2}{n(n^2-1)}"
    : "r_{xy}=\\frac{n\\sum xy-(\\sum x)(\\sum y)}{\\sqrt{[n\\sum x^2-(\\sum x)^2][n\\sum y^2-(\\sum y)^2]}}";

  return (
    <main>
      <header className="flex flex-wrap items-center gap-5 border-b border-edge bg-surface px-6 py-4">
        <Link href="/preview" className="text-sm font-semibold text-brand-500">
          ← Kembali ke Preview
        </Link>
        <Link href="/tutorial" className="flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:gap-3">
          <BookOpen size={16} /> Cara Copy ke Word
        </Link>
      </header>

      <div className="mx-auto max-w-[900px] px-5 pb-16 pt-7">
        <h1 className="mb-5 text-2xl font-extrabold">Uji Validitas</h1>

        {numericColumns.length < 2 ? (
          <Alert variant="error">
            Hanya ditemukan {numericColumns.length} kolom numerik pada data Anda. Uji
            validitas membutuhkan minimal 2 item numerik.
            <br />
            <Link href="/preview" className="font-bold underline">
              ← Kembali ke Preview
            </Link>{" "}
            untuk memeriksa data.
          </Alert>
        ) : (
          <form onSubmit={submit}>
            <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-surface p-4 shadow-sm">
                <h4 className="mb-2.5 text-sm font-bold">Teknik Uji Validitas</h4>
                <RadioOption
                  checked={technique === "item_total"}
                  onChange={() => setTechnique("item_total")}
                  title="Item-Total"
                  desc="Setiap item dikorelasikan dengan total skor seluruh item (item itu sendiri tetap ikut dihitung dalam total)."
                />
                <RadioOption
                  checked={technique === "item_total_corrected"}
                  onChange={() => setTechnique("item_total_corrected")}
                  title="Item-Total Corrected"
                  desc="Setiap item dikorelasikan dengan total skor item-item lain (item yang sedang diuji dikeluarkan dari total, mirip SPSS)."
                />
              </div>

              <div className="rounded-xl bg-surface p-4 shadow-sm">
                <h4 className="mb-2.5 text-sm font-bold">Teknik Korelasi</h4>
                <RadioOption
                  checked={method === "pearson"}
                  onChange={() => setMethod("pearson")}
                  title="Pearson (Product Moment)"
                  desc="Untuk data berskala interval/rasio."
                />
                <RadioOption
                  checked={method === "spearman"}
                  onChange={() => setMethod("spearman")}
                  title="Spearman (Rank Order)"
                  desc="Untuk data berskala ordinal — menggunakan ranking data, lebih sesuai untuk skala Likert yang dianggap ordinal."
                />
              </div>
            </div>

            <Alert variant="info">
              Nilai r_tabel yang dipakai sebagai pembanding berasal dari tabel r Product
              Moment (df = n−2). Untuk uji Spearman, nilai ρ_hitung tetap dibandingkan
              dengan tabel ini sebagai pendekatan praktis yang umum dipakai.
            </Alert>

            <label className="mb-2.5 flex w-fit cursor-pointer items-center gap-2 text-sm">
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
              className="rounded-xl bg-brand-500 px-7 py-3 text-[0.95rem] font-bold text-white shadow transition hover:-translate-y-px hover:bg-brand-600 disabled:opacity-60"
            >
              {loading ? "Menghitung..." : "Hitung Validitas"}
            </button>
          </form>
        )}

        {result && result.ok && result.itemResults && (
          <div className="mt-6">
            <div className="mb-3 flex flex-wrap gap-2">
              <Pill>Teknik: {result.techniqueLabel}</Pill>
              <Pill>Korelasi: {result.methodLabel}</Pill>
            </div>

            {result.technique === "item_total_corrected" && result.totalTested === 2 && (
              <Alert variant="warning">
                Dengan hanya 2 item yang diuji, teknik item-total corrected akan
                menghasilkan nilai yang sama dengan korelasi langsung antar kedua item.
              </Alert>
            )}

            <div className="mb-6 flex flex-wrap gap-3.5">
              <StatCard value={result.totalTested} label="Item Diuji" />
              <StatCard value={result.validCount} label="Item Valid" />
              <StatCard value={result.invalidCount} label="Item Tidak Valid" />
              <StatCard value={ds.rows.length - (Object.values(result.itemResults)[0]?.components.n ?? ds.rows.length)} label="Responden Dikeluarkan" />
            </div>

            {result.rTabel === null && (
              <Alert variant="warning">
                Nilai r tabel tidak dapat ditentukan untuk df = {result.df} (di luar
                jangkauan tabel yang tersedia, df &lt; 1).
              </Alert>
            )}

            <FormulaBox title={`Rumus ${result.methodLabel}`} tex={generalTex} copyTex={method === "spearman"
              ? "\\rho=1-\\frac{6\\sum d^2}{n(n^2-1)}"
              : "r_{xy}=\\frac{n\\sum xy-(\\sum x)(\\sum y)}{\\sqrt{[n\\sum x^2-(\\sum x)^2][n\\sum y^2-(\\sum y)^2]}}" } />

            <div className="mt-6 flex items-center justify-between">
              <SectionLabel>Rekapitulasi</SectionLabel>
              <CopyButton
                text={Object.values(result.itemResults)
                  .map((r) => r.narrative)
                  .join("\n\n")}
              />
            </div>

            <div className="overflow-x-auto rounded-xl border border-edge bg-surface shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="border-b-2 border-edge bg-[#f8f8fc] p-2.5 text-left">Item</th>
                    <th className="border-b-2 border-edge bg-[#f8f8fc] p-2.5 text-left">n</th>
                    <th className="border-b-2 border-edge bg-[#f8f8fc] p-2.5 text-left">{coefSymbol}_hitung</th>
                    <th className="border-b-2 border-edge bg-[#f8f8fc] p-2.5 text-left">r_tabel</th>
                    <th className="border-b-2 border-edge bg-[#f8f8fc] p-2.5 text-left">Kesimpulan</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.itemResults).map(([name, r]) => (
                    <tr key={name} className={r.status === "Valid" ? "bg-[#f3fbf5]" : "bg-[#fdf4f4]"}>
                      <td className="p-2.5">{name}</td>
                      <td className="p-2.5">{r.components.n}</td>
                      <td className="p-2.5">{r.rHitung !== null ? r.rHitung.toFixed(4) : "—"}</td>
                      <td className="p-2.5">{r.rTabel !== null ? r.rTabel.toFixed(4) : "—"}</td>
                      <td className="p-2.5">
                        <Badge ok={r.status === "Valid"}>{r.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <SectionLabel>Detail Per Item</SectionLabel>

            {Object.entries(result.itemResults).map(([name, r]) => (
              <details key={name} className="mb-2.5 rounded-xl border border-edge bg-surface shadow-sm">
                <summary className="flex cursor-pointer items-center justify-between p-3.5 font-bold">
                  <span>{name}</span>
                  <Badge ok={r.status === "Valid"}>{r.status}</Badge>
                </summary>
                <div className="p-4 pt-0">
                  {r.isNegative && (
                    <Alert variant="warning">
                      Nilai {coefSymbol}_hitung negatif. Indikasi item perlu reverse
                      coding (arah penilaian berlawanan dengan item lain).
                    </Alert>
                  )}

                  <div className="mt-3 overflow-x-auto rounded-lg border border-edge">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr><td className="p-2 font-bold">n</td><td className="p-2">{r.components.n}</td></tr>
                        {method === "spearman" ? (
                          <>
                            <tr><td className="p-2 font-bold">Σd²</td><td className="p-2">{(r.components.sumD2 ?? 0).toFixed(4)}</td></tr>
                            <tr className="bg-[#f3fbf5]"><td className="p-2 font-bold">ρ_hitung</td><td className="p-2">{r.rHitung?.toFixed(4)}</td></tr>
                          </>
                        ) : (
                          <>
                            <tr><td className="p-2 font-bold">Σx</td><td className="p-2">{(r.components.sumX ?? 0).toFixed(4)}</td></tr>
                            <tr><td className="p-2 font-bold">Σy</td><td className="p-2">{(r.components.sumY ?? 0).toFixed(4)}</td></tr>
                            <tr><td className="p-2 font-bold">Σxy</td><td className="p-2">{(r.components.sumXY ?? 0).toFixed(4)}</td></tr>
                            <tr><td className="p-2 font-bold">Σx²</td><td className="p-2">{(r.components.sumX2 ?? 0).toFixed(4)}</td></tr>
                            <tr><td className="p-2 font-bold">Σy²</td><td className="p-2">{(r.components.sumY2 ?? 0).toFixed(4)}</td></tr>
                            <tr className="bg-[#f3fbf5]"><td className="p-2 font-bold">r_hitung</td><td className="p-2">{r.rHitung?.toFixed(4)}</td></tr>
                          </>
                        )}
                        <tr><td className="p-2 font-bold">r_tabel</td><td className="p-2">{r.rTabel !== null ? r.rTabel.toFixed(4) : "—"}</td></tr>
                        <tr><td className="p-2 font-bold">Kesimpulan</td><td className="p-2">{r.status}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  {r.latexSub && (
                    <FormulaBox tex={r.latexSub} copyTex={r.latexSubCopy ?? undefined} />
                  )}

                  <NarrativeBox text={r.narrative} copy />
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function RadioOption({
  checked,
  onChange,
  title,
  desc,
}: {
  checked: boolean;
  onChange: () => void;
  title: string;
  desc: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 border-t border-[#f3f3f8] py-2 first:border-t-0">
      <input type="radio" checked={checked} onChange={onChange} className="mt-1 h-4 w-4" />
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-[0.78rem] text-[#888]">{desc}</span>
      </span>
    </label>
  );
}
