import { z } from "zod";

export const memberIdParamsSchema = z
  .object({
    id: z.string().trim().min(1)
  })
  .strict();

export const memberBodySchema = z.object({}).strict();
export const memberQuerySchema = z.object({}).strict();
