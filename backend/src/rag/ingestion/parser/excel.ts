import XLSX from "xlsx";

export async function parseExcel(rawContentUrl: string | null): Promise<string> {
  if (!rawContentUrl) {
    throw new Error("rawContentUrl is required for excel sources");
  }

  const response = await fetch(encodeURI(rawContentUrl));
  if (!response.ok) {
    throw new Error(`Failed to fetch spreadsheet: HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const workbook = XLSX.read(Buffer.from(arrayBuffer), { type: "buffer" });
  const output: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    output.push(`Sheet: ${sheetName}`);
    output.push(csv);
  }

  return output.join("\n").trim();
}
