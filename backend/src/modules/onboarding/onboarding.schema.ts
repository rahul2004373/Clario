import { z } from "zod";

export const onboardingIdParamsSchema = z
  .object({
    id: z.string().trim().min(1)
  })
  .strict();

export const onboardingBodySchema = z.object({}).strict();
export const onboardingQuerySchema = z.object({}).strict();
