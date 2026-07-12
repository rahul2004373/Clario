import { Router } from "express";
import { requireAuth, requireWorkspaceRole } from "../auth/auth.middleware";
import { WorkspaceMemberRole } from "@prisma/client";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
import {
  uploadFileSource,
  createUrlSource,
  createTextSource,
  listSources,
  getSource,
  updateSource,
  deleteSource,
  triggerReingest,
  deleteChunk,
  listJobs,
  getJob
} from "./sources.controller";

export const sourcesRouter = Router({ mergeParams: true });

sourcesRouter.use(requireAuth);

// Create / Ingest
sourcesRouter.post("/upload", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN]), upload.single("file"), uploadFileSource);
sourcesRouter.post("/url", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN]), createUrlSource);
sourcesRouter.post("/text", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN]), createTextSource);

// Read Jobs
sourcesRouter.get("/jobs", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN, WorkspaceMemberRole.VIEWER]), listJobs);
sourcesRouter.get("/jobs/:jobId", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN, WorkspaceMemberRole.VIEWER]), getJob);

// Read Sources
sourcesRouter.get("/", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN, WorkspaceMemberRole.VIEWER]), listSources);
sourcesRouter.get("/:sourceId", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN, WorkspaceMemberRole.VIEWER]), getSource);

// Update / Reingest
sourcesRouter.patch("/:sourceId", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN]), updateSource);
sourcesRouter.post("/:sourceId/reingest", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN]), triggerReingest);

// Delete
sourcesRouter.delete("/:sourceId/chunks/:chunkId", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN]), deleteChunk);
sourcesRouter.delete("/:sourceId", requireWorkspaceRole([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN]), deleteSource);
