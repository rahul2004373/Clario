export function cleanText(text: string): string {
  return text
    .replace(/\u0000/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Collapse 3 or more consecutive newlines down to 2 (preserves paragraph splits)
    .replace(/\n{3,}/g, "\n\n")
    // Collapse multiple horizontal spaces and tabs into a single space
    .replace(/[ \t]+/g, " ")
    .trim();
}
