"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  ScatterChart,
  Scatter,
  ReferenceLine,
} from "recharts";
import { buildNumericColumn } from "@/lib/csv";
import { loadDataset } from "@/lib/store";
import { postJson } from "@/lib/api";
import type { NormalityResponse } from "@/lib/api-types";
import type { Dataset } from "@/lib/types";
import {
  Alert,
  Badge,
  FormulaBox,
  NarrativeBox,
  StatCard,
  SectionLabel,
  CopyButton,
} from "@/components/ui";

export default function NormalityPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [ds, setDs] = useState<Dataset | null>(null);
  const [method, setMethod] = useState<"shapiro_wilk" | "ks">("shapiro_wilk");
  const [alpha, setAlpha] = useState(0.05);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<NormalityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [activeItem, setActiveItem] = useState<string | null>(null);

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
    if (selected.length < 1) {
      setError("Pilih minimal 1 item.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    setActiveItem(null);
    try {
      const items: Record<string, (number | null)[]> = {};
      for (const name of selected) {
        items[name] = buildNumericColumn(name, ds.headers, ds.rows, ds.columnTypes);
      }
      const res = await postJson<NormalityResponse>("/api/normality", { items, method, alpha });
      if (!res.ok) {
        setError(res.error ?? "Terjadi kesalahan.");
      } else {
        setResult(res);
        if (res.results) {
          const firstKey = Object.keys(res.results)[0];
          setActiveItem(firstKey);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  const generalTex = method === "shapiro_wilk"
    ? "W=\\frac{(\\sum_{i=1}^{n} a_i x_{(i)})^2}{\\sum_{i=1}^{n}(x_i-\\bar{x})^2}"
    : "D=\\max|F_{emp}(x)-F_{theo}(x)|";

  const generalCopyTex = method === "shapiro_wilk"
    ? "W=\\frac{(\\sum a_i x_{(i)})^2}{\\sum(x_i-\\bar{x})^2}"
    : "D=\\max|F_{emp}(x)-F_{theo}(x)|";

  const activeResult = activeItem && result?.results ? result.results[activeItem] : null;

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

      <div className="mx-auto max-w-[920px] px-5 pb-16 pt-7">
        <h1 className="mb-5 text-2xl font-extrabold">Uji Normalitas</h1>

        {numericColumns.length < 1 ? (
          <Alert variant="error">
            Tidak ditemukan kolom numerik pada data Anda. Uji normalitas membutuhkan minimal 1 item numerik.
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
                <h4 className="mb-2.5 text-sm font-bold">Metode Uji Normalitas</h4>
                <label className="flex cursor-pointer items-start gap-2 border-t border-[#f3f3f8] py-2 first:border-t-0">
                  <input
                    type="radio"
                    checked={method === "shapiro_wilk"}
                    onChange={() => setMethod("shapiro_wilk")}
                    className="mt-1 h-4 w-4"
                  />
                  <span>
                    <span className="block text-sm font-semibold">Shapiro-Wilk</span>
                    <span className="mt-0.5 block text-[0.78rem] text-[#888]">
                      Uji paling powerful untuk sample size kecil-sedang (n &lt; 500). Menggunakan koefisien bobot dari statistik order.
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-2 border-t border-[#f3f3f8] py-2">
                  <input
                    type="radio"
                    checked={method === "ks"}
                    onChange={() => setMethod("ks")}
                    className="mt-1 h-4 w-4"
                  />
                  <span>
                    <span className="block text-sm font-semibold">Kolmogorov-Smirnov (Klasik)</span>
                    <span className="mt-0.5 block text-[0.78rem] text-[#888]">
                      Membandingkan distribusi empiris dengan distribusi normal teoritis. Cocok untuk sample size lebih besar.
                    </span>
                  </span>
                </label>
              </div>

              <div className="rounded-xl bg-surface p-4 shadow-sm">
                <h4 className="mb-2.5 text-sm font-bold">Tingkat Signifikansi (α)</h4>
                <label className="flex cursor-pointer items-start gap-2 border-t border-[#f3f3f8] py-2 first:border-t-0">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="0.20"
                    value={alpha}
                    onChange={(e) => setAlpha(parseFloat(e.target.value) || 0.05)}
                    className="mt-0.5 w-24 rounded-lg border border-[#ddd] px-2.5 py-1.5 text-sm outline-none focus:ring-[3px] focus:ring-brand-500/15"
                  />
                  <span className="mt-0.5 text-[0.78rem] text-[#888]">
                    Nilai α menentukan ambang batas p-value. Jika p-value &gt; α, data dinyatakan normal. Default: 0.05 (5%).
                  </span>
                </label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[0.01, 0.05, 0.10].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAlpha(v)}
                      className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                        alpha === v
                          ? "bg-brand-500 text-white"
                          : "bg-[#f0f0f5] text-[#777] hover:bg-brand-50 hover:text-brand-500"
                      }`}
                    >
                      α = {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

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
              {loading ? "Menghitung..." : "Hitung Normalitas"}
            </button>
          </form>
        )}

        {result && result.ok && result.results && (
          <div className="mt-6">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge ok={true}>{result.methodLabel}</Badge>
              <span className="rounded-full bg-[#f0f0f5] px-3 py-1 text-xs font-bold text-[#777]">
                α = {result.alpha}
              </span>
            </div>

            <div className="mb-6 flex flex-wrap gap-3.5">
              <StatCard value={result.summary?.totalTested ?? 0} label="Item Diuji" />
              <StatCard value={result.summary?.normalCount ?? 0} label="Normal" />
              <StatCard value={result.summary?.notNormalCount ?? 0} label="Tidak Normal" />
            </div>

            <FormulaBox title="Rumus Umum" tex={generalTex} copyTex={generalCopyTex} />

            <SectionLabel>Rekapitulasi</SectionLabel>
            <div className="overflow-x-auto rounded-xl border border-edge bg-surface shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="border-b-2 border-edge bg-[#f8f8fc] p-2.5 text-left">Item</th>
                    <th className="border-b-2 border-edge bg-[#f8f8fc] p-2.5 text-left">n</th>
                    <th className="border-b-2 border-edge bg-[#f8f8fc] p-2.5 text-left">Statistik</th>
                    <th className="border-b-2 border-edge bg-[#f8f8fc] p-2.5 text-left">p-value</th>
                    <th className="border-b-2 border-edge bg-[#f8f8fc] p-2.5 text-left">Kesimpulan</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.results).map(([name, r]) => (
                    <tr
                      key={name}
                      className={`cursor-pointer transition ${
                        activeItem === name ? "bg-brand-50" : r.isNormal ? "bg-[#f3fbf5]" : "bg-[#fdf4f4]"
                      }`}
                      onClick={() => setActiveItem(name)}
                    >
                      <td className="p-2.5 font-semibold">{name}</td>
                      <td className="p-2.5">{r.n}</td>
                      <td className="p-2.5 font-mono text-xs">{r.statDisplay ?? "—"}</td>
                      <td className="p-2.5">{r.pValue !== null ? r.pValue.toFixed(4) : "—"}</td>
                      <td className="p-2.5">
                        {r.error ? (
                          <span className="text-xs text-[#c0392b]">Error</span>
                        ) : (
                          <Badge ok={r.isNormal}>{r.isNormal ? "Normal" : "Tidak Normal"}</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {activeResult && activeResult.histogram && activeResult.qqData && (
              <>
                <SectionLabel>Visualisasi — {activeItem}</SectionLabel>

                <div className="mb-5 rounded-xl border border-edge bg-surface p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-bold">Histogram dengan Kurva Normal</h4>
                    <CopyButton text={activeResult.narrative ?? ""} />
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={activeResult.histogram}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eaecf5" />
                      <XAxis
                        dataKey="binLabel"
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Bar dataKey="count" fill="#4338ca" radius={[4, 4, 0, 0]} name="Frekuensi" />
                      <Line
                        type="monotone"
                        dataKey="normalY"
                        stroke="#e74c3c"
                        strokeWidth={2}
                        dot={false}
                        name="Normal"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="mb-5 rounded-xl border border-edge bg-surface p-5 shadow-sm">
                  <h4 className="mb-3 text-sm font-bold">QQ-Plot (Quantile-Quantile)</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eaecf5" />
                      <XAxis
                        type="number"
                        dataKey="theoretical"
                        name="Theoretical"
                        tick={{ fontSize: 11 }}
                        label={{ value: "Theoretical Quantiles", position: "bottom", offset: -5, fontSize: 12 }}
                      />
                      <YAxis
                        type="number"
                        dataKey="sample"
                        name="Sample"
                        tick={{ fontSize: 11 }}
                        label={{ value: "Sample Quantiles", angle: -90, position: "insideLeft", offset: 10, fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <ReferenceLine
                        segment={[
                          {
                            x: activeResult.qqData![0]?.theoretical ?? -3,
                            y: activeResult.qqData![0]?.sample ?? -3,
                          },
                          {
                            x: activeResult.qqData![activeResult.qqData!.length - 1]?.theoretical ?? 3,
                            y: activeResult.qqData![activeResult.qqData!.length - 1]?.sample ?? 3,
                          },
                        ]}
                        stroke="#999"
                        strokeDasharray="5 5"
                      />
                      <Scatter data={activeResult.qqData} fill="#4338ca" />
                    </ScatterChart>
                  </ResponsiveContainer>
                  <p className="mt-2 text-center text-[0.75rem] text-soft">
                    Jika titik-titik mengikuti garis lurus, data berdistribusi normal.
                  </p>
                </div>
              </>
            )}

            <SectionLabel>Detail Per Item</SectionLabel>
            {Object.entries(result.results).map(([name, r]) => (
              <details
                key={name}
                open={activeItem === name}
                className="mb-2.5 rounded-xl border border-edge bg-surface shadow-sm"
              >
                <summary
                  className="flex cursor-pointer items-center justify-between p-3.5 font-bold"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveItem(name);
                  }}
                >
                  <span>{name}</span>
                  {r.error ? (
                    <span className="text-xs text-[#c0392b]">Error</span>
                  ) : (
                    <Badge ok={r.isNormal}>{r.isNormal ? "Normal" : "Tidak Normal"}</Badge>
                  )}
                </summary>
                <div className="p-4 pt-0">
                  {r.error ? (
                    <Alert variant="warning">{r.error}</Alert>
                  ) : (
                    <>
                      <div className="mt-3 max-w-md overflow-x-auto rounded-lg border border-edge">
                        <table className="w-full text-sm">
                          <tbody>
                            <tr><td className="p-2 font-bold">n</td><td className="p-2">{r.n}</td></tr>
                            {r.mean !== undefined && (
                              <tr><td className="p-2 font-bold">Mean</td><td className="p-2">{r.mean.toFixed(4)}</td></tr>
                            )}
                            {r.sd !== undefined && (
                              <tr><td className="p-2 font-bold">Std. Dev</td><td className="p-2">{r.sd.toFixed(4)}</td></tr>
                            )}
                            {r.W !== undefined && (
                              <tr><td className="p-2 font-bold">W (Shapiro-Wilk)</td><td className="p-2">{r.W.toFixed(4)}</td></tr>
                            )}
                            {r.D !== undefined && (
                              <>
                                <tr><td className="p-2 font-bold">D (K-S)</td><td className="p-2">{r.D.toFixed(4)}</td></tr>
                                {r.dPlus !== undefined && (
                                  <tr><td className="p-2 font-bold">D+</td><td className="p-2">{r.dPlus.toFixed(4)}</td></tr>
                                )}
                                {r.dMinus !== undefined && (
                                  <tr><td className="p-2 font-bold">D-</td><td className="p-2">{r.dMinus.toFixed(4)}</td></tr>
                                )}
                              </>
                            )}
                            <tr>
                              <td className="p-2 font-bold">p-value</td>
                              <td className="p-2 font-bold">{r.pValue !== null ? r.pValue.toFixed(4) : "—"}</td>
                            </tr>
                            <tr><td className="p-2 font-bold">α</td><td className="p-2">{result.alpha}</td></tr>
                            <tr>
                              <td className="p-2 font-bold">Kesimpulan</td>
                              <td className="p-2">{r.isNormal ? "Normal" : "Tidak Normal"}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <FormulaBox
                        tex={method === "shapiro_wilk"
                          ? `W=${r.W?.toFixed(4) ?? "—"}`
                          : `D=${r.D?.toFixed(4) ?? "—"}`
                        }
                      />

                      {r.narrative && <NarrativeBox text={r.narrative} copy />}
                    </>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
