export async function parseText(rawContentUrl: string | null, rawText?: string | null): Promise<string> {
  if (typeof rawText === "string" && rawText.trim().length > 0) {
    return rawText.trim();
  }

  if (!rawContentUrl) {
    throw new Error("rawContentUrl or rawText is required for text sources");
  }

  const response = await fetch(rawContentUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch text content: HTTP ${response.status}`);
  }

  return (await response.text()).trim();
}

export async function parseUrl(url: string | null): Promise<string> {
  if (!url) {
    throw new Error("rawContentUrl is required for url sources");
  }

  const jinaUrl = `https://r.jina.ai/${url}`;
  
  let response = await fetch(jinaUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL content via Jina Reader: HTTP ${response.status}`);
  }

  const content = await response.text();

  if (!content || content.trim().length === 0) {
    throw new Error("Parsed content is empty. This could be because the URL points to a completely empty page or blocked access.");
  }

  return content.trim();
}
