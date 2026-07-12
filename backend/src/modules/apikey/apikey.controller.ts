import { formatError } from "../../utils/error";
import { Request, Response } from "express";
import { ApiKeyService } from "./apikey.service";
import { ApiKeyScope } from "@prisma/client";

export const listApiKeys = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { workspaceId } = req.params;
    const keys = await ApiKeyService.listApiKeys(workspaceId as string, userId);
    res.json({ keys });
  } catch (error: any) {
    res.status(403).json({ error: formatError(error) });
  }
};

export const createApiKey = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { workspaceId } = req.params;
    const { name, scope } = req.body;

    if (!name) {
      return res.status(400).json({ error: "API key name is required" });
    }

    const apiKey = await ApiKeyService.createApiKey(workspaceId as string, userId, name, scope as ApiKeyScope);
    res.status(201).json({ message: "API key created", apiKey });
  } catch (error: any) {
    res.status(400).json({ error: formatError(error) });
  }
};

export const updateApiKey = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { workspaceId, keyId } = req.params;
    const { name, scope } = req.body;

    if (!name && !scope) {
      return res.status(400).json({ error: "Provide a name or scope to update" });
    }

    const apiKey = await ApiKeyService.updateApiKey(workspaceId as string, userId, keyId as string, name, scope as ApiKeyScope);
    res.json({ message: "API key updated", apiKey });
  } catch (error: any) {
    res.status(400).json({ error: formatError(error) });
  }
};

export const revokeApiKey = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { workspaceId, keyId } = req.params;

    const result = await ApiKeyService.revokeApiKey(workspaceId as string, userId, keyId as string);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: formatError(error) });
  }
};
