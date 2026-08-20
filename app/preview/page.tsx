"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  Activity,
  BarChart2,
  CheckCircle2,
  Eye,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { isNumeric } from "@/lib/csv";
import { clearDataset, loadDataset, saveDataset } from "@/lib/store";
import type { ColumnType, Dataset } from "@/lib/types";
import { Alert } from "@/components/ui";

export default function PreviewPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [ds, setDs] = useState<Dataset | null>(null);

  useEffect(() => {
    const d = loadDataset();
    if (!d) {
      router.replace("/");
      return;
    }
    setDs(d);
    setReady(true);
  }, [router]);

  const { numericCount, coercedTotal, coercedByColumn, previewRows } = useMemo(() => {
    if (!ds) return { numericCount: 0, coercedTotal: 0, coercedByColumn: {}, previewRows: [] };

    const coercedByColumn: Record<string, number> = {};
    let total = 0;
    for (const h of ds.headers) {
      if (ds.columnTypes[h] !== "numeric") continue;
      const idx = ds.headers.indexOf(h);
      let c = 0;
      for (const row of ds.rows) {
        const v = row[idx] ?? "";
        if (v !== "" && !isNumeric(v)) c++;
      }
      coercedByColumn[h] = c;
      total += c;
    }

    const numericCount = ds.headers.filter((h) => ds.columnTypes[h] === "numeric").length;
    const previewRows = ds.rows.slice(0, 8);

    return { numericCount, coercedTotal: total, coercedByColumn, previewRows };
  }, [ds]);

  if (!ready || !ds) {
    return <div className="p-10 text-center text-soft">Memuat data...</div>;
  }

  const updateType = (h: string, t: ColumnType) => {
    const next: Dataset = { ...ds, columnTypes: { ...ds.columnTypes, [h]: t } };
    setDs(next);
    saveDataset(next);
  };

  const reset = () => {
    clearDataset();
    router.push("/");
  };

  const analysisCards = [
    {
      href: "/validity",
      title: "Uji Validitas",
      desc: "Pearson Product Moment per item, lengkap dengan narasi dan LaTeX.",
      icon: CheckCircle2,
      iconBg: "bg-[#eef9f2] text-[#1a7a3c]",
    },
    {
      href: "/reliability",
      title: "Uji Reliabilitas",
      desc: "Cronbach's Alpha lengkap dengan interpretasi dan narasi siap pakai.",
      icon: ShieldCheck,
      iconBg: "bg-brand-50 text-brand-500",
    },
    {
      href: "/regression",
      title: "Regresi Linear",
      desc: "Regresi linear berganda dengan satu Y dan beberapa X pilihan.",
      icon: TrendingUp,
      iconBg: "bg-[#fef3ee] text-[#c2440e]",
    },
    {
      href: "/normality",
      title: "Uji Normalitas",
      desc: "Shapiro-Wilk dan Kolmogorov-Smirnov untuk menguji distribusi normal data.",
      icon: Activity,
      iconBg: "bg-[#f0f4ff] text-[#2563eb]",
    },
  ];

  return (
    <main>
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-edge bg-surface px-7 shadow-sm">
        <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:gap-3">
          <ArrowLeft size={15} /> Upload Data Lain
        </Link>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1.5 rounded-md border border-edge px-3 py-1.5 text-[0.82rem] font-semibold text-soft transition hover:border-[#c0392b] hover:bg-[#fdf4f4] hover:text-[#c0392b]"
        >
          <RotateCcw size={13} /> Mulai Ulang
        </button>
      </header>

      <div className="mx-auto max-w-[1020px] px-6 pb-20 pt-8">
        <h1 className="mb-6 text-2xl font-extrabold">Preview Data</h1>

        <div className="mb-6 flex flex-wrap gap-3.5">
          <div className="min-w-[140px] flex-1 rounded-xl border border-transparent bg-surface p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-edge">
            <div className="text-2xl font-extrabold text-brand-500">{ds.rows.length}</div>
            <div className="text-xs text-soft">Baris Responden</div>
          </div>
          <div className="min-w-[140px] flex-1 rounded-xl border border-transparent bg-surface p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-edge">
            <div className="text-2xl font-extrabold text-brand-500">{ds.headers.length}</div>
            <div className="text-xs text-soft">Total Kolom</div>
          </div>
          <div className="min-w-[140px] flex-1 rounded-xl border border-transparent bg-surface p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-edge">
            <div className="text-2xl font-extrabold text-brand-500">{numericCount}</div>
            <div className="text-xs text-soft">Kolom Numerik</div>
          </div>
          <div className="min-w-[140px] flex-1 rounded-xl border border-transparent bg-surface p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-edge">
            <div className="text-xl font-extrabold text-brand-500">{ds.delimiterLabel}</div>
            <div className="text-xs text-soft">Delimiter Terdeteksi</div>
          </div>
        </div>

        {coercedTotal > 0 && (
          <Alert variant="warning">
            <strong>Konversi tipe data:</strong> {coercedTotal} nilai pada kolom yang
            ditandai numerik ternyata bukan angka, dan akan diperlakukan sebagai data
            hilang (missing) saat analisis.
          </Alert>
        )}

        <Alert variant="info">
          Ubah tipe tiap kolom langsung lewat dropdown di header tabel. Jika kolom
          dipaksa <strong>Numerik</strong>, nilai yang bukan angka otomatis dianggap
          missing saat dianalisis.
        </Alert>

        <div className="overflow-x-auto rounded-xl border border-edge bg-surface shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {ds.headers.map((h) => (
                  <th key={h} className="whitespace-nowrap border-b-2 border-edge bg-[#f8f8fc] p-3 pt-3 text-left align-top">
                    <span className="mb-1.5 block max-w-[160px] truncate font-bold" title={h}>
                      {h !== "" ? h : "(tanpa nama)"}
                    </span>
                    <select
                      value={ds.columnTypes[h]}
                      onChange={(e) => updateType(h, e.target.value as ColumnType)}
                      className={`w-full cursor-pointer appearance-none rounded-md border-[1.5px] px-2 py-1 pr-5 text-xs font-bold outline-none transition focus:ring-[3px] focus:ring-brand-500/15 ${
                        ds.columnTypes[h] === "numeric"
                          ? "border-[#a3d9b8] bg-[#f0faf4] text-[#1a7a3c]"
                          : "border-[#ddd] bg-[#fafafa] text-[#777]"
                      }`}
                    >
                      <option value="numeric">Numerik</option>
                      <option value="categorical">Kategorik</option>
                    </select>
                    {(coercedByColumn[h] ?? 0) > 0 && (
                      <div className="mt-1 flex items-center gap-1 text-xs font-bold text-[#c0392b]">
                        <AlertCircle size={10} /> {coercedByColumn[h]} jadi missing
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, i) => (
                <tr key={i} className="hover:bg-[#f8f8fd]">
                  {ds.headers.map((h) => {
                    const idx = ds.headers.indexOf(h);
                    const raw = row[idx] ?? "";
                    const coerced =
                      ds.columnTypes[h] === "numeric" && raw !== "" && !isNumeric(raw);
                    return (
                      <td key={h} className="whitespace-nowrap border-b border-[#f3f3f8] px-3.5 py-2.5">
                        {coerced ? (
                          <span className="italic text-[#c0392b]">{raw} → missing</span>
                        ) : (
                          <span className={raw === "" ? "text-soft" : ""}>{raw !== "" ? raw : "—"}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="my-2.5 mb-7 flex items-center gap-1.5 text-[0.79rem] text-soft">
          <Eye size={13} className="text-[#ccc]" />
          Menampilkan {previewRows.length} dari {ds.rows.length} baris data. Sel merah
          menandakan nilai yang akan dianggap missing karena kolom ditandai numerik.
        </p>

        {numericCount < 2 && (
          <Alert variant="warning">
            Hanya ada <strong>{numericCount}</strong> kolom bertipe numerik saat ini. Uji
            membutuhkan minimal 2 kolom numerik. Ubah tipe kolom di header tabel jika perlu.
          </Alert>
        )}

        <div className="mb-3 mt-8 text-xs font-bold uppercase tracking-widest text-soft">
          Pilih Analisis
        </div>

        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {analysisCards.map((card) => {
            const disabled = numericCount < 2;
            return (
              <div
                key={card.href}
                className={`flex flex-col items-center rounded-2xl border-2 border-transparent bg-surface p-7 text-center shadow-sm transition ${
                  disabled ? "pointer-events-none opacity-50" : "hover:-translate-y-1 hover:scale-[1.02] hover:border-[#c7c7f0] hover:shadow-lg"
                }`}
              >
                <div className={`mb-3.5 flex h-[52px] w-[52px] items-center justify-center rounded-2xl ${card.iconBg}`}>
                  <card.icon size={26} />
                </div>
                <h3 className="mb-1.5 text-[0.95rem] font-bold">{card.title}</h3>
                <p className="mb-4 flex-1 text-[0.8rem] leading-relaxed text-soft">{card.desc}</p>
                {disabled ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#d5d5e8] px-5 py-2 text-sm font-bold text-soft">
                    Butuh 2 kolom numerik
                  </span>
                ) : (
                  <Link
                    href={card.href}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-5 py-2 text-sm font-bold text-white shadow transition hover:-translate-y-px hover:bg-brand-600"
                  >
                    Jalankan <ArrowLeft size={14} className="rotate-180" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {numericCount >= 2 && (
          <div className="mt-6 flex items-start gap-2 rounded-xl border border-[#c7c7e0] bg-brand-50 p-3.5 text-sm text-[#3a3590]">
            <BarChart2 size={18} className="mt-0.5 shrink-0" />
            {numericCount >= 2
              ? "Pilih salah satu analisis di atas. Anda dapat kembali ke halaman ini kapan saja untuk mengubah tipe kolom."
              : ""}
          </div>
        )}
      </div>
    </main>
  );
}
