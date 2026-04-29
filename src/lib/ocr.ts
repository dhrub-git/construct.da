import { Mistral } from "@mistralai/mistralai";
import { get } from "@vercel/blob";
import { streamToBase64 } from "./utils";

const apiKey = process.env.MISTRAL_AI_KEY;

if (!apiKey) {
  throw new Error("MISTRAL_AI_KEY is not set in the environment variables.");
}

export async function processPDFWithMistral(pdfLink: string) {
  const client = new Mistral({ apiKey });

  try {
    const pdfFile = await get(pdfLink, { 
        access: "private",
    });

    if (!pdfFile || pdfFile?.statusCode !== 200) {
      throw new Error(`Failed to fetch PDF. Status code: ${pdfFile?.statusCode}`);
    }
    // Convert to base64 string
    const base64 = await streamToBase64(pdfFile.stream);
    
    const response = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: "document_url",
        documentUrl: `data:application/pdf;base64,${base64}`
      },
      includeImageBase64: false,
    });

    return response;
  } catch (error) {
    console.error("Mistral OCR failed:", error);
    throw error;
  }
}