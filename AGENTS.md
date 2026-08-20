# AGENTS.md — Project Summary for AI Agents

## Stack
- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + KaTeX + recharts
- **Backend:** Python FastAPI (serverless-ready, 1 endpoint per file in `api/`)
- **Stats:** Pure Python stdlib (no numpy/scipy) — `statlib/stats.py`
- **Data:** localStorage persistence (key: `gudstat_v2_dataset`)

## Routes
| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Landing: upload/paste CSV, visual guide, demo |
| `/preview` | `app/preview/page.tsx` | Data table, column type toggle, choose analysis |
| `/validity` | `app/validity/page.tsx` | Pearson/Spearman correlation per item |
| `/reliability` | `app/reliability/page.tsx` | Cronbach's Alpha |
| `/regression` | `app/regression/page.tsx` | Multiple linear regression (OLS) |
| `/normality` | `app/normality/page.tsx` | Shapiro-Wilk + K-S test with histogram & QQ-plot |
| `/tutorial` | `app/tutorial/page.tsx` | How to copy LaTeX to MS Word |

## API Endpoints
| Endpoint | Request Model | Response |
|----------|--------------|----------|
| `POST /api/validity` | `ValidityRequest` | `ValidityResponse` |
| `POST /api/reliability` | `ReliabilityRequest` | `ReliabilityResponse` |
| `POST /api/regression` | `RegressionRequest` | `RegressionResponse` |
| `POST /api/normality` | `NormalityRequest` | `NormalityResponse` |

## Key Files
- `statlib/stats.py` — All math (pure Python, ~900 lines): Pearson, Spearman, Cronbach's Alpha, Linear Regression, Shapiro-Wilk, K-S test, normal distribution functions, histogram/QQ-plot data builders
- `components/ui.tsx` — Shared UI: CopyButton, FormulaBox, NarrativeBox, StatCard, Badge, Alert, SectionLabel, Pill, LatexDisplay
- `lib/csv.ts` — CSV parsing + column type detection (`detectDelimiter`, `parseDelimited`, `buildNumericColumn`)
- `lib/store.ts` — localStorage persistence (`saveDataset`, `loadDataset`, `clearDataset`; key: `gudstat_v2_dataset`)
- `lib/api.ts` — `postJson<T>(url, body)` helper (POST JSON, returns `{ ok, ...data } | { ok: false, error }`)
- `lib/api-types.ts` — All TypeScript response interfaces
- `lib/types.ts` — Core types: `ColumnType`, `Dataset`

## Conventions
- All narratives in **Indonesian** (Bahasa Indonesia)
- LaTeX: two versions per formula — **display** (KaTeX, with `\[...\]`) + **copy** (one-line, for Word Equation editor)
- `CopyButton` copies raw LaTeX; user pastes into Word Equation editor (`Alt+=` → LaTeX mode → `Ctrl+V` → `Space`)
- API pattern: `{ ok: true, ...data }` or `{ ok: false, error: "..." }`
- All analysis endpoints perform **listwise deletion** (remove rows with any missing value)
- Color scheme: `brand-500=#4338ca` (indigo), `brand-50=#eef0fd`
- UI components from `components/ui.tsx` are reused across all pages

## Data Flow
```
CSV upload/paste → parseDelimited() → saveDataset() → localStorage
                                                         ↓
User selects items → buildNumericColumn() → POST to /api/* → result with narratives + LaTeX
                                                         ↓
Display: StatCards + tables + FormulaBox (KaTeX) + NarrativeBox + CopyButton
```

## Dependencies (npm)
`next`, `react`, `react-dom`, `katex`, `lucide-react`, `papaparse`, `recharts`

## Dependencies (Python)
`fastapi`, `pydantic` (stdlib: `math`, `json`)

## Running Locally
```bash
# Frontend
npm run dev          # Next.js on :3000

# Backend (dev proxy)
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force
$env:LOCAL_PROXY=1; python dev_server.py   # FastAPI on :8000
```

## Deployment
- Vercel: Next.js frontend + Python serverless functions (`api/*.py`)
- Each `api/*.py` becomes a separate serverless function
- `requirements.txt` at root for Python dependencies
