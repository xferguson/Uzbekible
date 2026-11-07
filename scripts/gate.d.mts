export interface GateStep {
  name: string;
  cmd: string;
  args: string[];
  /** Extracts the error lines (file:line + message) from the step's output. */
  errors: (output: string) => string[];
  /** Lines to print when the step passes (e.g. coverage summary). */
  summary?: (output: string) => string[];
}
export type StepRunner = (step: GateStep) => Promise<{ code: number; output: string }>;
export const MAX_ERROR_LINES: number;
export const STEPS: GateStep[];
export function runGate(deps: {
  steps?: GateStep[];
  run: StepRunner;
  write: (line: string) => void;
  now?: () => number;
}): Promise<number>;
export const spawnRunner: StepRunner;
