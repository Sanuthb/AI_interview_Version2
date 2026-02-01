import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";

export async function parseResume(blob: Blob): Promise<string> {
  try {
    const loader = new WebPDFLoader(blob, {
        parsedItemSeparator: " "
    });
    const docs = await loader.load();
    return docs.map((doc) => doc.pageContent).join("\n\n");
  } catch (error) {
    console.error("Error parsing resume with LangChain:", error);
    throw new Error("Failed to parse resume PDF");
  }
}
