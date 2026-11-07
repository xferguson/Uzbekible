import { PackSchema, type Item } from './schema.ts';

/** Parses a decoded items.v1.json; throws a ZodError if the pack is not a valid version 1 pack. */
export function loadItems(json: unknown): Item[] {
  return PackSchema.parse(json).items;
}
