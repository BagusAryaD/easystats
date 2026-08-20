"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { buildNumericColumn } from "@/lib/csv";
import { loadDataset } from "@/lib/store";
import { postJson } from "@/lib/api";
import type { RegressionResponse } from "@/lib/api-types";
import type { Dataset } from "@/lib/types";
import {
  Alert,
  Badge,
  FormulaBox,
  NarrativeBox,
  StatCard,
  SectionLabel,
} from "@/components/ui";

export default function RegressionPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [ds, setDs] = useState<Dataset | null>(null);
  const [yVar, setYVar] = useState("");
  const [xVars, setXVars] = useState<string[]>([]);
  const [result, setResult] = useState<RegressionResponse | null>(null);
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

  const toggleX = (name: string) => {
    if (name === yVar) return;
    setXVars((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  const setY = (name: string) => {
    setYVar(name);
    setXVars((prev) => prev.filter((x) => x !== name));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yVar) {
      setError("Pilih satu variabel dependen (Y).");
      return;
    }
    if (xVars.length < 1) {
      setError("Pilih minimal satu variabel independen (X).");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const x: Record<string, (number | null)[]> = {};
      for (const name of xVars) {
        x[name] = buildNumericColumn(name, ds.headers, ds.rows, ds.columnTypes);
      }
      const res = await postJson<RegressionResponse>("/api/regression", {
        y: buildNumericColumn(yVar, ds.headers, ds.rows, ds.columnTypes),
        x,
        y_name: yVar,
      });
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
      <header className="flex flex-wrap items-center gap-5 border-b border-edge bg-surface px-6 py-4">
        <Link href="/preview" className="text-sm font-semibold text-brand-500">
          ← Kembali ke Preview
        </Link>
        <Link href="/tutorial" className="flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:gap-3">
          <BookOpen size={16} /> Cara Copy ke Word
        </Link>
      </header>

      <div className="mx-auto max-w-[920px] px-5 pb-16 pt-7">
        <h1 className="mb-2 text-2xl font-extrabold">Uji Regresi Linear Berganda</h1>

        {numericColumns.length < 2 ? (
          <Alert variant="error">
            Hanya ditemukan {numericColumns.length} kolom numerik pada data Anda. Regresi
            linear membutuhkan minimal 1 variabel dependen (Y) dan 1 variabel independen (X).
            <br />
            <Link href="/preview" className="font-bold underline">
              ← Kembali ke Preview
            </Link>{" "}
            untuk memeriksa data.
          </Alert>
        ) : (
          <form onSubmit={submit}>
            <div className="mb-5 rounded-xl bg-surface p-5 shadow-sm">
              <h3 className="mb-2 text-[0.95rem] font-bold">1. Pilih Variabel Dependen (Y)</h3>
              <select
                value={yVar}
                onChange={(e) => setY(e.target.value)}
                className="w-full rounded-lg border border-[#ddd] p-2.5 text-sm outline-none focus:ring-[3px] focus:ring-brand-500/15"
              >
                <option value="">— Pilih satu variabel Y —</option>
                {numericColumns.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-5 rounded-xl bg-surface p-5 shadow-sm">
              <h3 className="mb-2 text-[0.95rem] font-bold">2. Pilih Variabel Independen (X) — boleh lebih dari satu</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {numericColumns.map((name) => {
                  const disabled = name === yVar;
                  return (
                    <label
                      key={name}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm transition ${
                        disabled
                          ? "cursor-not-allowed border-edge bg-[#fafafc] opacity-40"
                          : xVars.includes(name)
                            ? "border-brand-500 bg-brand-50"
                            : "border-edge bg-[#fafafc]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={xVars.includes(name)}
                        disabled={disabled}
                        onChange={() => toggleX(name)}
                        className="h-4 w-4"
                      />
                      <span className="truncate">{name}</span>
                    </label>
                  );
                })}
              </div>
              {xVars.some((x) => x === yVar) && (
                <p className="mt-1 text-[0.78rem] text-[#c0392b]">
                  Variabel yang dipilih sebagai Y otomatis tidak bisa dipilih sebagai X.
                </p>
              )}
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
              {loading ? "Menghitung..." : "Hitung Regresi"}
            </button>
          </form>
        )}

        {result && result.ok && result.regression && (
          <div className="mt-6">
            {(() => {
              const r = result.regression!;
              return (
                <>
                  <div className="mb-6 flex flex-wrap gap-3.5">
                    <StatCard value={r.n} label="N Digunakan" />
                    <StatCard value={r.k} label="Jumlah Variabel X" />
                    <StatCard value={r.rSquared !== null ? r.rSquared.toFixed(4) : "—"} label="R²" />
                    <StatCard value={r.adjustedRSquared !== null ? r.adjustedRSquared.toFixed(4) : "—"} label="Adjusted R²" />
                    <StatCard value={ds.rows.length - r.n} label="Responden Dikeluarkan" />
                  </div>

                  <FormulaBox
                    title="Rumus Umum Regresi Linear Berganda"
                    tex={r.k > 0 ? `\\hat{Y}=b_0+\\sum_{i=1}^{${r.k}}b_iX_i` : "\\hat{Y}=b_0"}
                    copyTex={r.k > 0 ? `\\hat{Y}=b_0+b_1X_1+...+b_{${r.k}}X_{${r.k}}` : "\\hat{Y}=b_0"}
                  />

                  <FormulaBox
                    title="Persamaan Regresi (Substitusi Nilai)"
                    tex={(() => {
                      let t = `\\hat{Y}=${r.coefficients["_constant"].toFixed(4)}`;
                      for (const name of r.xNames) {
                        const c = r.coefficients[name];
                        t += c >= 0 ? `+${c.toFixed(4)}\\cdot\\text{${name}}` : `-${Math.abs(c).toFixed(4)}\\cdot\\text{${name}}`;
                      }
                      return t;
                    })()}
                    copyTex={(() => {
                      let t = `\\hat{Y}=${r.coefficients["_constant"].toFixed(4)}`;
                      for (const name of r.xNames) {
                        const c = r.coefficients[name];
                        t += c >= 0 ? `+${c.toFixed(4)}\\cdot\\text{${name}}` : `-${Math.abs(c).toFixed(4)}\\cdot\\text{${name}}`;
                      }
                      return t;
                    })()}
                  />

                  <SectionLabel>Uji Simultan (Uji F)</SectionLabel>
                  <div className="overflow-x-auto rounded-xl border border-edge bg-surface shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="border-b-2 border-edge bg-[#f8f8fc] p-2.5 text-left">Sumber Variasi</th>
                          <th className="border-b-2 border-edge bg-[#f8f8fc] p-2.5 text-left">df</th>
                          <th className="border-b-2 border-edge bg-[#f8f8fc] p-2.5 text-left">Sum of Squares</th>
                          <th className="border-b-2 border-edge bg-[#f8f8fc] p-2.5 text-left">Mean Square</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td className="p-2.5">Regresi</td><td className="p-2.5">{r.dfRegression}</td><td className="p-2.5">{r.ssRegression.toFixed(4)}</td><td className="p-2.5">{r.msRegression !== null ? r.msRegression.toFixed(4) : "—"}</td></tr>
                        <tr><td className="p-2.5">Residual</td><td className="p-2.5">{r.dfResidual}</td><td className="p-2.5">{r.ssResidual.toFixed(4)}</td><td className="p-2.5">{r.msResidual !== null ? r.msResidual.toFixed(4) : "—"}</td></tr>
                        <tr><td className="p-2.5">Total</td><td className="p-2.5">{r.dfTotal}</td><td className="p-2.5">{r.ssTotal.toFixed(4)}</td><td className="p-2.5">—</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 max-w-lg overflow-x-auto rounded-xl border border-edge bg-surface shadow-sm">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className={result.fStatus === "Signifikan" ? "bg-[#f3fbf5]" : "bg-[#fdf4f4]"}>
                          <td className="p-2.5 font-bold">F_hitung</td>
                          <td className="p-2.5">{r.fHitung !== null ? r.fHitung.toFixed(4) : "—"}</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold">F_tabel (α=0,05)</td>
                          <td className="p-2.5">{result.fTabel != null ? result.fTabel.toFixed(4) : "— (lihat tabel F lengkap)"}</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold">Kesimpulan</td>
                          <td className="p-2.5">
                            <Badge ok={result.fStatus === "Signifikan"}>{result.fStatus}</Badge>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {result.fTabel == null && (
                    <Alert variant="warning">
                      F tabel tidak tersedia untuk kombinasi df1={r.dfRegression} / df2={r.dfResidual}{" "}
                      pada tabel bawaan (df1 di atas 5). Silakan cek tabel F lengkap secara manual untuk α = 0,05.
                    </Alert>
                  )}

                  <SectionLabel>Uji Parsial (Uji t) Tiap Koefisien</SectionLabel>
                  <div className="overflow-x-auto rounded-xl border border-edge bg-surface shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="border-b-2 border-edge bg-[#f8f8fc] p-2.5 text-left">Variabel</th>
                          <th className="border-b-2 border-edge bg-[#f8f8fc] p-2.5 text-left">Koefisien (b)</th>
                          <th className="border-b-2 border-edge bg-[#f8f8fc] p-2.5 text-left">Std. Error</th>
                          <th className="border-b-2 border-edge bg-[#f8f8fc] p-2.5 text-left">t_hitung</th>
                          <th className="border-b-2 border-edge bg-[#f8f8fc] p-2.5 text-left">t_tabel</th>
                          <th className="border-b-2 border-edge bg-[#f8f8fc] p-2.5 text-left">Kesimpulan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.coefficientResults &&
                          Object.entries(result.coefficientResults).map(([key, cr]) => (
                            <tr key={key} className={cr.status === "Signifikan" ? "bg-[#f3fbf5]" : "bg-[#fdf4f4]"}>
                              <td className="p-2.5">{cr.name}</td>
                              <td className="p-2.5">{cr.coef.toFixed(4)}</td>
                              <td className="p-2.5">{cr.se !== null ? cr.se.toFixed(4) : "—"}</td>
                              <td className="p-2.5">{cr.tHitung !== null ? cr.tHitung.toFixed(4) : "—"}</td>
                              <td className="p-2.5">{cr.tTabel !== null ? cr.tTabel.toFixed(4) : "—"}</td>
                              <td className="p-2.5">
                                <Badge ok={cr.status === "Signifikan"}>{cr.status}</Badge>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  <SectionLabel>Narasi Hasil Regresi</SectionLabel>
                  <div className="flex items-start justify-between gap-2">
                    <NarrativeBox text={result.narrative ?? ""} copy />
                  </div>

                  <SectionLabel>Narasi Per Variabel (Uji t)</SectionLabel>
                  {result.coefficientResults &&
                    Object.entries(result.coefficientResults)
                      .filter(([key]) => key !== "_constant")
                      .map(([key, cr]) => (
                        <details key={key} className="mb-2.5 rounded-xl border border-edge bg-surface shadow-sm">
                          <summary className="flex cursor-pointer items-center justify-between p-3.5 font-bold">
                            <span>{cr.name}</span>
                            <Badge ok={cr.status === "Signifikan"}>{cr.status}</Badge>
                          </summary>
                          <div className="p-4 pt-0">
                            {cr.narrative ? <NarrativeBox text={cr.narrative} copy /> : <NarrativeBox text="Narasi tidak tersedia." />}
                          </div>
                        </details>
                      ))}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </main>
  );
}
