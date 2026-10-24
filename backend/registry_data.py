"""Server-side mirror of key formulas (index + heavy solvers). Client registry: apps/web/registry.js"""
import math
FORMULA_INDEX = [
 {"id": "trig_triangle_law_of_cosines", "name_fa": "قانون کسینوس‌ها", "name_en": "Law of Cosines", "category_path": ["ریاضیات", "هندسه و مثلثات"]},
 {"id": "quadratic", "name_fa": "معادله درجه دو", "name_en": "Quadratic Equation", "category_path": ["ریاضیات", "جبر"]},
 {"id": "ph", "name_fa": "pH و pOH", "name_en": "pH & pOH", "category_path": ["شیمی", "اسید و باز"]},
]
def _law_of_cosines(a: float, b: float, C: float):
    c = math.sqrt(a*a + b*b - 2*a*b*math.cos(math.radians(C)))
    return {"c": c, "steps": [f"c² = {a}² + {b}² − 2·{a}·{b}·cos({C}°)", f"c = {c}"]}
def _quadratic(a: float, b: float, c: float):
    d = b*b - 4*a*c
    if d < 0: return {"discriminant": d, "roots": "complex"}
    return {"discriminant": d, "x1": (-b + math.sqrt(d)) / (2*a), "x2": (-b - math.sqrt(d)) / (2*a)}
def _ph(concentration: float):
    ph = -math.log10(concentration); return {"pH": ph, "pOH": 14 - ph}
SOLVERS = {"trig_triangle_law_of_cosines": _law_of_cosines, "quadratic": _quadratic, "ph": _ph}
