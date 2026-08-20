# EasyStats

Aplikasi web uji statistik instrumen penelitian — upload atau paste data kuesioner, langsung dapatkan hasil uji beserta narasi siap pakai untuk laporan.

**Live:** easy-stats.vercel.app

## Fitur

| Fitur | Metode | Output |
|-------|--------|--------|
| **Uji Validitas** | Pearson Product Moment / Spearman Rank Order | Koefisien korelasi per item, tabel rekapitulasi, narasi |
| **Uji Reliabilitas** | Cronbach's Alpha | Nilai alpha, interpretasi, tabel variance per item |
| **Regresi Linear Berganda** | OLS (X'X)⁻¹X'Y | Persamaan regresi, ANOVA (Uji F), Uji t parsial |
| **Uji Normalitas** | Shapiro-Wilk / Kolmogorov-Smirnov | Histogram, QQ-Plot, narasi per item |

Semua output dilengkapi:
- Rumus LaTeX (rendered via KaTeX)
- Tombol **Copy LaTeX** → paste langsung ke Word Equation editor
- Narasi berbahasa Indonesia siap pakai

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 |
| Chart | Recharts (histogram & QQ-plot) |
| LaTeX | KaTeX |
| Backend | Python FastAPI (serverless functions) |
| Statistik | **Pure Python stdlib** — zero dependency (tanpa numpy/scipy) |
| Data | localStorage (browser-side persistence) |
| Deploy | Vercel (Next.js + Python serverless) |

## Struktur Proyek

```
app/                    # Halaman Next.js (App Router)
  page.tsx              # Landing: upload / paste / demo
  preview/              # Preview data + pengaturan tipe kolom
  validity/             # Uji validitas (Pearson/Spearman)
  reliability/          # Uji reliabilitas (Cronbach's Alpha)
  regression/           # Regresi linear berganda
  normality/            # Uji normalitas (Shapiro-Wilk/K-S) + histogram + QQ-plot
  tutorial/             # Tutorial copy LaTeX ke Word
components/ui.tsx       # Komponen bersama (FormulaBox, CopyButton, StatCard, dll)
lib/
  api.ts                # POST JSON helper
  api-types.ts          # TypeScript response interfaces
  csv.ts                # CSV parsing + column type detection
  store.ts              # localStorage persistence
  types.ts              # Core types (ColumnType, Dataset)
statlib/stats.py        # Seluruh logika statistik (~900 baris, pure Python)
api/                    # Endpoint Python (FastAPI serverless)
  validity.py
  reliability.py
  regression.py
  normality.py
dev_server.py           # Server gabungan untuk dev lokal
public/demo.csv         # Data demo (51 responden)
AGENTS.md               # Project summary untuk AI agents
```

## Menjalankan secara Lokal

**Backend Python** (terminal 1):

```powershell
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
$env:LOCAL_PROXY=1; .\.venv\Scripts\python.exe dev_server.py
```

**Frontend** (terminal 2):

```powershell
npm install
npm run dev
```

Buka http://localhost:3000.

## Deploy ke Vercel

1. Push ke repo GitHub.
2. Import repo di Vercel — otomatis mendeteksi Next.js + Python Functions.
3. Tidak ada konfigurasi tambahan. Semua endpoint `/api/*` berfungsi otomatis.

## API Endpoints

| Endpoint | Method | Body |
|----------|--------|------|
| `/api/validity` | POST | `{ items, technique, method }` |
| `/api/reliability` | POST | `{ items }` |
| `/api/regression` | POST | `{ y, x, y_name }` |
| `/api/normality` | POST | `{ items, method, alpha }` |

Semua endpoint menerima data dengan `null` untuk missing values — dihapus via listwise deletion.
