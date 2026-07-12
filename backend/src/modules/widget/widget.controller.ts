import { Request, Response } from "express";
import { WidgetService } from "./widget.service";

export const getWidgetConfig = async (req: Request, res: Response) => {
  try {
    const chatbotId = req.params.chatbotId as string;
    const config = await WidgetService.getWidgetConfig(chatbotId);
    res.json(config);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const updateWidgetConfig = async (req: Request, res: Response) => {
  try {
    const chatbotId = req.params.chatbotId as string;
    const updated = await WidgetService.updateWidgetConfig(chatbotId, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const activateWidget = async (req: Request, res: Response) => {
  try {
    const chatbotId = req.params.chatbotId as string;
    const { isActive } = req.body;
    
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ error: "isActive must be a boolean" });
    }

    const updated = await WidgetService.activateWidget(chatbotId, isActive);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getEmbedCode = async (req: Request, res: Response) => {
  try {
    const chatbotId = req.params.chatbotId as string;
    const result = await WidgetService.getEmbedCode(chatbotId);
    res.json(result);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const getPublicWidgetConfig = async (req: Request, res: Response) => {
  try {
    const embedPublicKey = req.params.embedPublicKey as string;
    
    if (!embedPublicKey) {
      return res.status(400).json({ error: "embedPublicKey is required" });
    }

    const config = await WidgetService.getPublicWidgetConfig(embedPublicKey);
    
    // We can return 200 with { isActive: false } and let the frontend handle it
    res.json(config);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};
