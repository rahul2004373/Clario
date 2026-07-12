import { formatError } from "../../utils/error";
import { Request, Response } from "express";
import { WorkspaceService } from "./workspace.service";

export const listWorkspaces = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const workspaces = await WorkspaceService.listWorkspaces(userId);
    res.json({ workspaces });
  } catch (error: any) {
    res.status(500).json({ error: formatError(error) });
  }
};

export const createWorkspace = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, businessType } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "Workspace name is required" });
    }

    const workspace = await WorkspaceService.createWorkspace(userId, { name, businessType });
    res.status(201).json({ workspace });
  } catch (error: any) {
    res.status(500).json({ error: formatError(error) });
  }
};

export const getWorkspace = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { workspaceId } = req.params;
    const workspace = await WorkspaceService.getWorkspace(workspaceId as string, userId);
    res.json({ workspace });
  } catch (error: any) {
    res.status(403).json({ error: formatError(error) });
  }
};

export const updateWorkspace = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { workspaceId } = req.params;
    const data = req.body;

    const workspace = await WorkspaceService.updateWorkspace(workspaceId as string, userId, data);
    res.json({ workspace });
  } catch (error: any) {
    res.status(403).json({ error: formatError(error) });
  }
};

export const deleteWorkspace = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { workspaceId } = req.params;

    await WorkspaceService.deleteWorkspace(workspaceId as string, userId);
    res.json({ message: "Workspace deleted successfully" });
  } catch (error: any) {
    res.status(403).json({ error: formatError(error) });
  }
};
