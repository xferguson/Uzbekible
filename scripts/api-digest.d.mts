import type ts from 'typescript';
export function describeEntry(entry: string, options?: ts.CompilerOptions): string[];
export function renderDigest(modules: { name: string; lines: string[] }[]): string;
export function entryPoints(): { name: string; file: string }[];
export function generate(): string;
