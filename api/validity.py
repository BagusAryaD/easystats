import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Dict, List, Optional

from fastapi import FastAPI
from pydantic import BaseModel

from statlib import stats as st

app = FastAPI()

VALID_TECHNIQUES = ("item_total", "item_total_corrected")
VALID_METHODS = ("pearson", "spearman")


class ValidityRequest(BaseModel):
    items: Dict[str, List[Optional[float]]]
    technique: str = "item_total"
    method: str = "pearson"


@app.post("/")
@app.post("/api/validity")
def run_validity(req: ValidityRequest):
    technique = req.technique if req.technique in VALID_TECHNIQUES else "item_total"
    method = req.method if req.method in VALID_METHODS else "pearson"

    method_label = "Spearman Rank Order" if method == "spearman" else "Pearson Product Moment"
    technique_label = "item-total corrected" if technique == "item_total_corrected" else "item-total"

    clean = st.listwise_delete(req.items)
    names = list(clean.keys())

    if len(names) < 2 or not clean:
        return {
            "ok": False,
            "error": "Minimal 2 item dibutuhkan setelah listwise deletion.",
        }

    n = len(clean[names[0]])
    df = n - 2
    r_tabel = st.get_r_table(df)
    total_scores = st.build_total_score(clean)

    item_results = {}
    valid_count = 0
    invalid_count = 0

    for name, values in clean.items():
        total_for_item = (
            st.build_total_score_excluding(clean, name)
            if technique == "item_total_corrected"
            else total_scores
        )

        if method == "spearman":
            comp = st.spearman_components(values, total_for_item)
            r_hitung = st.spearman_from_components(comp)
            latex_sub = st.substitution_spearman_latex(comp, r_hitung) if r_hitung is not None else None
            latex_copy = st.substitution_spearman_latex_copy(comp, r_hitung) if r_hitung is not None else None
        else:
            comp = st.pearson_components(values, total_for_item)
            r_hitung = st.pearson_from_components(comp)
            latex_sub = st.substitution_latex(comp, r_hitung) if r_hitung is not None else None
            latex_copy = st.substitution_latex_copy(comp, r_hitung) if r_hitung is not None else None

        is_negative = r_hitung is not None and r_hitung < 0

        if r_hitung is None or r_tabel is None or is_negative:
            status = "Tidak Valid"
        elif r_hitung > r_tabel:
            status = "Valid"
        else:
            status = "Tidak Valid"

        if status == "Valid":
            valid_count += 1
        else:
            invalid_count += 1

        if r_hitung is not None and r_tabel is not None:
            narrative = st.validity_narrative(name, r_hitung, r_tabel, status, method_label, technique_label)
        else:
            narrative = (
                f"Butir {name} tidak dapat dihitung karena variansi data nol "
                "atau ukuran sampel di luar jangkauan tabel r."
            )

        item_results[name] = {
            "components": comp,
            "rHitung": r_hitung,
            "rTabel": r_tabel,
            "status": status,
            "isNegative": is_negative,
            "narrative": narrative,
            "latexSub": latex_sub,
            "latexSubCopy": latex_copy,
        }

    return {
        "ok": True,
        "itemResults": item_results,
        "totalTested": len(clean),
        "validCount": valid_count,
        "invalidCount": invalid_count,
        "df": df,
        "rTabel": r_tabel,
        "method": method,
        "methodLabel": method_label,
        "technique": technique,
        "techniqueLabel": technique_label,
    }
