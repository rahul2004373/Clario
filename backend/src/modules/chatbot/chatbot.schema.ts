import { z } from "zod";

export const chatbotIdParamsSchema = z
  .object({
    id: z.string().trim().min(1)
  })
  .strict();

export const chatbotBodySchema = z.object({}).strict();
export const chatbotQuerySchema = z.object({}).strict();
