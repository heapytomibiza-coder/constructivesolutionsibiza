import { z } from "zod";

/**
 * Zod validators for jobs domain.
 * Creates a boundary between raw DB data and domain types.
 */

// Location object shape
export const JobLocationSchema = z.object({
  preset: z.string().nullable().optional(),
  area: z.string().optional(),
  town: z.string().nullable().optional(),
  custom: z.string().nullable().optional(),
  zone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
}).passthrough();

// Selected services shape
export const JobSelectedSchema = z.object({
  mainCategory: z.string(),
  subcategory: z.string().nullable().optional(),
  microNames: z.array(z.string()).optional(),
  microIds: z.array(z.string()).optional(),
  microSlugs: z.array(z.string()).optional(),
}).passthrough();

// Logistics shape
export const JobLogisticsSchema = z.object({
  location: z.string().optional(),
  customLocation: z.string().nullable().optional(),
  startDatePreset: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  completionDate: z.string().nullable().optional(),
  consultationType: z.string().nullable().optional(),
  consultationDate: z.string().nullable().optional(),
  consultationTime: z.string().nullable().optional(),
  budgetRange: z.string().nullable().optional(),
  accessDetails: z.array(z.string()).optional(),
}).passthrough();

// Extras shape
export const JobExtrasSchema = z.object({
  photos: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
  permitsConcern: z.boolean().optional(),
}).passthrough();

// Full answers structure
export const JobAnswersSchema = z.object({
  selected: JobSelectedSchema.optional(),
  microAnswers: z.record(z.unknown()).optional(),
  logistics: JobLogisticsSchema.optional(),
  extras: JobExtrasSchema.optional(),
  _pack_source: z.string().optional(),
  _pack_slug: z.string().nullable().optional(),
  _pack_missing: z.boolean().optional(),
}).passthrough();

// Jobs board row (list view - minimal data)
export const JobsBoardRowSchema = z.object({
  id: z.string().min(1),
  title: z.string().nullable().optional(),
  teaser: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  subcategory: z.string().nullable().optional(),
  micro_slug: z.string().nullable().optional(),
  area: z.string().nullable().optional(),
  location: JobLocationSchema.nullable().optional(),
  budget_type: z.string().nullable().optional(),
  budget_value: z.number().nullable().optional(),
  budget_min: z.number().nullable().optional(),
  budget_max: z.number().nullable().optional(),
  start_timing: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  has_photos: z.boolean().nullable().optional(),
  highlights: z.array(z.string()).nullable().optional(),
  created_at: z.string().min(1),
  updated_at: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  is_publicly_listed: z.boolean().nullable().optional(),
}).passthrough();

// Job details row (full view - includes answers)
export const JobDetailsRowSchema = JobsBoardRowSchema.extend({
  description: z.string().nullable().optional(),
  answers: JobAnswersSchema.nullable().optional(),
  is_owner: z.boolean().nullable().optional(),
}).passthrough();

// Question pack structure
export const QuestionOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const QuestionDefSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.string(),
  options: z.array(QuestionOptionSchema).optional(),
}).passthrough();

export const QuestionPackSchema = z.object({
  micro_slug: z.string(),
  title: z.string(),
  questions: z.array(QuestionDefSchema),
}).passthrough();

// DTO types inferred from schemas
export type JobLocationDTO = z.infer<typeof JobLocationSchema>;
export type JobAnswersDTO = z.infer<typeof JobAnswersSchema>;
export type JobsBoardRowDTO = z.infer<typeof JobsBoardRowSchema>;
export type JobDetailsRowDTO = z.infer<typeof JobDetailsRowSchema>;
export type QuestionPackDTO = z.infer<typeof QuestionPackSchema>;

/**
 * Parse and validate job details from raw API response.
 * Throws if validation fails - fail fast on schema mismatch.
 */
export function parseJobDetails(input: unknown): JobDetailsRowDTO {
  return JobDetailsRowSchema.parse(input);
}

/**
 * Parse and validate jobs board list from raw API response.
 */
export function parseJobsBoardList(input: unknown): JobsBoardRowDTO[] {
  return z.array(JobsBoardRowSchema).parse(input);
}

/**
 * Parse and validate question packs from raw API response.
 */
export function parseQuestionPacks(input: unknown): QuestionPackDTO[] {
  return z.array(QuestionPackSchema).parse(input);
}

/**
 * Safe parse variants - return null on failure instead of throwing.
 * Use these when you want to handle validation errors gracefully.
 */
export function safeParseJobDetails(input: unknown): JobDetailsRowDTO | null {
  const result = JobDetailsRowSchema.safeParse(input);
  return result.success ? result.data : null;
}

export function safeParseJobsBoardList(input: unknown): JobsBoardRowDTO[] {
  const result = z.array(JobsBoardRowSchema).safeParse(input);
  return result.success ? result.data : [];
}

export function safeParseQuestionPacks(input: unknown): QuestionPackDTO[] {
  const result = z.array(QuestionPackSchema).safeParse(input);
  return result.success ? result.data : [];
}
