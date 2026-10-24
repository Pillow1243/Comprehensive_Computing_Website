"""SolveEverything Math Engine API — FastAPI + SymPy (Phase 0/1).
اجرا:  uvicorn backend.main:app --host 0.0.0.0 --port 8000
بدون نصب وابستگی‌ها هم وب‌اپ (apps/web) به‌صورت کامل سمت کاربر کار می‌کند.
"""
from __future__ import annotations
import ast, math, os, time
from typing import Any
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

app = FastAPI(title="SolveEverything API", version="1.0.0",
              description="Step-by-step math/physics/chemistry engine. OpenAPI at /docs")
_DEFAULT_CORS_ORIGINS = (
    "https://pillow1243.github.io,"
    "http://localhost:3000,http://localhost:8080,http://127.0.0.1:8080"
)
_ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", _DEFAULT_CORS_ORIGINS).split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    allow_credentials=False,
)

# ── simple in-memory rate limit (production: Redis) ──
_hits: dict[str, list[float]] = {}
_RATE_WINDOW_S, _RATE_MAX = 60.0, 120
@app.middleware("http")
async def rate_limit(request: Request, call_next):
    # Exceptions raised inside HTTP middleware bypass FastAPI's handlers (they became HTTP 500),
    # so the 429 response must be returned directly.
    now = time.time(); ip = request.client.host if request.client else "?"
    recent = [t for t in _hits.get(ip, []) if now - t < _RATE_WINDOW_S]
    if len(recent) >= _RATE_MAX:
        _hits[ip] = recent
        return JSONResponse({"detail": "Rate limit: 120 req/min"}, status_code=429,
                            headers={"Retry-After": "60"})
    recent.append(now)
    _hits[ip] = recent
    if len(_hits) > 10_000:  # bound memory: drop idle clients
        for key in [k for k, v in _hits.items() if not v or now - v[-1] >= _RATE_WINDOW_S]:
            _hits.pop(key, None)
    return await call_next(request)

class SolveRequest(BaseModel):
    formula_id: str
    inputs: dict[str, Any] = Field(default_factory=dict)

class ExprRequest(BaseModel):
    expression: str = Field(max_length=500, examples=["x^2-2"])
    variable: str = Field(default="x", pattern=r"^[A-Za-z][A-Za-z0-9_]{0,15}$")

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
    if len(expr) > 500:
        raise ValueError("expression is too long")
    tree = ast.parse(expr.replace("^", "**"), mode="eval")
    if len(list(ast.walk(tree))) > 128:
        raise ValueError("expression is too complex")
    def ev(n):
        if not isinstance(n, _ALLOWED_NODES): raise ValueError("node not allowed")
        if isinstance(n, ast.Expression): return ev(n.body)
        if isinstance(n, ast.Constant):
            if isinstance(n.value, bool) or not isinstance(n.value, (int, float)) or not math.isfinite(float(n.value)) or abs(float(n.value)) > 1e100:
                raise ValueError("only finite numeric constants in range are allowed")
            return float(n.value)
        if isinstance(n, ast.Name):
            values = {"x": x, "pi": math.pi, "e": math.e}
            if n.id not in values: raise ValueError(f"name not allowed: {n.id}")
            return values[n.id]
        if isinstance(n, ast.UnaryOp): return -ev(n.operand) if isinstance(n.op, ast.USub) else ev(n.operand)
        if isinstance(n, ast.Call):
            if not isinstance(n.func, ast.Name) or n.func.id not in _FUNCS or n.keywords:
                raise ValueError("function not allowed")
            return _FUNCS[n.func.id](*[ev(a) for a in n.args])
        a, b = ev(n.left), ev(n.right)
        if isinstance(n.op, ast.Add): return a + b
        if isinstance(n.op, ast.Sub): return a - b
        if isinstance(n.op, ast.Mult): return a * b
        if isinstance(n.op, ast.Div): return a / b
        if isinstance(n.op, ast.Pow):
            if abs(b) > 1000: raise ValueError("numeric exponent is out of range")
            return a ** b
        if isinstance(n.op, ast.Mod): return a % b
        raise ValueError("operator not allowed")
    return ev(tree)


def _safe_sympy_expression(expr: str, variable: str):
    """Convert a small allow-listed Python AST to SymPy without parse_expr/eval."""
    if len(expr) > 500:
        raise ValueError("expression is too long")
    if not variable.isidentifier() or not variable.isascii():
        raise ValueError("invalid variable name")
    import sympy as sp
    tree = ast.parse(expr.replace("^", "**"), mode="eval")
    nodes = list(ast.walk(tree))
    if len(nodes) > 128:
        raise ValueError("expression is too complex")
    symbols = {variable: sp.Symbol(variable), "pi": sp.pi, "E": sp.E}
    funcs = {"sqrt": sp.sqrt, "sin": sp.sin, "cos": sp.cos, "tan": sp.tan,
             "asin": sp.asin, "acos": sp.acos, "atan": sp.atan, "sinh": sp.sinh,
             "cosh": sp.cosh, "tanh": sp.tanh, "exp": sp.exp, "log": sp.log,
             "Abs": sp.Abs}
    operators = {ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Pow, ast.Mod}

    def convert(node):
        if isinstance(node, ast.Expression):
            return convert(node.body)
        if isinstance(node, ast.Constant):
            if isinstance(node.value, bool) or not isinstance(node.value, (int, float)):
                raise ValueError("only finite numeric constants are allowed")
            value = float(node.value)
            if not math.isfinite(value) or abs(value) > 1e100:
                raise ValueError("numeric constant is out of range")
            return sp.Integer(node.value) if isinstance(node.value, int) else sp.Float(value)
        if isinstance(node, ast.Name):
            if node.id not in symbols:
                raise ValueError(f"name not allowed: {node.id}")
            return symbols[node.id]
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub)):
            value = convert(node.operand)
            return value if isinstance(node.op, ast.UAdd) else sp.Mul(-1, value, evaluate=False)
        if isinstance(node, ast.BinOp) and type(node.op) in operators:
            left, right = convert(node.left), convert(node.right)
            if isinstance(node.op, ast.Add):
                return sp.Add(left, right, evaluate=False)
            if isinstance(node.op, ast.Sub):
                return sp.Add(left, sp.Mul(-1, right, evaluate=False), evaluate=False)
            if isinstance(node.op, ast.Mult):
                return sp.Mul(left, right, evaluate=False)
            if isinstance(node.op, ast.Div):
                return sp.Mul(left, sp.Pow(right, -1, evaluate=False), evaluate=False)
            if isinstance(node.op, ast.Pow):
                if right.is_number and abs(float(right)) > 1000:
                    raise ValueError("numeric exponent is out of range")
                return sp.Pow(left, right, evaluate=False)
            return sp.Mod(left, right, evaluate=False)
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and not node.keywords:
            fn = funcs.get(node.func.id)
            if fn is None or not 1 <= len(node.args) <= 2:
                raise ValueError("function or arity not allowed")
            return fn(*(convert(arg) for arg in node.args))
        raise ValueError(f"syntax not allowed: {type(node).__name__}")

    return convert(tree)

@app.post("/api/v1/calculus/derivative")
def derivative(req: ExprRequest, point: float = 0.0):
    try:
        import sympy as sp
        x = sp.Symbol(req.variable)
        expr = _safe_sympy_expression(req.expression, req.variable)
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
        x = sp.Symbol(req.variable)
        expr = _safe_sympy_expression(req.expression, req.variable)
        return {"indefinite": str(sp.integrate(expr, x)), "definite": float(sp.integrate(expr, (x, a, b)))}
    except ImportError:
        n = 2000; h = (b - a) / n  # Simpson
        s = sum((1 if i in (0, n) else (4 if i % 2 else 2)) * _safe_eval(req.expression, a + i * h) for i in range(n + 1))
        return {"definite": s * h / 3, "note": "numeric Simpson (sympy absent)"}
    except Exception as e: raise HTTPException(422, str(e))
