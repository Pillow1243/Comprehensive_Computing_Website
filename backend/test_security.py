import sympy as sp
import unittest
from fastapi.testclient import TestClient

from backend.main import _safe_eval, _safe_sympy_expression, app


class SafeSymbolicParserTests(unittest.TestCase):
    def test_numeric_fallback_dispatches_only_the_selected_operator(self):
        self.assertEqual(_safe_eval("x+0", 2), 2)
        self.assertAlmostEqual(_safe_eval("sin(x)", sp.pi / 2), 1)

    def test_numeric_fallback_rejects_unsafe_syntax(self):
        for expression in ("__import__('os')", "x.__class__", "x**1001"):
            with self.subTest(expression=expression), self.assertRaises(Exception):
                _safe_eval(expression, 1)

    def test_converts_allowed_expression_and_supports_derivative(self):
        x = sp.Symbol("x")
        expr = _safe_sympy_expression("x^3-2*x", "x")
        self.assertEqual(sp.diff(expr, x).subs(x, 2), 10)

    def test_supports_definite_integrals(self):
        x = sp.Symbol("x")
        expr = _safe_sympy_expression("x^2", "x")
        self.assertEqual(sp.integrate(expr, (x, 0, 3)), 9)

    def test_allows_only_selected_functions(self):
        x = sp.Symbol("x")
        self.assertEqual(sp.diff(_safe_sympy_expression("sin(x)", "x"), x), sp.cos(x))
        with self.assertRaises(ValueError):
            _safe_sympy_expression("__import__('os')", "x")

    def test_rejects_attributes_and_unknown_names(self):
        for expression in ("x.__class__", "open(1)", "os.system(1)"):
            with self.subTest(expression=expression), self.assertRaises(ValueError):
                _safe_sympy_expression(expression, "x")

    def test_rejects_excessively_complex_trees(self):
        expression = "+".join(["x"] * 70)
        with self.assertRaises(ValueError):
            _safe_sympy_expression(expression, "x")


class APIEndpointTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_derivative_endpoint(self):
        response = self.client.post(
            "/api/v1/calculus/derivative?point=2",
            json={"expression": "x^3-2*x", "variable": "x"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["at_point"], 10)

    def test_integral_endpoint(self):
        response = self.client.post(
            "/api/v1/calculus/integrate?a=0&b=3",
            json={"expression": "x^2", "variable": "x"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["definite"], 9)

    def test_server_solver_and_unknown_formula_response(self):
        response = self.client.post(
            "/api/v1/solve",
            json={"formula_id": "ph", "inputs": {"concentration": 0.001}},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["result"]["pH"], 3)
        missing = self.client.post(
            "/api/v1/solve", json={"formula_id": "not_a_solver", "inputs": {}}
        )
        self.assertEqual(missing.status_code, 404)

    def test_cors_allows_pages_origin(self):
        response = self.client.options(
            "/api/v1/solve",
            headers={
                "Origin": "https://pillow1243.github.io",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers.get("access-control-allow-origin"),
            "https://pillow1243.github.io",
        )


if __name__ == "__main__":
    unittest.main()


class RateLimitTests(unittest.TestCase):
    def test_rate_limit_returns_429_not_500(self):
        from backend import main as api_main

        previous = dict(api_main._hits)
        try:
            api_main._hits.clear()
            client = TestClient(api_main.app, raise_server_exceptions=False)
            codes = [client.get("/health").status_code for _ in range(api_main._RATE_MAX + 5)]
            self.assertEqual(codes[: api_main._RATE_MAX], [200] * api_main._RATE_MAX)
            self.assertEqual(codes[-5:], [429] * 5)
        finally:
            api_main._hits.clear()
            api_main._hits.update(previous)
