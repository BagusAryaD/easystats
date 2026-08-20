"use client";

import katex from "katex";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function LatexDisplay({ tex, className }: { tex: string; className?: string }) {
  let html = tex;
  try {
    const clean = tex.replace(/\\\[/g, "").replace(/\\\]/g, "").trim();
    html = katex.renderToString(clean, { displayMode: true, throwOnError: false });
  } catch {
    /* fallback: tampilkan teks mentah */
  }
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function CopyButton({
  text,
  className,
  children,
}: {
  text: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? "Tersalin!" : "Copy"}
      className={
        "flex h-8 w-8 items-center justify-center rounded-md transition " +
        (copied
          ? "bg-green-600 text-white"
          : "bg-[#f0f0f5] text-[#777] hover:bg-brand-50 hover:text-brand-500 ") +
        (className ?? "")
      }
    >
      {copied ? <Check size={16} /> : (children ?? <Copy size={16} />)}
    </button>
  );
}

export function FormulaBox({
  title,
  tex,
  copyTex,
}: {
  title?: string;
  tex: string;
  copyTex?: string;
}) {
  return (
    <div className="relative my-5 rounded-xl border border-edge bg-surface p-5 pr-14 shadow-sm">
      {title && <div className="mb-2 text-sm font-bold">{title}</div>}
      <LatexDisplay tex={tex} className="overflow-x-auto" />
      {copyTex !== undefined && (
        <CopyButton text={copyTex} className="absolute top-3 right-3" />
      )}
    </div>
  );
}

export function NarrativeBox({ text, copy }: { text: string; copy?: boolean }) {
  return (
    <div className="relative my-3 rounded-lg border border-[#c7c7e8] bg-brand-50 p-3.5 pr-14 text-sm leading-relaxed">
      {text}
      {copy && <CopyButton text={text} className="absolute top-2 right-2" />}
    </div>
  );
}

export function StatCard({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="min-w-[130px] flex-1 rounded-xl border border-transparent bg-surface p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-edge">
      <div className="text-2xl font-extrabold leading-none text-brand-500">{value}</div>
      <div className="mt-1 text-xs text-soft">{label}</div>
    </div>
  );
}

export function Badge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-bold text-white ${
        ok ? "bg-[#1a7a3c]" : "bg-[#c0392b]"
      }`}
    >
      {children}
    </span>
  );
}

export function Alert({
  variant,
  children,
}: {
  variant: "error" | "warning" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    error: "border-[#f0cbc6] bg-[#fdf2f1] text-[#9a3326]",
    warning: "border-[#f5e1a0] bg-[#fffbeb] text-[#7a5d04]",
    info: "border-[#c7c7e8] bg-brand-50 text-[#3a3590]",
  };
  return (
    <div className={`mb-4 rounded-xl border p-3.5 text-sm leading-relaxed ${styles[variant]}`}>
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 mt-8 text-xs font-bold uppercase tracking-widest text-soft">
      {children}
    </div>
  );
}

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-500">
      {children}
    </span>
  );
}
