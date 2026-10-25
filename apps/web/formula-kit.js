// Shared helpers for the runtime formula packs (phases 3–6).
//
// Design rules (see docs/FORMULA_TEMPLATE.md):
//   · every solver is an explicit trusted function — no source strings are evaluated
//   · every declared test case must be reproducible and independent of the demo input
//   · outputs are plain JSON-serialisable values so the worker can postMessage them
export const round = (x, d = 6) => {
  if (!Number.isFinite(x)) return x;
  if (x === 0) return 0;
  if (Math.abs(x) >= 1e12 || Math.abs(x) < 1e-6) return Number(x.toPrecision(8));
  const p = 10 ** d;
  return Math.round((x + Number.EPSILON) * p) / p;
};

export const out = (values, steps) => ({ values, steps });

/** numeric variable */
export const N = (name, label_fa, label_en, unit, def, opts = {}) => ({
  name,
  label_fa,
  label_en: label_en || name,
  type: 'number',
  unit: unit || null,
  default: def,
  required: true,
  ...opts,
});

/** free-text variable (lists, expressions, operators) */
export const T = (name, label_fa, label_en, def) => ({
  name,
  label_fa,
  label_en: label_en || name,
  type: 'text',
  unit: null,
  default: def,
  required: true,
});

/** output descriptor with a human label; label_en is derived when omitted */
export const O = (name, label_fa, unit = null, label_en) => ({
  name,
  label_fa,
  label_en: label_en || titleCase(name),
  unit,
});

export function titleCase(text) {
  return String(text)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export const parseList = (value) => {
  const values = Array.isArray(value)
    ? value.map(Number)
    : String(value)
        .split(/[,;\s،]+/)
        .filter((part) => part !== '')
        .map(Number);
  if (!values.length || values.some((x) => !Number.isFinite(x))) {
    throw new Error('فهرست عددی معتبر وارد کنید');
  }
  return values;
};

export const gcd = (a, b) => {
  a = Math.abs(Math.trunc(a));
  b = Math.abs(Math.trunc(b));
  while (b) [a, b] = [b, a % b];
  return a;
};

export const lcm = (a, b) => (a === 0 || b === 0 ? 0 : Math.abs(a * b) / gcd(a, b));

export const frac = (numerator, denominator) => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    throw new Error('کسر نامعتبر است');
  }
  let p = Math.round(numerator);
  let q = Math.round(denominator);
  if (q < 0) {
    p = -p;
    q = -q;
  }
  const g = gcd(p, q) || 1;
  return `${p / g}/${q / g}`;
};

/** Normalises a formula spec the same way `registry.js` does for phases 1–2. */
export const make = (spec) => {
  if (!spec.tests || spec.tests.length < 2) {
    throw new Error(`formula ${spec.id} needs at least two test cases`);
  }
  const testOutputs = spec.tests.flatMap((test) => Object.keys(test.expected || {}));
  // Run the first case once so that outputs which are not asserted in the tests
  // still get labels in the UI. Any failure here is reported by validation.
  let computed = [];
  try {
    computed = Object.keys(spec.compute({ ...spec.tests[0].input }).values || {});
  } catch {
    computed = [];
  }
  const declared = spec.outputs ?? [];
  const names = [...new Set([...declared.map((o) => o.name), ...testOutputs, ...computed])];
  const outputs = names.map((name) => declared.find((o) => o.name === name) ?? O(name, name));
  return {
    version: '1.0.0',
    validated: true,
    difficulty: 'basic',
    tags: [],
    references: [],
    plot_spec: null,
    ...spec,
    outputs,
    examples: spec.examples || [{ ...spec.tests[0].input }],
  };
};

/** Physical / mathematical constants shared by the science packs. */
export const CONST = {
  g: 9.80665,
  G: 6.6743e-11,
  c: 299792458,
  h: 6.62607015e-34,
  hbar: 1.054571817e-34,
  kB: 1.380649e-23,
  NA: 6.02214076e23,
  R: 8.314462618,
  R_atm: 0.082057366,
  e: 1.602176634e-19,
  me: 9.1093837015e-31,
  mp: 1.67262192369e-27,
  sigma: 5.670374419e-8,
  eps0: 8.8541878128e-12,
  mu0: 1.25663706212e-6,
  atm: 101325,
  F: 96485.33212,
  Ry: 10973731.56816,
  Ry_eV: 13.605693,
};

/** Small standard-normal CDF helper (Abramowitz & Stegun 7.1.26). */
export const normalCdf = (z) => {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const density = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
  const poly =
    density *
    t *
    (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - poly : poly;
};

export const zCritical = (confidence) => {
  const table = { 80: 1.2816, 90: 1.6449, 95: 1.96, 98: 2.3263, 99: 2.5758, 99.9: 3.2905 };
  const z = table[Math.round(confidence)];
  if (!z) throw new Error('سطح اطمینان باید ۸۰، ۹۰، ۹۵، ۹۸، ۹۹ یا ۹۹.۹ باشد');
  return z;
};
