import { Request, Response } from "express";
import { SourcesService } from "./sources.service";
import { supabaseAdmin } from "../../lib/supabase";
import { env } from "../../config/env";
import { formatError } from "../../utils/error";
import { SourceType } from "@prisma/client";

export const uploadFileSource = async (req: Request, res: Response) => {
  try {
    const { chatbotId } = req.params;
    const file = req.file;
    const name = req.body.name || file?.originalname;

    if (!file || !name) {
      return res.status(400).json({ error: "File and name are required" });
    }

    // Map mimetype to Prisma SourceType
    let type: SourceType = SourceType.TXT;
    const mime = file.mimetype;
    if (mime.includes("pdf")) type = SourceType.PDF;
    else if (mime.includes("word") || mime.includes("docx")) type = SourceType.DOCX;
    else if (mime.includes("excel") || mime.includes("spreadsheet") || mime.includes("xlsx")) type = SourceType.XLSX;
    else if (mime.includes("csv")) type = SourceType.CSV;
    else type = SourceType.TXT;

    // Upload to Supabase Storage
    const bucket = env.SUPABASE_STORAGE_BUCKET || "rag-files";
    const fileExt = file.originalname.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload file to Supabase: ${uploadError.message}`);
    }

    // Get public URL or signed URL (assuming public for simplicity, but could be signed)
    const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);
    const fileUrl = publicUrlData.publicUrl;

    const source = await SourcesService.createSource(chatbotId as string, {
      name,
      type, 
      fileUrl,
      fileSize: file.size
    });

    res.status(201).json({ message: "File source created and ingestion started", source });
  } catch (error: any) {
    res.status(400).json({ error: formatError(error) });
  }
};

export const createUrlSource = async (req: Request, res: Response) => {
  try {
    const { chatbotId } = req.params;
    const { name, sourceUrl } = req.body;

    if (!name || !sourceUrl) {
      return res.status(400).json({ error: "Name and sourceUrl are required" });
    }

    const source = await SourcesService.createSource(chatbotId as string, {
      name,
      type: SourceType.URL,
      sourceUrl
    });

    res.status(201).json({ message: "URL source created and ingestion started", source });
  } catch (error: any) {
    res.status(400).json({ error: formatError(error) });
  }
};

export const createTextSource = async (req: Request, res: Response) => {
  try {
    const { chatbotId } = req.params;
    const { name, content } = req.body;

    if (!name || !content) {
      return res.status(400).json({ error: "Name and content are required" });
    }

    // Upload content to Supabase Storage as a .txt file
    const bucket = env.SUPABASE_STORAGE_BUCKET || "rag-files";
    const fileName = `text-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.txt`;
    const fileBuffer = Buffer.from(content, 'utf-8');

    const { error: uploadError } = await supabaseAdmin
      .storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType: "text/plain",
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload text content to Supabase: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);
    const fileUrl = publicUrlData.publicUrl;

    const source = await SourcesService.createSource(chatbotId as string, {
      name,
      type: SourceType.PLAIN_TEXT,
      fileUrl,
      fileSize: fileBuffer.length
    });

    res.status(201).json({ message: "Text source created and ingestion started", source });
  } catch (error: any) {
    res.status(400).json({ error: formatError(error) });
  }
};

export const listSources = async (req: Request, res: Response) => {
  try {
    const { chatbotId } = req.params;
    const sources = await SourcesService.listSources(chatbotId as string);
    res.json({ sources });
  } catch (error: any) {
    res.status(400).json({ error: formatError(error) });
  }
};

export const getSource = async (req: Request, res: Response) => {
  try {
    const { chatbotId, sourceId } = req.params;
    const source = await SourcesService.getSource(sourceId as string, chatbotId as string);
    res.json({ source });
  } catch (error: any) {
    res.status(404).json({ error: formatError(error) });
  }
};

export const updateSource = async (req: Request, res: Response) => {
  try {
    const { chatbotId, sourceId } = req.params;
    const data = req.body;

    const source = await SourcesService.updateSource(sourceId as string, chatbotId as string, data);
    res.json({ message: "Source updated", source });
  } catch (error: any) {
    res.status(400).json({ error: formatError(error) });
  }
};

export const deleteSource = async (req: Request, res: Response) => {
  try {
    const { chatbotId, sourceId } = req.params;
    const result = await SourcesService.deleteSource(sourceId as string, chatbotId as string);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: formatError(error) });
  }
};

export const triggerReingest = async (req: Request, res: Response) => {
  try {
    const { chatbotId, sourceId } = req.params;
    const result = await SourcesService.triggerReingest(sourceId as string, chatbotId as string);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: formatError(error) });
  }
};

export const deleteChunk = async (req: Request, res: Response) => {
  try {
    const { chatbotId, sourceId, chunkId } = req.params;
    const result = await SourcesService.deleteChunk(sourceId as string, chatbotId as string, chunkId as string);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: formatError(error) });
  }
};

export const listJobs = async (req: Request, res: Response) => {
  try {
    const { chatbotId } = req.params;
    const jobs = await SourcesService.listJobs(chatbotId as string);
    res.json({ jobs });
  } catch (error: any) {
    res.status(400).json({ error: formatError(error) });
  }
};

export const getJob = async (req: Request, res: Response) => {
  try {
    const { chatbotId, jobId } = req.params;
    const job = await SourcesService.getJob(jobId as string, chatbotId as string);
    res.json({ job });
  } catch (error: any) {
    res.status(404).json({ error: formatError(error) });
  }
};
