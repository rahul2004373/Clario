import { z } from "zod";

export const apikeyIdParamsSchema = z
  .object({
    id: z.string().trim().min(1)
  })
  .strict();

export const apikeyBodySchema = z.object({}).strict();
export const apikeyQuerySchema = z.object({}).strict();
