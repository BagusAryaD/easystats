"""
Dev server lokal untuk menguji ketiga endpoint Python sekaligus.

Jalankan:
    .venv\\Scripts\\python -m uvicorn dev_server:app --port 8000

Di Vercel, setiap file di api/*.py di-deploy sebagai fungsi terpisah,
jadi dev_server.py ini TIDAK dipakai di produksi.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI

from api.validity import app as validity_app
from api.reliability import app as reliability_app
from api.regression import app as regression_app

app = FastAPI(title="GudStat v2 — API Lokal")

app.mount("/api/validity", validity_app)
app.mount("/api/reliability", reliability_app)
app.mount("/api/regression", regression_app)
