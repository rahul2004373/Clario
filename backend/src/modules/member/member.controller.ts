import { formatError } from "../../utils/error";
import { Request, Response } from "express";
import { MemberService } from "./member.service";
import { WorkspaceMemberRole } from "@prisma/client";

export const listMembers = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { workspaceId } = req.params;
    const members = await MemberService.listMembers(workspaceId as string, userId);
    res.json({ members });
  } catch (error: any) {
    res.status(403).json({ error: formatError(error) });
  }
};

export const inviteMember = async (req: Request, res: Response) => {
  try {
    const inviterId = req.user!.id;
    const { workspaceId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const member = await MemberService.inviteMember(workspaceId as string, inviterId, email);
    res.status(201).json({ message: "Member invited", member });
  } catch (error: any) {
    res.status(400).json({ error: formatError(error) });
  }
};

export const changeRole = async (req: Request, res: Response) => {
  try {
    const requesterId = req.user!.id;
    const { workspaceId, memberId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: "Role is required" });
    }

    const member = await MemberService.changeRole(workspaceId as string, requesterId, memberId as string, role as WorkspaceMemberRole);
    res.json({ message: "Role updated", member });
  } catch (error: any) {
    res.status(400).json({ error: formatError(error) });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    const requesterId = req.user!.id;
    const { workspaceId, memberId } = req.params;

    await MemberService.removeMember(workspaceId as string, requesterId, memberId as string);
    res.json({ message: "Member removed" });
  } catch (error: any) {
    res.status(400).json({ error: formatError(error) });
  }
};
