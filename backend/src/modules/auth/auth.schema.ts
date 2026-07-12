import { z } from "zod";

export const authIdParamsSchema = z
  .object({
    id: z.string().trim().min(1)
  })
  .strict();

export const authBodySchema = z.object({}).strict();
export const authQuerySchema = z.object({}).strict();
