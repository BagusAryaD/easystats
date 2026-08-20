import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Dict, List, Optional

from fastapi import FastAPI
from pydantic import BaseModel

from statlib import stats as st

app = FastAPI()


class ReliabilityRequest(BaseModel):
    items: Dict[str, List[Optional[float]]]


@app.post("/")
@app.post("/api/reliability")
def run_reliability(req: ReliabilityRequest):
    clean = st.listwise_delete(req.items)
    names = list(clean.keys())

    if len(names) < 2 or not clean:
        return {
            "ok": False,
            "error": "Minimal 2 item dibutuhkan setelah listwise deletion.",
        }

    detailed = st.cronbach_alpha_detailed(clean)

    if detailed is None:
        return {"ok": False, "error": "Data tidak cukup untuk menghitung Cronbach's Alpha."}

    interp = st.interpret_cronbach(detailed["alpha"])
    narrative = st.reliability_narrative(detailed["k"], detailed["n"], detailed["alpha"], interp)

    return {
        "ok": True,
        "detailed": detailed,
        "interp": interp,
        "narrative": narrative,
    }
