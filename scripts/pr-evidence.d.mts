export function isVisualPath(path: string): boolean;
export function checkEvidence(files: string[], body: string): { ok: boolean; reason: string };
export function main(argv: string[], write?: (line: string) => void): number;
