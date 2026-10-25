'use client';

import { withBasePath } from '@/lib/base-path';
import { FormulaError, type RawInputs } from '@/lib/validation';
import type { Formula } from '@/lib/formulas';
import { reportError } from '@/lib/telemetry';

type WorkerRequestPayload = Record<string, unknown> & { op: string };

interface PendingTask {
  id: string;
  request: WorkerRequestPayload;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
  removeAbortListener?: () => void;
  worker: Worker;
}

const WORKER_URL = () => withBasePath('/workers/compute-worker.js');
const DEFAULT_TIMEOUT = 30_000;
const MAX_WORKERS = 2;

const newRequestId = () =>
  `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Small worker pool. Each task owns a worker so that aborting a runaway
 * computation can `terminate()` it without poisoning the pool. Idle workers are
 * reused; when both are busy the task waits in a FIFO queue.
 */
class ComputePool {
  private idle: Worker[] = [];
  private pending = new Map<Worker, PendingTask>();
  private queue: Array<() => void> = [];
  private created = 0;
  private unsupported = false;

  private canCreateWorker(): boolean {
    if (this.unsupported) return false;
    if (typeof window === 'undefined' || typeof Worker === 'undefined') return false;
    return this.created < MAX_WORKERS;
  }

  private createWorker(): Worker {
    this.created += 1;
    const worker = new Worker(WORKER_URL(), { name: 'solveeverything-compute' });
    worker.addEventListener('message', (event: MessageEvent) => {
      const data = event.data as
        | { type?: string }
        | {
            id: string;
            ok: boolean;
            result?: unknown;
            error?: { message: string; code: string };
            durationMs?: number;
          };
      if (!data || typeof data !== 'object' || !('id' in data)) return;
      const task = this.pending.get(worker);
      if (!task || task.id !== data.id) return;
      this.pending.delete(worker);
      clearTimeout(task.timeout);
      task.removeAbortListener?.();
      if (data.ok) {
        task.resolve(data.result);
        this.release(worker);
      } else {
        task.reject(new Error(data.error?.message ?? 'Worker computation failed'));
        this.release(worker);
      }
    });
    worker.addEventListener('error', (event) => {
      const task = this.pending.get(worker);
      this.pending.delete(worker);
      this.created = Math.max(0, this.created - 1);
      try {
        worker.terminate();
      } catch {
        /* already gone */
      }
      if (task) {
        clearTimeout(task.timeout);
        task.removeAbortListener?.();
        task.reject(new Error(event.message || 'Worker crashed'));
      }
      this.drain();
    });
    return worker;
  }

  private release(worker: Worker) {
    this.idle.push(worker);
    this.drain();
  }

  private drain() {
    while (this.queue.length) {
      const take = this.idle.pop();
      if (!take) {
        if (this.canCreateWorker()) {
          this.queue.shift()?.();
          continue;
        }
        return;
      }
      this.queue.shift()?.();
      this.idle.push(take);
      return;
    }
  }

  private acquire(): Promise<Worker> {
    return new Promise((resolve, reject) => {
      // No Worker support at all: fail fast instead of queueing forever, so the
      // caller can fall back to computing on the main thread.
      if (typeof Worker === 'undefined') {
        this.unsupported = true;
        return reject(new Error('Worker unavailable in this environment'));
      }
      const attempt = () => {
        const worker = this.idle.pop();
        if (worker) return resolve(worker);
        if (this.canCreateWorker()) {
          try {
            return resolve(this.createWorker());
          } catch (error) {
            this.unsupported = true;
            return reject(error);
          }
        }
        if (this.unsupported) {
          return reject(new Error('Worker unavailable in this environment'));
        }
        this.queue.push(attempt);
      };
      attempt();
    });
  }

  async run<T>(request: WorkerRequestPayload, options: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<T> {
    const { signal, timeoutMs = DEFAULT_TIMEOUT } = options;
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const worker = await this.acquire();
    const id = newRequestId();
    return new Promise<T>((resolve, reject) => {
      const cleanup = () => {
        signal?.removeEventListener('abort', abort);
      };
      const terminate = (error: unknown) => {
        this.pending.delete(worker);
        clearTimeout(timer);
        cleanup();
        try {
          worker.terminate();
        } catch {
          /* noop */
        }
        this.created = Math.max(0, this.created - 1);
        this.drain();
        reject(error);
      };
      const abort = () => terminate(new DOMException('Aborted', 'AbortError'));
      const timer = setTimeout(
        () => terminate(new FormulaError('timeout', 'Computation timed out after 30 seconds', {
          formulaId: String(request.formulaId ?? request.op),
        })),
        timeoutMs,
      );
      signal?.addEventListener('abort', abort, { once: true });
      this.pending.set(worker, {
        id,
        request,
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout: timer,
        removeAbortListener: cleanup,
        worker,
      });
      worker.postMessage({ ...request, id });
    });
  }

  get size() {
    return this.created;
  }
}

let pool: ComputePool | null = null;
const getPool = () => (pool ??= new ComputePool());

export const workerPoolSize = () => getPool().size;

export interface ComputeOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

/** Execute a trusted formula solver inside the worker. */
export async function computeFormula(
  formula: Formula,
  inputs: RawInputs,
  options: ComputeOptions = {},
): Promise<{ values: Record<string, unknown>; steps: string[]; durationMs: number }> {
  const started = performance.now();
  try {
    const result = await getPool().run<{ values: Record<string, unknown>; steps: string[] }>(
      { op: 'compute', formulaId: formula.id, inputs: { ...inputs } },
      options,
    );
    if (!result || typeof result !== 'object' || !result.values) {
      throw new FormulaError('compute', 'Worker returned an empty result', {
        formulaId: formula.id,
        inputs,
      });
    }
    return { values: result.values, steps: result.steps ?? [], durationMs: performance.now() - started };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    if (error instanceof FormulaError) throw error;
    // Worker unavailable (old browser / blocked by policy): compute locally so the
    // app degrades gracefully instead of failing.
    const message = error instanceof Error ? error.message : String(error);
    if (/worker|script|load|network|failed to fetch/i.test(message)) {
      reportError(error, { formulaId: formula.id, inputs, scope: 'worker-fallback' });
      try {
        // Last-resort local computation. The registry (~59 KB gzip) is only
        // fetched when the worker cannot run, so it never affects first load.
        const { FORMULAS } = await import('@/apps/web/registry.js');
        const solver = (FORMULAS as Array<{ id: string; compute: (values: RawInputs) => { values: Record<string, unknown>; steps: string[] } }>).find(
          (candidate) => candidate.id === formula.id,
        );
        if (!solver) throw new Error(`Unknown formula: ${formula.id}`);
        const result = solver.compute({ ...inputs });
        return { values: result.values, steps: result.steps ?? [], durationMs: performance.now() - started };
      } catch (localError) {
        throw new FormulaError('compute', localError instanceof Error ? localError.message : 'Compute failed', {
          formulaId: formula.id,
          inputs,
          cause: localError,
        });
      }
    }
    throw new FormulaError('compute', message, { formulaId: formula.id, inputs, cause: error });
  }
}

export const evaluateExpression = (expr: string, vars: Record<string, number> = {}, options: ComputeOptions = {}) =>
  getPool().run<number>({ op: 'evaluate', expr, vars }, options);

export const sampleSeries = (
  expr: string,
  from: number,
  to: number,
  points = 480,
  vars: Record<string, number> = {},
  options: ComputeOptions = {},
) => getPool().run<{ xs: number[]; ys: number[] }>({ op: 'sample', expr, from, to, points, vars }, options);

export const integrateExpression = (expr: string, from: number, to: number, options: ComputeOptions = {}) =>
  getPool().run<number>({ op: 'integrate', expr, from, to }, options);

export const differentiateExpression = (expr: string, at: number, options: ComputeOptions = {}) =>
  getPool().run<number>({ op: 'derivative', expr, at }, options);

export const findRootExpression = (expr: string, from: number, to: number, options: ComputeOptions = {}) =>
  getPool().run<number>({ op: 'root', expr, from, to }, options);

export const matrixOperation = (a: number[][], b?: number[][], options: ComputeOptions = {}) =>
  getPool().run<{ determinant: number; inverse: number[][] | null; product: number[][] | null }>(
    { op: 'matrix', a, b },
    options,
  );

export const descriptiveStats = (values: number[], options: ComputeOptions = {}) =>
  getPool().run<Record<string, number>>({ op: 'stats', values }, options);

export const linearRegression = (x: number[], y: number[], options: ComputeOptions = {}) =>
  getPool().run<{ slope: number; intercept: number; r: number; r2: number }>(
    { op: 'regression', x, y },
    options,
  );
