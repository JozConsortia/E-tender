import { TOKEN_KEY } from '../api'

export type DocumentAnalysisResponse = {
  success: boolean;
  file: {
    name: string;
    type: string;
    size: number;
  };
  document: {
    documentType: string;
    companyName: string;
    documentNumber: string;
    issueDate: string;
    expiryDate: string;
    registrationDetails: string;
    isDocumentReadable: boolean;
    appearsAuthentic: boolean;
    extractedRequirements: string[];
    missingInformation: string[];
    notes: string[];
  };
  validation: {
    hasExpiryDate: boolean;
    isExpired: boolean;
    status: 'VALID' | 'EXPIRED' | 'NO_EXPIRY_DATE' | 'INVALID_DATE';
  };
  recommendation: string;
};

export async function analyseDocument(file: File): Promise<DocumentAnalysisResponse> {
  const formData = new FormData();
  formData.append('document', file);

  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/documents/analyse`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  const data = (await response.json().catch(() => ({}))) as Partial<DocumentAnalysisResponse> & { message?: string };

  if (!response.ok) {
    throw new Error(data.message || 'Document analysis failed.');
  }

  return data as DocumentAnalysisResponse;
}
