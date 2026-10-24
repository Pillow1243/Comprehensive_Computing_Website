/**
 * Computation worker entry point — bundled by esbuild into
 * public/workers/compute-worker.js.
 *
 * Keeping computation off the main thread means:
 *  • long numeric work (sampling, integration, root finding) cannot freeze the UI;
 *  • the ~60 KB gzip solver registry stays out of the first-load JS budget;
 *  • a runaway computation can be terminated by the caller (30 s watchdog).
 *
 * The actual request handling lives in `compute-core.ts` so it is testable.
 */
import { handleRequest, type WorkerRequest, type WorkerResponse } from './compute-core';
import { FORMULAS } from '../apps/web/registry.js';

const scope = self as unknown as {
  postMessage: (message: WorkerResponse | { type: string; formulas: number }) => void;
  addEventListener: (type: 'message', listener: (event: MessageEvent<WorkerRequest>) => void) => void;
};

scope.addEventListener('message', (event) => {
  const request = event.data;
  const started = performance.now();
  try {
    const result = handleRequest(request);
    scope.postMessage({ id: request.id, ok: true, result, durationMs: performance.now() - started });
  } catch (error) {
    scope.postMessage({
      id: request.id,
      ok: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown worker error',
        code: 'compute',
      },
      durationMs: performance.now() - started,
    });
  }
});

scope.postMessage({ type: 'ready', formulas: FORMULAS.length });
