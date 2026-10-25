/**
 * Small dense-matrix toolkit (v4) for the Matrix Lab.
 *
 * Pure functions over `number[][]` (row-major), sized for teaching
 * (≤ 6×6). Determinant/inverse/solve use Gaussian elimination with partial
 * pivoting; a 1e-12 pivot threshold reports singularity instead of
 * returning Infinity/NaN.
 */

export type Matrix = number[][];

const EPS = 1e-12;

export const MAX_MATRIX_SIZE = 6;

export function createMatrix(rows: number, cols: number, fill: 'zero' | 'identity' = 'zero'): Matrix {
  return Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => (fill === 'identity' && i === j ? 1 : 0)),
  );
}

export function matrixShape(m: Matrix): { rows: number; cols: number } {
  return { rows: m.length, cols: m[0]?.length ?? 0 };
}

function assertSameShape(a: Matrix, b: Matrix): void {
  const sa = matrixShape(a);
  const sb = matrixShape(b);
  if (sa.rows !== sb.rows || sa.cols !== sb.cols) throw new Error('ابعاد دو ماتریس برابر نیست');
}

function assertSquare(m: Matrix): number {
  const { rows, cols } = matrixShape(m);
  if (rows !== cols || rows === 0) throw new Error('ماتریس باید مربعی باشد');
  return rows;
}

export const addMatrices = (a: Matrix, b: Matrix): Matrix => {
  assertSameShape(a, b);
  return a.map((row, i) => row.map((value, j) => value + b[i][j]));
};

export const subtractMatrices = (a: Matrix, b: Matrix): Matrix => {
  assertSameShape(a, b);
  return a.map((row, i) => row.map((value, j) => value - b[i][j]));
};

export function multiplyMatrices(a: Matrix, b: Matrix): Matrix {
  const sa = matrixShape(a);
  const sb = matrixShape(b);
  if (sa.cols !== sb.rows) throw new Error('برای ضرب، ستون‌های اولی باید با سطرهای دومی برابر باشد');
  return a.map((row, i) =>
    Array.from({ length: sb.cols }, (_, j) =>
      row.reduce((sum, value, k) => sum + value * b[k][j], 0),
    ),
  ).map((row) => row.map((v) => v));
}

export const transposeMatrix = (m: Matrix): Matrix =>
  (m[0] ?? []).map((_, j) => m.map((row) => row[j]));

export const scaleMatrix = (m: Matrix, factor: number): Matrix =>
  m.map((row) => row.map((value) => value * factor));

export function traceMatrix(m: Matrix): number {
  const n = assertSquare(m);
  let sum = 0;
  for (let i = 0; i < n; i += 1) sum += m[i][i];
  return sum;
}

export function frobeniusNorm(m: Matrix): number {
  return Math.sqrt(m.flat().reduce((sum, value) => sum + value * value, 0));
}

function clone(m: Matrix): Matrix {
  return m.map((row) => [...row]);
}

/** Determinant via LU-style elimination with row swaps. */
export function determinant(m: Matrix): number {
  const n = assertSquare(m);
  const a = clone(m);
  let det = 1;
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    }
    if (Math.abs(a[pivot][col]) < EPS) return 0;
    if (pivot !== col) {
      [a[col], a[pivot]] = [a[pivot], a[col]];
      det *= -1;
    }
    det *= a[col][col];
    for (let row = col + 1; row < n; row += 1) {
      const factor = a[row][col] / a[col][col];
      for (let k = col; k < n; k += 1) a[row][k] -= factor * a[col][k];
    }
  }
  return det;
}

/** Inverse via Gauss–Jordan on [A | I]; throws when singular. */
export function inverseMatrix(m: Matrix): Matrix {
  const n = assertSquare(m);
  const aug = m.map((row, i) => [...row, ...createMatrix(1, n, 'zero')[0].map((_, j) => (i === j ? 1 : 0))]);
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[pivot][col])) pivot = row;
    }
    if (Math.abs(aug[pivot][col]) < EPS) throw new Error('ماتریس تکین است و وارون ندارد (دترمینان صفر)');
    if (pivot !== col) [aug[col], aug[pivot]] = [aug[pivot], aug[col]];
    const divisor = aug[col][col];
    for (let k = 0; k < 2 * n; k += 1) aug[col][k] /= divisor;
    for (let row = 0; row < n; row += 1) {
      if (row === col) continue;
      const factor = aug[row][col];
      if (factor === 0) continue;
      for (let k = 0; k < 2 * n; k += 1) aug[row][k] -= factor * aug[col][k];
    }
  }
  return aug.map((row) => row.slice(n));
}

/** Solve A·x = b; throws when the system has no unique solution. */
export function solveLinearSystem(a: Matrix, b: number[]): number[] {
  const n = assertSquare(a);
  if (b.length !== n) throw new Error('طول بردار سمت راست با ابعاد ماتریس نمی‌خواند');
  const aug = a.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[pivot][col])) pivot = row;
    }
    if (Math.abs(aug[pivot][col]) < EPS) throw new Error('دستگاه جواب یکتا ندارد');
    if (pivot !== col) [aug[col], aug[pivot]] = [aug[pivot], aug[col]];
    for (let row = col + 1; row < n; row += 1) {
      const factor = aug[row][col] / aug[col][col];
      for (let k = col; k <= n; k += 1) aug[row][k] -= factor * aug[col][k];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let row = n - 1; row >= 0; row -= 1) {
    let sum = aug[row][n];
    for (let k = row + 1; k < n; k += 1) sum -= aug[row][k] * x[k];
    x[row] = sum / aug[row][row];
  }
  return x;
}

/** Eigenvalues of a 2×2 matrix (may be complex). */
export function eigenvalues2x2(m: Matrix): { real: number; imag: number }[] {
  if (matrixShape(m).rows !== 2) throw new Error('مقدار ویژه در این ابزار فقط برای ۲×۲ است');
  const [[a, b], [c, d]] = m;
  const trace = a + d;
  const det = a * d - b * c;
  const disc = trace * trace - 4 * det;
  if (disc >= 0) {
    const root = Math.sqrt(disc);
    return [
      { real: (trace + root) / 2, imag: 0 },
      { real: (trace - root) / 2, imag: 0 },
    ];
  }
  const root = Math.sqrt(-disc) / 2;
  return [
    { real: trace / 2, imag: root },
    { real: trace / 2, imag: -root },
  ];
}

/** Rank via row-echelon pivot counting. */
export function matrixRank(m: Matrix): number {
  const a = clone(m);
  const { rows, cols } = matrixShape(a);
  let rank = 0;
  for (let col = 0; col < cols && rank < rows; col += 1) {
    let pivot = rank;
    for (let row = rank + 1; row < rows; row += 1) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    }
    if (Math.abs(a[pivot][col]) < 1e-10) continue;
    if (pivot !== rank) [a[rank], a[pivot]] = [a[pivot], a[rank]];
    for (let row = rank + 1; row < rows; row += 1) {
      const factor = a[row][col] / a[rank][col];
      for (let k = col; k < cols; k += 1) a[row][k] -= factor * a[rank][k];
    }
    rank += 1;
  }
  return rank;
}

/** Parse a matrix pasted as text: rows on lines or `;`, values split by space/comma. */
export function parseMatrixText(text: string): Matrix {
  const rows = text
    .split(/[\n;]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) =>
      line
        .split(/[\s,،]+/)
        .filter(Boolean)
        .map((cell) => Number(cell)),
    );
  if (!rows.length || rows.some((row) => row.length === 0 || row.some((value) => !Number.isFinite(value)))) {
    throw new Error('متن ماتریس معتبر نیست');
  }
  const cols = rows[0].length;
  if (rows.some((row) => row.length !== cols)) throw new Error('همه سطرها باید هم‌اندازه باشند');
  return rows;
}

export const matrixToText = (m: Matrix): string => m.map((row) => row.join(' ')).join('\n');
