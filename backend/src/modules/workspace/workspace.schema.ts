import { z } from "zod";

export const workspaceIdParamsSchema = z
  .object({
    id: z.string().trim().min(1)
  })
  .strict();

export const workspaceBodySchema = z.object({}).strict();
export const workspaceQuerySchema = z.object({}).strict();
