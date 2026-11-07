import { z } from 'zod';

export const LANGS = ['tr', 'ru', 'fa', 'ar'] as const;
export const RELATIONS = [
  'turkic-cognate',
  'shared-arabic',
  'shared-persian',
  'russian-loan',
  'persian-loan',
  'arabic-loan',
  'other-loan',
  'false-friend',
] as const;
export const CONFIDENCES = ['high', 'medium', 'low'] as const;

export const LangSchema = z.enum(LANGS);
export const RelationSchema = z.enum(RELATIONS);
export const ConfidenceSchema = z.enum(CONFIDENCES);

const nonEmpty = z.string().trim().min(1);

export const SourceFormSchema = z.strictObject({
  lang: LangSchema,
  text: nonEmpty,
  relation: RelationSchema,
  confidence: ConfidenceSchema,
  correspondence: z.array(nonEmpty).optional(),
  ref: nonEmpty,
});

export const ItemSchema = z.strictObject({
  id: nonEmpty,
  uz: z.strictObject({ latn: nonEmpty, cyrl: z.string() }),
  freqRank: z.number().int().min(1),
  form: z.enum(['lemma', 'inflected']),
  lemma: nonEmpty.optional(),
  suffixes: z.array(nonEmpty).optional(),
  pos: nonEmpty.optional(),
  glossEn: nonEmpty,
  sources: z.array(SourceFormSchema),
  tags: z.array(nonEmpty),
  deprecated: z.boolean().optional(),
  /** Computed at build time by core/similarity; 0..1 per source language. */
  transparency: z.partialRecord(LangSchema, z.number().min(0).max(1)).optional(),
});

export const PackSchema = z.strictObject({
  version: z.literal(1),
  items: z.array(ItemSchema),
});

export type Lang = z.infer<typeof LangSchema>;
export type Relation = z.infer<typeof RelationSchema>;
export type Confidence = z.infer<typeof ConfidenceSchema>;
export type SourceForm = z.infer<typeof SourceFormSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Pack = z.infer<typeof PackSchema>;
