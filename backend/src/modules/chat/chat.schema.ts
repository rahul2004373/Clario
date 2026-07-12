import { z } from "zod";

export const chatIdParamsSchema = z
  .object({
    id: z.string().trim().min(1)
  })
  .strict();

export const chatBodySchema = z.object({}).strict();
export const chatQuerySchema = z.object({}).strict();
