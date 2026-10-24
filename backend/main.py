"""SolveEverything Math Engine API — FastAPI + SymPy (Phase 0/1).
اجرا:  uvicorn backend.main:app --host 0.0.0.0 --port 8000
بدون نصب وابستگی‌ها هم وب‌اپ (apps/web) به‌صورت کامل سمت کاربر کار می‌کند.
"""
from __future__ import annotations
import ast, math, time
from typing import Any
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="SolveEverything API", version="1.0.0",
              description="Step-by-step math/physics/chemistry engine. OpenAPI at /docs")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET", "POST"], allow_headers=["*"])

# ── simple in-memory rate limit (production: Redis) ──
_hits: dict[str, list[float]] = {}
@app.middleware("http")
async def rate_limit(request: Request, call_next):
    now = time.time(); ip = request.client.host if request.client else "?"
    _hits[ip] = [t for t in _hits.get(ip, []) if now - t < 60]
    if len(_hits[ip]) >= 120: raise HTTPException(429, "Rate limit: 120 req/min")
    _hits[ip].append(now)
    return await call_next(request)

class SolveRequest(BaseModel):
    formula_id: str
    inputs: dict[str, Any] = Field(default_factory=dict)

class ExprRequest(BaseModel):
    expression: str = Field(max_length=500, examples=["x^2-2"])
    variable: str = "x"

@app.get("/health")
def health(): return {"status": "ok", "service": "math-engine", "version": "1.0.0"}

@app.get("/api/v1/formulas")
def list_formulas(q: str = "", category: str = ""):
    """فهرست فرمول‌ها — در تولید از Formula Registry (PostgreSQL/JSON) خوانده می‌شود."""
    from backend.registry_data import FORMULA_INDEX
    out = [f for f in FORMULA_INDEX if (q.lower() in (f["name_en"] + f["name_fa"] + f["id"]).lower()) and (not category or category in f["category_path"])]
    return {"count": len(out), "items": out}

@app.post("/api/v1/solve")
def solve(req: SolveRequest):
    """حل سمت سرور برای فرمول‌های سنگین؛ فرمول‌های سبک سمت کاربر حل می‌شوند."""
    from backend.registry_data import SOLVERS
    fn = SOLVERS.get(req.formula_id)
    if not fn: raise HTTPException(404, f"formula '{req.formula_id}' not found or server solver not yet implemented")
    try: return {"formula_id": req.formula_id, "result": fn(**req.inputs)}
    except Exception as e: raise HTTPException(422, str(e))

_ALLOWED_NODES = (ast.Expression, ast.BinOp, ast.UnaryOp, ast.Call, ast.Name, ast.Constant,
                  ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Pow, ast.Mod, ast.USub, ast.UAdd, ast.Load)
_FUNCS = {"sqrt": math.sqrt, "sin": math.sin, "cos": math.cos, "tan": math.tan, "ln": math.log,
          "log": math.log10, "log2": math.log2, "exp": math.exp, "abs": abs}

def _safe_eval(expr: str, x: float) -> float:
    tree = ast.parse(expr.replace("^", "**"), mode="eval")
    def ev(n):
        if not isinstance(n, _ALLOWED_NODES): raise ValueError("node not allowed")
        if isinstance(n, ast.Expression): return ev(n.body)
        if isinstance(n, ast.Constant): return float(n.value)
        if isinstance(n, ast.Name): return {"x": x, "pi": math.pi, "e": math.e}[n.id]
        if isinstance(n, ast.UnaryOp): return -ev(n.operand) if isinstance(n.op, ast.USub) else ev(n.operand)
        if isinstance(n, ast.Call): return _FUNCS[n.func.id](*[ev(a) for a in n.args])
        a, b = ev(n.left), ev(n.right)
        return {ast.Add: a + b, ast.Sub: a - b, ast.Mult: a * b, ast.Div: a / b, ast.Pow: a ** b, ast.Mod: a % b}[type(n.op)]
    return ev(tree)

@app.post("/api/v1/calculus/derivative")
def derivative(req: ExprRequest, point: float = 0.0):
    try:
        import sympy as sp
        x = sp.symbols(req.variable)
        from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application
        expr = parse_expr(req.expression.replace('^','**'), local_dict={req.variable: x}, transformations=standard_transformations + (implicit_multiplication_application,))
        d = sp.diff(expr, x)
        return {"derivative": str(d), "latex": sp.latex(d), "at_point": float(d.subs(x, point))}
    except ImportError:  # numeric fallback
        h = 1e-6
        return {"derivative_numeric_at_point": (_safe_eval(req.expression, point + h) - _safe_eval(req.expression, point - h)) / (2 * h), "note": "sympy not installed; numeric fallback"}
    except Exception as e: raise HTTPException(422, str(e))

@app.post("/api/v1/calculus/integrate")
def integrate(req: ExprRequest, a: float = 0.0, b: float = 1.0):
    try:
        import sympy as sp
        x = sp.symbols(req.variable)
        from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application
        expr = parse_expr(req.expression.replace('^','**'), local_dict={req.variable: x}, transformations=standard_transformations + (implicit_multiplication_application,))
        return {"indefinite": str(sp.integrate(expr, x)), "definite": float(sp.integrate(expr, (x, a, b)))}
    except ImportError:
        n = 2000; h = (b - a) / n  # Simpson
        s = sum((1 if i in (0, n) else (4 if i % 2 else 2)) * _safe_eval(req.expression, a + i * h) for i in range(n + 1))
        return {"definite": s * h / 3, "note": "numeric Simpson (sympy absent)"}
    except Exception as e: raise HTTPException(422, str(e))
