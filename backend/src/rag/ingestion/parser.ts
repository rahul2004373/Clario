import type { ParsedDocument, SourceType } from "../types";
import { parseDoc } from "./parser/doc";
import { parseExcel } from "./parser/excel";
import { parsePdf } from "./parser/pdf";
import { parseText, parseUrl } from "./parser/text";

export interface ParseInput {
  type: SourceType;
  rawContentUrl: string | null;
  rawText?: string | null;
}

export async function parseSource(input: ParseInput): Promise<ParsedDocument[]> {
  switch (input.type) {
    case "text":
      return [{ text: await parseText(input.rawContentUrl, input.rawText) }];
    case "doc":
    case "docx":
      return [{ text: await parseDoc(input.rawContentUrl) }];
    case "excel":
    case "xlsx":
      return [{ text: await parseExcel(input.rawContentUrl) }];
    case "pdf":
      return parsePdf(input.rawContentUrl);
    case "url":
      return [{ text: await parseUrl(input.rawContentUrl) }];
    default:
      throw new Error(`Unsupported source type: ${input.type}`);
  }
}
