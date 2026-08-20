# -*- coding: utf-8 -*-
"""
statlib.stats — Port dari functions.php (GudStat v1) ke Python murni.
Zero-dependency: hanya stdlib, sehingga bundle serverless Vercel tetap kecil.
"""

import math

# ============================================================
# STATISTIK DASAR
# ============================================================

def mean(data):
    if not data:
        return None
    return sum(data) / len(data)


def median(data):
    if not data:
        return None
    d = sorted(data)
    n = len(d)
    if n % 2 == 0:
        return (d[n // 2 - 1] + d[n // 2]) / 2
    return d[n // 2]


def minimum(data):
    return min(data) if data else None


def maximum(data):
    return max(data) if data else None


def sd(data):
    if len(data) <= 1:
        return None
    m = mean(data)
    return math.sqrt(sum((x - m) ** 2 for x in data) / (len(data) - 1))


def is_numeric(value):
    try:
        float(value)
        return True
    except (TypeError, ValueError):
        return False


def count_missing(data):
    return sum(1 for v in data if v is None or v == "")


# ============================================================
# DETEKSI TIPE & PEMBERSIHAN DATA
# ============================================================

def detect_type(values):
    for v in values:
        if v is None or v == "":
            continue
        if not is_numeric(v):
            return "categorical"
    return "numeric"


def clean_numeric(data):
    return [float(x) for x in data if x is not None and x != "" and is_numeric(x)]


def listwise_delete(items):
    """
    Hapus baris (indeks) yang memiliki nilai kosong / non-numerik
    pada salah satu item. Mengembalikan dict item -> list float.
    """
    names = list(items.keys())
    if not names:
        return {}
    n = len(items[names[0]])
    clean = {name: [] for name in names}

    for i in range(n):
        valid = True
        for name in names:
            v = items[name][i] if i < len(items[name]) else None
            if v is None or v == "" or not is_numeric(v):
                valid = False
                break
        if valid:
            for name in names:
                clean[name].append(float(items[name][i]))

    return clean


# ============================================================
# SKOR TOTAL
# ============================================================

def build_total_score(items):
    names = list(items.keys())
    n = len(items[names[0]])
    return [sum(items[name][i] for name in names) for i in range(n)]


def build_total_score_excluding(items, exclude_item):
    names = [k for k in items if k != exclude_item]
    n = len(items[names[0]])
    return [sum(items[name][i] for name in names) for i in range(n)]


# ============================================================
# PEARSON
# ============================================================

def pearson_components(x, y):
    n = len(x)
    sum_x = sum(x)
    sum_y = sum(y)
    sum_xy = sum(x[i] * y[i] for i in range(n))
    sum_x2 = sum(x[i] ** 2 for i in range(n))
    sum_y2 = sum(y[i] ** 2 for i in range(n))
    return {
        "n": n, "sumX": sum_x, "sumY": sum_y,
        "sumXY": sum_xy, "sumX2": sum_x2, "sumY2": sum_y2,
    }


def pearson_from_components(c):
    numerator = (c["n"] * c["sumXY"]) - (c["sumX"] * c["sumY"])
    denominator = math.sqrt(
        ((c["n"] * c["sumX2"]) - c["sumX"] ** 2)
        * ((c["n"] * c["sumY2"]) - c["sumY"] ** 2)
    )
    if denominator == 0:
        return None
    return numerator / denominator


# ============================================================
# SPEARMAN
# ============================================================

def rank_data(values):
    indexed = sorted(enumerate(values), key=lambda t: t[1])
    ranks = [0] * len(values)
    i = 0
    while i < len(indexed):
        j = i
        while j + 1 < len(indexed) and indexed[j + 1][1] == indexed[i][1]:
            j += 1
        avg_rank = (i + j + 2) / 2
        for k in range(i, j + 1):
            ranks[indexed[k][0]] = avg_rank
        i = j + 1
    return ranks


def spearman_components(x, y):
    rx = rank_data(x)
    ry = rank_data(y)
    sum_d2 = sum((rx[i] - ry[i]) ** 2 for i in range(len(x)))
    return {"n": len(x), "sumD2": sum_d2, "rankX": rx, "rankY": ry}


def spearman_from_components(c):
    if c["n"] < 2:
        return None
    return 1 - (6 * c["sumD2"]) / (c["n"] * (c["n"] ** 2 - 1))


# ============================================================
# TABEL STATISTIK
# ============================================================

R_TABLE = {
    1: 0.997, 2: 0.950, 3: 0.878, 4: 0.811, 5: 0.754, 6: 0.707, 7: 0.666,
    8: 0.632, 9: 0.602, 10: 0.576, 11: 0.553, 12: 0.532, 13: 0.514,
    14: 0.497, 15: 0.482, 16: 0.468, 17: 0.456, 18: 0.444, 19: 0.433,
    20: 0.423, 21: 0.413, 22: 0.404, 23: 0.396, 24: 0.388, 25: 0.381,
    26: 0.374, 27: 0.367, 28: 0.361, 29: 0.355, 30: 0.349, 31: 0.344,
    32: 0.339, 33: 0.334, 34: 0.329, 35: 0.325, 36: 0.320, 37: 0.316,
    38: 0.312, 39: 0.308, 40: 0.304, 45: 0.288, 50: 0.273, 60: 0.250,
    80: 0.220, 100: 0.195, 120: 0.179, 200: 0.138,
}


def get_r_table(df):
    if df in R_TABLE:
        return R_TABLE[df]
    for key in sorted(R_TABLE.keys(), reverse=True):
        if df >= key:
            return R_TABLE[key]
    return None


T_TABLE = {
    1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
    6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
    11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131,
    16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086,
    21: 2.080, 22: 2.074, 23: 2.069, 24: 2.064, 25: 2.060,
    26: 2.056, 27: 2.052, 28: 2.048, 29: 2.045, 30: 2.042,
    40: 2.021, 60: 2.000, 80: 1.990, 100: 1.984, 120: 1.980,
}


def get_t_table(df):
    if df in T_TABLE:
        return T_TABLE[df]
    for key in sorted(T_TABLE.keys(), reverse=True):
        if df >= key:
            return T_TABLE[key]
    return None


F_TABLE = {
    1: {1: 161.4, 2: 18.51, 3: 10.13, 4: 7.71, 5: 6.61, 6: 5.99, 7: 5.59,
        8: 5.32, 9: 5.12, 10: 4.96, 12: 4.75, 15: 4.54, 20: 4.35, 24: 4.26,
        30: 4.17, 40: 4.08, 60: 4.00, 120: 3.92},
    2: {1: 199.5, 2: 19.00, 3: 9.55, 4: 6.94, 5: 5.79, 6: 5.14, 7: 4.74,
        8: 4.46, 9: 4.26, 10: 4.10, 12: 3.89, 15: 3.68, 20: 3.49, 24: 3.40,
        30: 3.32, 40: 3.23, 60: 3.15, 120: 3.07},
    3: {1: 215.7, 2: 19.16, 3: 9.28, 4: 6.59, 5: 5.41, 6: 4.76, 7: 4.35,
        8: 4.07, 9: 3.86, 10: 3.71, 12: 3.49, 15: 3.29, 20: 3.10, 24: 3.01,
        30: 2.92, 40: 2.84, 60: 2.76, 120: 2.68},
    4: {1: 224.6, 2: 19.25, 3: 9.12, 4: 6.39, 5: 5.19, 6: 4.53, 7: 4.12,
        8: 3.84, 9: 3.63, 10: 3.48, 12: 3.26, 15: 3.06, 20: 2.87, 24: 2.78,
        30: 2.69, 40: 2.61, 60: 2.53, 120: 2.45},
    5: {1: 230.2, 2: 19.30, 3: 9.01, 4: 6.26, 5: 5.05, 6: 4.39, 7: 3.97,
        8: 3.69, 9: 3.48, 10: 3.33, 12: 3.11, 15: 2.90, 20: 2.71, 24: 2.62,
        30: 2.53, 40: 2.45, 60: 2.37, 120: 2.29},
}


def get_f_table(df1, df2):
    if df1 not in F_TABLE:
        return None
    row = F_TABLE[df1]
    if df2 in row:
        return row[df2]
    for key in sorted(row.keys(), reverse=True):
        if df2 >= key:
            return row[key]
    return None


# ============================================================
# RELIABILITAS — CRONBACH'S ALPHA
# ============================================================

def cronbach_alpha_detailed(items):
    names = list(items.keys())
    k = len(names)
    if k < 2:
        return None
    n = len(items[names[0]])

    item_detail = {}
    sum_item_variances = 0.0

    for name in names:
        vals = items[name]
        m = sum(vals) / len(vals)
        sum_dev = sum((v - m) ** 2 for v in vals)
        variance = sum_dev / (n - 1)
        sum_item_variances += variance
        item_detail[name] = {"mean": m, "variance": variance, "sum": sum(vals)}

    total_scores = [sum(items[name][i] for name in names) for i in range(n)]
    mean_total = sum(total_scores) / n
    total_variance = sum((t - mean_total) ** 2 for t in total_scores) / (n - 1)

    alpha = (k / (k - 1)) * (1 - (sum_item_variances / total_variance))

    return {
        "k": k, "n": n, "alpha": alpha,
        "sumItemVariances": sum_item_variances, "totalVariance": total_variance,
        "itemDetail": item_detail, "totalScores": total_scores,
    }


def interpret_cronbach(alpha):
    if alpha >= 0.9:
        return {"level": "Sangat Tinggi", "css": "interp-excellent"}
    if alpha >= 0.8:
        return {"level": "Tinggi", "css": "interp-good"}
    if alpha >= 0.7:
        return {"level": "Cukup", "css": "interp-acceptable"}
    if alpha >= 0.6:
        return {"level": "Rendah", "css": "interp-poor"}
    return {"level": "Tidak Reliabel", "css": "interp-bad"}


# ============================================================
# ALJABAR MATRIKS — fondasi regresi linear berganda
# ============================================================

def matrix_multiply(a, b):
    rows_a = len(a)
    cols_a = len(a[0])
    cols_b = len(b[0])
    result = [[0.0] * cols_b for _ in range(rows_a)]
    for i in range(rows_a):
        for j in range(cols_b):
            result[i][j] = sum(a[i][k] * b[k][j] for k in range(cols_a))
    return result


def matrix_transpose(m):
    rows = len(m)
    cols = len(m[0])
    return [[m[i][j] for i in range(rows)] for j in range(cols)]


def matrix_inverse(matrix):
    """Invers matriks persegi via eliminasi Gauss-Jordan. None jika singular."""
    n = len(matrix)
    aug = [
        [float(matrix[i][j]) for j in range(n)]
        + [1.0 if i == j else 0.0 for j in range(n)]
        for i in range(n)
    ]

    for col in range(n):
        max_row = col
        max_val = abs(aug[col][col])
        for row in range(col + 1, n):
            if abs(aug[row][col]) > max_val:
                max_val = abs(aug[row][col])
                max_row = row

        if max_val < 1e-10:
            return None

        if max_row != col:
            aug[col], aug[max_row] = aug[max_row], aug[col]

        pivot = aug[col][col]
        for j in range(2 * n):
            aug[col][j] /= pivot

        for row in range(n):
            if row == col:
                continue
            factor = aug[row][col]
            for j in range(2 * n):
                aug[row][j] -= factor * aug[col][j]

    return [aug[i][n:] for i in range(n)]


# ============================================================
# REGRESI LINEAR BERGANDA
# ============================================================

def linear_regression(x_items, y_values):
    """
    Regresi: Y = b0 + b1.X1 + ... + bk.Xk via (X'X)^-1 X'Y.
    x_items: dict nama X -> list nilai (sudah selaras & bebas missing).
    y_values: list nilai Y (selaras dengan x_items).
    """
    n = len(y_values)
    k = len(x_items)
    if n <= k + 1:
        return None

    x_names = list(x_items.keys())

    design_x = [[1.0] + [float(x_items[name][i]) for name in x_names] for i in range(n)]
    mat_y = [[float(v)] for v in y_values]

    x_t = matrix_transpose(design_x)
    x_tx = matrix_multiply(x_t, design_x)
    x_tx_inv = matrix_inverse(x_tx)
    if x_tx_inv is None:
        return None

    x_ty = matrix_multiply(x_t, mat_y)
    beta = matrix_multiply(x_tx_inv, x_ty)

    coefficients = {"_constant": beta[0][0]}
    for idx, name in enumerate(x_names):
        coefficients[name] = beta[idx + 1][0]

    y_hat = []
    residual = []
    for i in range(n):
        pred = coefficients["_constant"]
        for name in x_names:
            pred += coefficients[name] * x_items[name][i]
        y_hat.append(pred)
        residual.append(y_values[i] - pred)

    mean_y = sum(y_values) / n
    ss_total = sum((y - mean_y) ** 2 for y in y_values)
    ss_residual = sum(r ** 2 for r in residual)
    ss_regression = ss_total - ss_residual

    r_squared = None if ss_total == 0 else (ss_regression / ss_total)

    df_regression = k
    df_residual = n - k - 1
    df_total = n - 1

    adjusted_r = None
    if r_squared is not None and df_residual > 0:
        adjusted_r = 1 - (1 - r_squared) * (df_total / df_residual)

    ms_regression = (ss_regression / df_regression) if df_regression > 0 else None
    ms_residual = (ss_residual / df_residual) if df_residual > 0 else None

    f_hitung = None
    if ms_regression is not None and ms_residual is not None and ms_residual > 0:
        f_hitung = ms_regression / ms_residual

    standard_errors = {}
    t_values = {}
    if ms_residual is not None:
        se_const = math.sqrt(ms_residual * x_tx_inv[0][0])
        standard_errors["_constant"] = se_const
        t_values["_constant"] = coefficients["_constant"] / se_const if se_const != 0 else None
        for idx, name in enumerate(x_names):
            se = math.sqrt(ms_residual * x_tx_inv[idx + 1][idx + 1])
            standard_errors[name] = se
            t_values[name] = coefficients[name] / se if se != 0 else None

    return {
        "n": n, "k": k, "xNames": x_names,
        "coefficients": coefficients,
        "standardErrors": standard_errors,
        "tValues": t_values,
        "dfRegression": df_regression,
        "dfResidual": df_residual,
        "dfTotal": df_total,
        "ssRegression": ss_regression,
        "ssResidual": ss_residual,
        "ssTotal": ss_total,
        "msRegression": ms_regression,
        "msResidual": ms_residual,
        "rSquared": r_squared,
        "adjustedRSquared": adjusted_r,
        "fHitung": f_hitung,
        "yHat": y_hat,
        "residual": residual,
        "meanY": mean_y,
    }


# ============================================================
# NARASI BAHASA INDONESIA
# ============================================================

def validity_narrative(item, r_hitung, r_tabel, status, method_label, technique_label):
    return (
        "Berdasarkan hasil uji validitas "
        + method_label
        + " dengan teknik "
        + technique_label
        + ", butir "
        + item
        + " memiliki nilai koefisien sebesar "
        + f"{r_hitung:.4f}"
        + " dan nilai r_tabel sebesar "
        + f"{r_tabel:.4f}"
        + ". Karena nilai koefisien "
        + ("lebih besar" if status == "Valid" else "tidak lebih besar")
        + " daripada r_tabel, maka butir "
        + item
        + " dinyatakan "
        + status
        + "."
    )


def reliability_narrative(k, n, alpha, interp):
    reliable = alpha >= 0.6
    return (
        "Berdasarkan hasil uji reliabilitas menggunakan metode Cronbach's Alpha, "
        f"instrumen yang terdiri dari {k} item dengan {n} responden "
        "memperoleh nilai koefisien alpha sebesar "
        + f"{alpha:.4f}"
        + ". Nilai tersebut menunjukkan tingkat reliabilitas yang "
        + interp["level"]
        + ". Dengan demikian, instrumen dinyatakan "
        + ("reliabel" if reliable else "tidak reliabel")
        + " dan dapat "
        + ("" if reliable else "tidak ")
        + "digunakan dalam penelitian."
    )


def regression_narrative(result, y_name):
    x_names = result["xNames"]

    equation = f"Y = {result['coefficients']['_constant']:.4f}"
    for name in x_names:
        coef = result["coefficients"][name]
        sign = " + " if coef >= 0 else " - "
        equation += sign + f"{abs(coef):.4f}" + f"({name})"

    r_sq = round(result["rSquared"], 4) if result["rSquared"] is not None else None
    r_sq_percent = round(r_sq * 100, 2) if r_sq is not None else None

    narrative = (
        "Berdasarkan hasil analisis regresi linear berganda, diperoleh persamaan regresi: "
        + f"{equation}, dengan {y_name} sebagai variabel dependen dan "
        + f"{len(x_names)} variabel independen ({', '.join(x_names)}). "
    )

    if r_sq is not None:
        narrative += (
            f"Nilai R\u00B2 (koefisien determinasi) sebesar {r_sq} menunjukkan bahwa "
            f"{r_sq_percent}% variasi pada {y_name} dapat dijelaskan oleh variabel independen "
            "dalam model ini, sedangkan sisanya dijelaskan oleh faktor lain di luar model. "
        )

    if result["fHitung"] is not None:
        narrative += (
            "Hasil uji F menunjukkan nilai F_hitung sebesar "
            + f"{result['fHitung']:.4f}"
            + f" dengan df1 = {result['dfRegression']} dan df2 = {result['dfResidual']}, "
            "yang digunakan untuk menguji signifikansi model regresi secara simultan."
        )

    return narrative


def regression_coefficient_narrative(var_name, coef, t_hitung, t_tabel, status):
    if t_hitung is None or t_tabel is None:
        return (
            f"Signifikansi koefisien variabel {var_name} tidak dapat ditentukan "
            "(t_hitung atau t_tabel tidak tersedia)."
        )

    arah = "positif" if coef >= 0 else "negatif"
    perbandingan = "lebih besar" if status == "Signifikan" else "tidak lebih besar"
    kesimpulan = "signifikan" if status == "Signifikan" else "tidak signifikan"

    return (
        f"Variabel {var_name} memiliki koefisien regresi sebesar "
        + f"{coef:.4f}"
        + f" (berpengaruh {arah}), dengan t_hitung sebesar "
        + f"{t_hitung:.4f}"
        + f" dan t_tabel sebesar "
        + f"{t_tabel:.4f}"
        + f". Karena |t_hitung| {perbandingan} daripada t_tabel, maka variabel {var_name} "
        + f"dinyatakan berpengaruh secara {kesimpulan} terhadap variabel dependen."
    )


# ============================================================
# LaTeX — versi display (rendered) & versi satu baris (copy ke Word)
# ============================================================

def general_pearson_latex():
    return "\\[\nr_{xy}\n=\n\\frac{\nn\\sum xy-(\\sum x)(\\sum y)\n}{\\sqrt{\n[n\\sum x^2-(\\sum x)^2]\n[n\\sum y^2-(\\sum y)^2]\n}\n}\n\\]"


def general_pearson_latex_copy():
    return "r_{xy}=\\frac{n\\sum xy-(\\sum x)(\\sum y)}{\\sqrt{[n\\sum x^2-(\\sum x)^2][n\\sum y^2-(\\sum y)^2]}}"


def substitution_latex(c, r):
    return (
        "\\[\nr_{xy}\n=\n\\frac{\n(" + f"{c['n']}" + ")(" + f"{c['sumXY']}" + ")\n-\n("
        + f"{c['sumX']}" + ")(" + f"{c['sumY']}" + ")\n}{\\sqrt{\n[("
        + f"{c['n']}" + ")(" + f"{c['sumX2']}" + ")\n-\n("
        + f"{c['sumX']}" + ")^2]\n[(" + f"{c['n']}" + ")(" + f"{c['sumY2']}"
        + ")\n-\n(" + f"{c['sumY']}" + ")^2]\n}\n}\n=\n" + f"{r:.4f}" + "\n\\]"
    )


def substitution_latex_copy(c, r):
    return (
        "r_{xy}=\\frac{(" + f"{c['n']}" + ")(" + f"{c['sumXY']}"
        + ")-(" + f"{c['sumX']}" + ")(" + f"{c['sumY']}"
        + ")}{\\sqrt{[(" + f"{c['n']}" + ")(" + f"{c['sumX2']}"
        + ")-(" + f"{c['sumX']}" + ")^2][(" + f"{c['n']}" + ")(" + f"{c['sumY2']}"
        + ")-(" + f"{c['sumY']}" + ")^2]}}=" + f"{r:.4f}"
    )


def general_spearman_latex():
    return "\\[\n\\rho\n=\n1\n-\n\\frac{\n6\\sum d^2\n}{\nn(n^2-1)\n}\n\\]"


def general_spearman_latex_copy():
    return "\\rho=1-\\frac{6\\sum d^2}{n(n^2-1)}"


def substitution_spearman_latex(c, rho):
    return (
        "\\[\n\\rho\n=\n1\n-\n\\frac{\n6(" + f"{c['sumD2']:.4f}" + ")\n}{"
        + f"{c['n']}" + "(" + f"{c['n']}" + "^2-1)\n}\n=\n"
        + f"{rho:.4f}" + "\n\\]"
    )


def substitution_spearman_latex_copy(c, rho):
    return (
        "\\rho=1-\\frac{6(" + f"{c['sumD2']:.4f}"
        + ")}{" + f"{c['n']}" + "(" + f"{c['n']}" + "^2-1)}=" + f"{rho:.4f}"
    )


def general_regression_latex(k):
    terms = "b_1X_1"
    for i in range(2, k + 1):
        terms += f" + b_{i}X_{i}"
    if k == 0:
        terms = ""
    body = "\\hat{Y} = b_0" + (f" + {terms}" if k > 0 else "")
    return "\\[\n" + body + "\n\\]"


def regression_substitution_latex(result):
    latex = "\\hat{Y} = " + f"{result['coefficients']['_constant']:.4f}"
    for name in result["xNames"]:
        coef = result["coefficients"][name]
        sign = " + " if coef >= 0 else " - "
        latex += sign + f"{abs(coef):.4f}" + f" \\cdot \\text{{{name}}}"
    return "\\[\n" + latex + "\n\\]"


def regression_substitution_latex_copy(result):
    latex = "\\hat{Y}=" + f"{result['coefficients']['_constant']:.4f}"
    for name in result["xNames"]:
        coef = result["coefficients"][name]
        sign = "+" if coef >= 0 else "-"
        latex += sign + f"{abs(coef):.4f}" + f"\\cdot\\text{{{name}}}"
    return latex


# ============================================================
# DISTRIBUSI NORMAL — pendukung uji normalitas
# ============================================================

def normal_cdf(x):
    """CDF normal menggunakan error function (Abramowitz & Stegun 26.2.17)."""
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


def normal_ppf(p):
    """Inverse CDF normal — rational approximation (Abramowitz & Stegun 26.2.23)."""
    if p <= 0.0:
        return -10.0
    if p >= 1.0:
        return 10.0
    if abs(p - 0.5) < 1e-15:
        return 0.0

    if p < 0.5:
        return -_rational_approx(math.sqrt(-2.0 * math.log(p)))
    else:
        return _rational_approx(math.sqrt(-2.0 * math.log(1.0 - p)))


def _rational_approx(t):
    """Helper for normal_ppf ( Abramowitz & Stegun 26.2.23 )."""
    c0, c1, c2 = 2.515517, 0.802853, 0.010328
    d1, d2, d3 = 1.432788, 0.189269, 0.001308
    return t - (c0 + c1 * t + c2 * t * t) / (1.0 + d1 * t + d2 * t * t + d3 * t * t * t)


# ============================================================
# UJI NORMALITAS — SHAPIRO-WILK
# ============================================================

# Koefisien a_i untuk Shapiro-Wilk (n=3..11 dari tabel Royston)
# Untuk n > 11, menggunakan pendekatan Looney & Gulledge
_SW_COEF = {
    3:  [0.7071],
    4:  [0.6872, 0.1677],
    5:  [0.6646, 0.2806],
    6:  [0.6431, 0.2413, 0.0875],
    7:  [0.6233, 0.2604, 0.1334],
    8:  [0.6052, 0.2712, 0.1678, 0.0316],
    9:  [0.5888, 0.2784, 0.1899, 0.0675],
    10: [0.5739, 0.2838, 0.2058, 0.0948, 0.0124],
    11: [0.5604, 0.2880, 0.2182, 0.1148, 0.0331],
}


def _shapiro_wilk_a(n):
    """Koefisien a_i untuk Shapiro-Wilk test."""
    if n <= 11 and n in _SW_COEF:
        return _SW_COEF[n]
    # Pendekatan untuk n > 11: approx dari Royston (1992)
    # Menggunakan normal order statistics
    a = []
    for i in range(n // 2):
        m = normal_ppf((i + 1 - 0.375) / (n + 0.25))
        a.append(m)
    # Normalize
    s_sq = sum(m * m for m in a)
    if s_sq == 0:
        return [1.0 / math.sqrt(n)] * (n // 2)
    return [m / math.sqrt(s_sq) for m in a]


def shapiro_wilk_test(data):
    """
    Shapiro-Wilk test for normality.
    Returns dict: { n, W, pValue, mean, sd, isNormal } atau None.
    """
    n = len(data)
    if n < 3 or n > 5000:
        return None

    sorted_data = sorted(data)
    x_bar = sum(sorted_data) / n
    ss = sum((x - x_bar) ** 2 for x in sorted_data)

    if ss == 0:
        return None

    a = _shapiro_wilk_a(n)
    half = n // 2

    # Numerator: (sum_{i=1}^{half} a_i * x_{(i)})^2
    # Untuk n ganjil, item tengah tidak termasuk
    m_sum = sum(a[i] * sorted_data[i] for i in range(half))
    if n % 2 == 1:
        m_sum += a[half - 1] * sorted_data[half]

    W = (2.0 * m_sum * m_sum) / ss if ss > 0 else 0.0
    W = min(W, 1.0)

    # p-value: pendekatan Royston (1992) menggunakan transformasi log-normal
    # mu dan sigma diestimasi dari n
    log_n = math.log(n)
    mu = -1.2725 + 1.0521 * log_n
    sigma = 1.0308 - 0.26758 * log_n

    if W >= 1.0:
        p_value = 1.0
    elif W <= 0.0:
        p_value = 0.0
    else:
        # Transformasi: z = (log(1-W) - mu) / sigma
        z = (math.log(1.0 - W) - mu) / sigma
        p_value = 1.0 - normal_cdf(z)

    p_value = max(0.0, min(1.0, p_value))

    return {
        "n": n,
        "W": round(W, 4),
        "pValue": round(p_value, 4),
        "mean": round(x_bar, 4),
        "sd": round(math.sqrt(ss / (n - 1)), 4) if n > 1 else 0.0,
        "isNormal": p_value > 0.05,
    }


# ============================================================
# UJI NORMALITAS — KOLMOGOROV-SMIRNOV (Klasik)
# ============================================================

def ks_test(data):
    """
    Kolmogorov-Smirnov test for normality (classic).
    Returns dict: { n, D, dPlus, dMinus, pValue, mean, sd, isNormal } atau None.
    """
    n = len(data)
    if n < 5:
        return None

    sorted_data = sorted(data)
    x_bar = sum(sorted_data) / n
    ss = sum((x - x_bar) ** 2 for x in sorted_data)
    sd_val = math.sqrt(ss / (n - 1)) if n > 1 else 0.0

    if sd_val == 0:
        return None

    d_plus_max = 0.0
    d_minus_max = 0.0

    for i, x in enumerate(sorted_data):
        f_emp_upper = (i + 1) / n
        f_emp_lower = i / n
        z = (x - x_bar) / sd_val
        f_theo = normal_cdf(z)

        d_plus = f_emp_upper - f_theo
        d_minus = f_theo - f_emp_lower

        if d_plus > d_plus_max:
            d_plus_max = d_plus
        if d_minus > d_minus_max:
            d_minus_max = d_minus

    D = max(d_plus_max, d_minus_max)

    # p-value: asymptotic distribution approximation
    # P(D > d) ≈ 2 * sum_{k=1}^{∞} (-1)^{k+1} exp(-2 k^2 λ^2)
    # di mana λ = (sqrt(n) + 0.12 + 0.11/sqrt(n)) * D
    lam = (math.sqrt(n) + 0.12 + 0.11 / math.sqrt(n)) * D
    p_value = _ks_p_value(lam)

    return {
        "n": n,
        "D": round(D, 4),
        "dPlus": round(d_plus_max, 4),
        "dMinus": round(d_minus_max, 4),
        "pValue": round(p_value, 4),
        "mean": round(x_bar, 4),
        "sd": round(sd_val, 4),
        "isNormal": p_value > 0.05,
    }


def _ks_p_value(lam):
    """p-value for K-S statistic using asymptotic expansion."""
    if lam <= 0.0:
        return 1.0
    if lam > 4.0:
        return 0.0
    # Series expansion: P = 2 * Σ (-1)^{k+1} exp(-2 k^2 λ^2)
    p = 0.0
    for k in range(1, 100):
        term = ((-1) ** (k + 1)) * math.exp(-2.0 * k * k * lam * lam)
        p += term
        if abs(term) < 1e-10:
            break
    return max(0.0, min(1.0, 2.0 * p))


# ============================================================
# UJI NORMALITAS — INTERPRETASI & NARASI
# ============================================================

def interpret_normality(p_value, alpha=0.05):
    """Interpretasi hasil uji normalitas."""
    if p_value > alpha:
        return {"level": "Normal", "css": "interp-good", "status": "Normal"}
    elif p_value > 0.01:
        return {"level": "Tidak Normal (signifikan)", "css": "interp-poor", "status": "Tidak Normal"}
    else:
        return {"level": "Tidak Normal (sangat signifikan)", "css": "interp-bad", "status": "Tidak Normal"}


def normality_narrative(item, method, statistic_name, statistic, p_value, alpha, interp, n):
    """Narasi hasil uji normalitas dalam Bahasa Indonesia."""
    method_label = "Shapiro-Wilk" if method == "shapiro_wilk" else "Kolmogorov-Smirnov"
    perbandingan = "lebih besar" if p_value > alpha else "lebih kecil atau sama dengan"
    kesimpulan = "berdistribusi normal" if p_value > alpha else "tidak berdistribusi normal"

    return (
        f"Berdasarkan hasil uji normalitas menggunakan metode {method_label} "
        f"terhadap variabel {item} dengan {n} responden, diperoleh nilai "
        f"{statistic_name} sebesar {statistic:.4f} dengan nilai p sebesar {p_value:.4f}. "
        f"Karena nilai p {perbandingan} daripada α = {alpha:.2f}, maka data "
        f"variabel {item} dinyatakan {kesimpulan}."
    )


def normality_latex_shapiro(W):
    """LaTeX rumus Shapiro-Wilk (substitusi)."""
    return f"W={W:.4f}"


def normality_latex_ks(D):
    """LaTeX rumus K-S (substitusi)."""
    return f"D={D:.4f}"


# ============================================================
# DATA VISUALISASI — histogram & QQ-plot
# ============================================================

def build_histogram(data, num_bins=None):
    """Bangun data histogram untuk visualisasi.
    Returns: { bins: [{bin_start, bin_end, count, normalY}], ... }
    """
    n = len(data)
    if n < 2:
        return []

    sorted_data = sorted(data)
    data_min = sorted_data[0]
    data_max = sorted_data[-1]

    if num_bins is None:
        num_bins = max(5, min(20, int(math.sqrt(n))))

    if data_min == data_max:
        return [{"bin_start": data_min - 0.5, "bin_end": data_max + 0.5, "count": n, "normalY": n}]

    bin_width = (data_max - data_min) / num_bins
    if bin_width == 0:
        bin_width = 1.0

    x_bar = sum(data) / n
    sd_val = math.sqrt(sum((x - x_bar) ** 2 for x in data) / (n - 1)) if n > 1 else 1.0

    bins = []
    for i in range(num_bins):
        lo = data_min + i * bin_width
        hi = lo + bin_width if i < num_bins - 1 else data_max + 0.001

        count = sum(1 for x in data if lo <= x < hi) if i < num_bins - 1 else sum(1 for x in data if lo <= x)

        # Normal curve value at midpoint
        mid = (lo + hi) / 2
        if sd_val > 0:
            z = (mid - x_bar) / sd_val
            normal_y = n * bin_width * (math.exp(-0.5 * z * z) / (sd_val * math.sqrt(2 * math.pi)))
        else:
            normal_y = 0

        bins.append({
            "binLabel": f"{lo:.2f}-{hi:.2f}",
            "binMid": round(mid, 4),
            "count": count,
            "normalY": round(normal_y, 2),
        })

    return bins


def build_qq_data(data):
    """Bangun data QQ-plot.
    Returns: [{ theoretical, sample }, ...]
    """
    n = len(data)
    if n < 2:
        return []

    sorted_data = sorted(data)
    x_bar = sum(sorted_data) / n
    sd_val = math.sqrt(sum((x - x_bar) ** 2 for x in sorted_data) / (n - 1)) if n > 1 else 1.0

    qq = []
    for i in range(n):
        # Blom's formula untuk theoretical quantile
        p = (i + 1 - 0.375) / (n + 0.25)
        theoretical = normal_ppf(p)
        sample = sorted_data[i]
        qq.append({"theoretical": round(theoretical, 4), "sample": round(sample, 4)})

    return qq
