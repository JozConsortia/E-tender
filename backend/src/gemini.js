import { GoogleGenAI } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const documentSchema = {
  type: "object",
  properties: {
    documentType: {
      type: "string"
    },
    companyName: {
      type: "string"
    },
    documentNumber: {
      type: "string"
    },
    issueDate: {
      type: "string"
    },
    expiryDate: {
      type: "string"
    },
    registrationDetails: {
      type: "string"
    },
    isDocumentReadable: {
      type: "boolean"
    },
    appearsAuthentic: {
      type: "boolean"
    },
    extractedRequirements: {
      type: "array",
      items: {
        type: "string"
      }
    },
    missingInformation: {
      type: "array",
      items: {
        type: "string"
      }
    },
    notes: {
      type: "array",
      items: {
        type: "string"
      }
    }
  },
  required: [
    "documentType",
    "companyName",
    "documentNumber",
    "issueDate",
    "expiryDate",
    "registrationDetails",
    "isDocumentReadable",
    "appearsAuthentic",
    "extractedRequirements",
    "missingInformation",
    "notes"
  ]
};

export async function analyseDocument(file) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const base64Data = file.buffer.toString("base64");

  const prompt = `
You are an AI document assessment assistant for an electronic government
tender management system.

Analyse the uploaded tender document carefully.

Extract:
1. Document type.
2. Company or organisation name.
3. Document/reference number.
4. Issue date.
5. Expiry date.
6. Registration or certificate details.
7. Important requirements or information contained in the document.
8. Any information that appears to be missing.
9. Whether the document is readable.
10. Whether the document appears internally consistent and legitimate.

IMPORTANT:
- Do not invent information.
- If a value cannot be found, return an empty string.
- Dates must be returned in YYYY-MM-DD format whenever possible.
- If the document has no expiry date, return an empty string.
- Do not make a final legal or procurement award decision.
- This is an AI-assisted document extraction and screening step.
`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        inlineData: {
          mimeType: file.mimetype,
          data: base64Data
        }
      },
      {
        text: prompt
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: documentSchema
    }
  });

  const raw = response.text;

  if (!raw) {
    throw new Error("Gemini returned an empty response.");
  }

  return JSON.parse(raw);
}