import path from "path";

export async function extractText(buffer: Buffer, originalName: string): Promise<string> {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === ".txt") {
    return buffer.toString("utf-8");
  }

  if (ext === ".pdf") {
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      return data.text;
    } catch (err) {
      console.error("PDF 解析失敗:", err);
      return "[PDF 解析失敗，請確認檔案格式]";
    }
  }

  if (ext === ".doc" || ext === ".docx") {
    try {
      const text = buffer
        .toString("utf-8")
        .replace(/[^\x20-\x7E\u4e00-\u9fff\u3000-\u303f\uff00-\uffef\n\r]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return text || "[無法提取文字內容]";
    } catch {
      return "[文件解析失敗]";
    }
  }

  return "[不支援的檔案格式]";
}
