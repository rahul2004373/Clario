import mammoth from "mammoth";

export async function parseDoc(rawContentUrl: string | null): Promise<string> {
  if (!rawContentUrl) {
    throw new Error("rawContentUrl is required for doc/docx sources");
  }

  const response = await fetch(encodeURI(rawContentUrl));
  if (!response.ok) {
    throw new Error(`Failed to fetch document: HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}
