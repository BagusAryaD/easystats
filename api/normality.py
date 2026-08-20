import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Dict, List, Optional

from fastapi import FastAPI
from pydantic import BaseModel

from statlib import stats as st

app = FastAPI()

VALID_METHODS = ("shapiro_wilk", "ks")


class NormalityRequest(BaseModel):
    items: Dict[str, List[Optional[float]]]
    method: str = "shapiro_wilk"
    alpha: float = 0.05


@app.post("/")
@app.post("/api/normality")
def run_normality(req: NormalityRequest):
    method = req.method if req.method in VALID_METHODS else "shapiro_wilk"
    alpha = req.alpha if 0.01 <= req.alpha <= 0.20 else 0.05

    clean = st.listwise_delete(req.items)
    if not clean:
        return {"ok": False, "error": "Data tidak cukup setelah menghapus missing values."}

    method_label = "Shapiro-Wilk" if method == "shapiro_wilk" else "Kolmogorov-Smirnov"
    stat_name = "W (Shapiro-Wilk)" if method == "shapiro_wilk" else "D (K-S)"

    results = {}
    normal_count = 0
    not_normal_count = 0

    for name, values in clean.items():
        if method == "shapiro_wilk":
            res = st.shapiro_wilk_test(values)
        else:
            res = st.ks_test(values)

        if res is None:
            results[name] = {
                "n": len(values),
                "pValue": None,
                "isNormal": False,
                "error": "Data tidak dapat dihitung (variansi nol atau ukuran sampel tidak cukup).",
            }
            not_normal_count += 1
            continue

        interp = st.interpret_normality(res["pValue"], alpha)

        if method == "shapiro_wilk":
            stat_value = res["W"]
            stat_display = f"W = {res['W']:.4f}"
        else:
            stat_value = res["D"]
            stat_display = f"D = {res['D']:.4f}"

        narrative = st.normality_narrative(
            name, method, stat_name, stat_value,
            res["pValue"], alpha, interp, res["n"]
        )

        if interp["status"] == "Normal":
            normal_count += 1
        else:
            not_normal_count += 1

        # Build visualization data
        histogram = st.build_histogram(values)
        qq_data = st.build_qq_data(values)

        results[name] = {
            **res,
            "statValue": stat_value,
            "statDisplay": stat_display,
            "interp": interp,
            "narrative": narrative,
            "histogram": histogram,
            "qqData": qq_data,
        }

    return {
        "ok": True,
        "method": method,
        "methodLabel": method_label,
        "alpha": alpha,
        "results": results,
        "summary": {
            "totalTested": len(clean),
            "normalCount": normal_count,
            "notNormalCount": not_normal_count,
        },
    }
