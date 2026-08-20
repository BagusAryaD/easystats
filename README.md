# GudStat v2

Aplikasi uji statistik instrumen penelitian (validitas, reliabilitas, regresi linear
berganda) dengan narasi siap pakai dan rumus LaTeX yang bisa langsung disalin ke Word.

Migrasi dari GudStat v1 (PHP murni) → **Next.js + Python**:

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS — UI interaktif,
  dataset disimpan di `localStorage` browser (serverless = stateless).
- **Backend statistik:** Python **FastAPI** sebagai serverless functions Vercel
  (`api/*.py`). Semua hitungan di `statlib/stats.py` — **murni Python stdlib,
  tanpa numpy/scipy**, sehingga bundle server kecil dan cold start cepat.
- **LaTeX:** dirender di browser memakai KaTeX; tombol copy menyalin kode LaTeX
  satu baris yang kompatibel dengan Equation Word.

## Struktur

```
app/                  # Halaman Next.js (App Router)
  page.tsx            # Landing: upload / paste / demo
  preview/            # Preview + pengaturan tipe kolom (interaktif)
  validity/           # Uji validitas
  reliability/        # Uji reliabilitas (Cronbach's Alpha)
  regression/         # Uji regresi linear berganda
  tutorial/           # Tutorial copy LaTeX ke Word
components/ui.tsx     # Komponen bersama (KaTeX, tombol copy, kartu, dll)
lib/                  # Parsing CSV, localStorage, API client, tipe
statlib/stats.py      # Seluruh logika statistik (port dari functions.php)
api/                  # Endpoint Python (FastAPI)
  validity.py
  reliability.py
  regression.py
dev_server.py         # Server gabungan untuk dev lokal (tidak dipakai di Vercel)
public/demo.csv       # Data demo
```

## Menjalankan secara lokal

Backend Python:

```powershell
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn dev_server:app --port 8000
```

Frontend (di terminal kedua):

```powershell
$env:LOCAL_PROXY = "1"   # mengaktifkan proxy /api/* ke server Python
npm install
npm run dev
```

Buka http://localhost:3000.

## Deploy ke Vercel

1. Push project ini ke repo GitHub.
2. Di Vercel, import repo tersebut. Vercel otomatis mendeteksi:
   - Next.js (dari `package.json`)
   - Python Functions (dari `api/*.py` + `requirements.txt`)
3. Tidak ada konfigurasi tambahan yang diperlukan. `/api/validity`,
   `/api/reliability`, dan `/api/regression` akan berfungsi otomatis.

## Endpoint API

| Endpoint | Body | Keterangan |
|---|---|---|
| `POST /api/validity` | `{ items: { nama: (number\|null)[] }, technique, method }` | Uji validitas item-total / item-total corrected, Pearson / Spearman. |
| `POST /api/reliability` | `{ items: { nama: (number\|null)[] } }` | Cronbach's Alpha lengkap. |
| `POST /api/regression` | `{ y: (number\|null)[], x: { nama: (number\|null)[] }, y_name }` | Regresi linear berganda. |

Nilai `null` pada array berarti data missing — dihapus via listwise deletion di server.