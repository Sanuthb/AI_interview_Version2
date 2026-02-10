import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";

/**
 * Interface for document parsing results
 */
export interface DocumentParseResult {
  text: string;
  mimeType: string;
  fileName: string;
}

/**
 * Centralized service to extract text from various document types (PDF, TXT, etc.)
 * This allows us to use AI models that don't support direct file input (like Groq)
 */
export class DocumentParser {
  /**
   * Extracts text from a File or Blob
   */
  static async extractText(file: File | Blob, fileName?: string): Promise<string> {
    const name = fileName || (file instanceof File ? file.name : 'document');
    const mimeType = file.type || this.getMimeTypeFromName(name);
    
    if (mimeType === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) {
      return this.parsePdf(file);
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (mimeType === 'text/plain' || name.toLowerCase().endsWith('.txt')) {
      return buffer.toString('utf-8');
    }

    // Fallback for other formats
    try {
      const text = buffer.toString('utf-8');
      if (text.includes('\u0000')) {
        throw new Error('Unsupported binary format');
      }
      return text;
    } catch (e) {
      console.warn(`Fallback text extraction failed for ${name}`);
      return buffer.toString('latin1');
    }
  }

  /**
   * Specifically handles PDF parsing using LangChain's WebPDFLoader
   */
  private static async parsePdf(file: File | Blob): Promise<string> {
    try {
      const loader = new WebPDFLoader(file, {
        parsedItemSeparator: " "
      });
      const docs = await loader.load();
      return docs.map((doc) => doc.pageContent).join("\n\n");
    } catch (error) {
      console.error('Error parsing PDF with LangChain:', error);
      throw new Error('Failed to extract text from PDF file');
    }
  }

  /**
   * Helper to guess MIME type if missing
   */
  private static getMimeTypeFromName(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'txt': return 'text/plain';
      case 'doc': return 'application/msword';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default: return 'application/octet-stream';
    }
  }
}
