import type { ParsedDocument } from "../../types";

export async function parsePdf(rawContentUrl: string | null): Promise<ParsedDocument[]> {
  if (!rawContentUrl) {
    throw new Error("rawContentUrl is required for pdf sources");
  }

  const response = await fetch(encodeURI(rawContentUrl));
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const pdfParseMod = require("pdf-parse");
  
  function render_page(pageData: any) {
    let render_options = {
        normalizeWhitespace: false,
        disableCombineTextItems: false
    };
    return pageData.getTextContent(render_options).then(function(textContent: any) {
        let lastY, text = '';
        for (let item of textContent.items) {
            if (lastY == item.transform[5] || !lastY){
                text += item.str;
            } else {
                text += '\n' + item.str;
            }    
            lastY = item.transform[5];
        }
        return `___PAGE_START_${pageData.pageIndex + 1}___\n` + text;
    });
  }

  let result;
  const parseOptions = { pagerender: render_page };
  
  if (pdfParseMod.PDFParse) {
    const parser = new pdfParseMod.PDFParse({ data: Buffer.from(arrayBuffer) });
    await parser.load();
    result = await parser.getText(parseOptions);
  } else {
    // Fallback for pdf-parse v1
    let pdfParse = pdfParseMod;
    if (typeof pdfParse !== "function" && pdfParse.default) {
      pdfParse = pdfParse.default;
    }
    result = await pdfParse(Buffer.from(arrayBuffer), parseOptions);
  }
  
  const rawText = result.text || "";
  const pages = rawText.split(/___PAGE_START_(\d+)___\n/g);
  
  const documents: ParsedDocument[] = [];
  // pages array looks like: ["", "1", "page 1 content", "2", "page 2 content", ...]
  for (let i = 1; i < pages.length; i += 2) {
    const pageNumber = parseInt(pages[i], 10);
    const content = pages[i + 1] || "";
    if (content.trim()) {
      documents.push({
        text: content,
        metadata: { pageNumber }
      });
    }
  }
  
  if (documents.length === 0 && rawText.trim()) {
     return [{ text: rawText.trim() }];
  }
  
  return documents;
}
