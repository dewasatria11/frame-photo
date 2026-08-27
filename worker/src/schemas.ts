import { z } from 'zod';

const jsonValue: z.ZodType<unknown> = z.lazy(() => z.union([
  z.string().max(10_000), z.number().finite(), z.boolean(), z.null(),
  z.array(jsonValue).max(200), z.record(z.string().max(100), jsonValue),
]));

export const settingsSchema = z.record(z.string().min(1).max(100), jsonValue).refine(
  (v) => Object.keys(v).length <= 100, 'Maksimum 100 pengaturan.',
);
export const presetCreateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  config: settingsSchema,
  assetKey: z.string().max(300).regex(/^[a-zA-Z0-9/_.,-]+$/).nullable().optional(),
}).strict();
export const presetUpdateSchema = presetCreateSchema.omit({ id: true }).partial().refine((v) => Object.keys(v).length > 0);
export const historySchema = z.object({
  id: z.string().uuid().optional(),
  sourceFilename: z.string().trim().min(1).max(255),
  outputFilename: z.string().trim().max(255).nullable().optional(),
  status: z.enum(['success', 'failed', 'skipped']),
  durationMs: z.number().int().min(0).max(86_400_000).nullable().optional(),
  settings: settingsSchema.nullable().optional(),
  errorMessage: z.string().max(1000).nullable().optional(),
}).strict();

export const idSchema = z.string().uuid();
