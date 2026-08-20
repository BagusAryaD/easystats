import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Dict, List, Optional

from fastapi import FastAPI
from pydantic import BaseModel

from statlib import stats as st

app = FastAPI()


class RegressionRequest(BaseModel):
    y: List[Optional[float]]
    x: Dict[str, List[Optional[float]]]
    y_name: str = "Y"


@app.post("/")
@app.post("/api/regression")
def run_regression(req: RegressionRequest):
    if not req.y or not req.x:
        return {"ok": False, "error": "Variabel Y dan minimal satu variabel X diperlukan."}

    combined = {"__Y__": req.y}
    for name, values in req.x.items():
        combined[name] = values

    clean = st.listwise_delete(combined)

    if "__Y__" not in clean or len(clean) < 2:
        return {"ok": False, "error": "Data tidak cukup setelah listwise deletion."}

    y_values = clean["__Y__"]
    x_items = {k: v for k, v in clean.items() if k != "__Y__"}

    regression = st.linear_regression(x_items, y_values)

    if regression is None:
        return {
            "ok": False,
            "error": (
                "Regresi tidak dapat dihitung. Kemungkinan jumlah responden setelah "
                "listwise deletion terlalu sedikit, atau terjadi multikolinearitas sempurna."
            ),
        }

    f_tabel = st.get_f_table(regression["dfRegression"], regression["dfResidual"])
    t_tabel = st.get_t_table(regression["dfResidual"])

    coefficient_results = {}
    for name in ["_constant"] + regression["xNames"]:
        t_hitung = regression["tValues"].get(name)

        status = "Signifikan" if t_hitung is not None and t_tabel is not None and abs(t_hitung) > t_tabel else "Tidak Signifikan"
        display_name = "Konstanta" if name == "_constant" else name

        coefficient_results[name] = {
            "name": display_name,
            "coef": regression["coefficients"][name],
            "se": regression["standardErrors"].get(name),
            "tHitung": t_hitung,
            "tTabel": t_tabel,
            "status": status,
            "narrative": (
                None
                if name == "_constant"
                else st.regression_coefficient_narrative(
                    display_name,
                    regression["coefficients"][name],
                    t_hitung,
                    t_tabel,
                    status,
                )
            ),
        }

    f_status = "Tidak Signifikan"
    if regression["fHitung"] is not None and f_tabel is not None and regression["fHitung"] > f_tabel:
        f_status = "Signifikan"

    return {
        "ok": True,
        "regression": regression,
        "coefficientResults": coefficient_results,
        "fTabel": f_tabel,
        "fStatus": f_status,
        "narrative": st.regression_narrative(regression, req.y_name),
    }
