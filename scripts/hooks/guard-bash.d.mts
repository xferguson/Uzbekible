export interface BashHookInput {
  tool_input?: { command?: string };
  cwd?: string;
}
export function decideBash(
  input: BashHookInput,
  isMainMerged: () => boolean,
  currentBranch?: () => string,
): { block: false } | { block: true; reason: string };
