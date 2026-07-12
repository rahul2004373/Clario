import { z } from "zod";

export const sourcesIdParamsSchema = z
  .object({
    id: z.string().trim().min(1)
  })
  .strict();

export const sourcesBodySchema = z.object({}).strict();
export const sourcesQuerySchema = z.object({}).strict();
