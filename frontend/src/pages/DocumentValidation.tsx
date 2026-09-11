import { useState } from "react";
import {
  analyseDocument,
  type DocumentAnalysisResponse
} from "../services/documentService";

export default function DocumentValidation() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] =
    useState<DocumentAnalysisResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyse = async () => {
    if (!file) {
      setError("Please select a document first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const analysis = await analyseDocument(file);
      setResult(analysis);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">

      <div className="page-header">
        <div>
          <h2>AI Document Assessment</h2>

          <p>
            Upload a tender document for AI-assisted
            document extraction and validity screening.
          </p>
        </div>
      </div>

      <div className="card form-card">

        <div className="card-head">
          <div>
            <h3>Upload document</h3>

            <p>
              Supported formats: PDF, PNG, JPEG and WEBP.
            </p>
          </div>
        </div>

        <div style={{ padding: "20px" }}>

          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            onChange={(event) => {
              setFile(
                event.target.files?.[0] ?? null
              );
            }}
          />

          {file && (
            <div style={{ marginTop: "12px" }}>
              Selected:
              <strong> {file.name}</strong>
            </div>
          )}

          <div className="form-actions" style={{ marginTop: "20px" }}>
            <button
              className="button primary"
              onClick={handleAnalyse}
              disabled={loading}
            >
              {loading
                ? "Analysing document..."
                : "Analyse with AI"}
            </button>
          </div>

          {error && (
            <div
              className="notice"
              style={{
                marginTop: "18px",
                color: "#9b2c2c"
              }}
            >
              {error}
            </div>
          )}

        </div>
      </div>

      {result && (
        <div
          className="card"
          style={{
            marginTop: "20px"
          }}
        >

          <div className="card-head">
            <div>
              <h3>Assessment Result</h3>
              <p>
                {result.file.name}
              </p>
            </div>

            <span
              className={
                result.validation.status === "VALID"
                  ? "status-badge success"
                  : result.validation.status === "EXPIRED"
                    ? "status-badge"
                    : "status-badge"
              }
            >
              {result.validation.status}
            </span>
          </div>

          <div
            style={{
              padding: "20px",
              display: "grid",
              gap: "14px"
            }}
          >

            <div>
              <strong>Document Type</strong>
              <p>{result.document.documentType || "Not found"}</p>
            </div>

            <div>
              <strong>Company Name</strong>
              <p>{result.document.companyName || "Not found"}</p>
            </div>

            <div>
              <strong>Document Number</strong>
              <p>
                {result.document.documentNumber || "Not found"}
              </p>
            </div>

            <div>
              <strong>Issue Date</strong>
              <p>
                {result.document.issueDate || "Not found"}
              </p>
            </div>

            <div>
              <strong>Expiry Date</strong>
              <p>
                {result.document.expiryDate || "No expiry date found"}
              </p>
            </div>

            <div>
              <strong>Readability</strong>
              <p>
                {result.document.isDocumentReadable
                  ? "Readable"
                  : "Needs manual review"}
              </p>
            </div>

            <div>
              <strong>AI Assessment</strong>
              <p>
                {result.recommendation}
              </p>
            </div>

            {result.document.missingInformation.length > 0 && (
              <div>
                <strong>Missing Information</strong>

                <ul>
                  {result.document.missingInformation.map(
                    (item: string) => (
                      <li key={item}>{item}</li>
                    )
                  )}
                </ul>
              </div>
            )}

            {result.document.notes.length > 0 && (
              <div>
                <strong>AI Notes</strong>

                <ul>
                  {result.document.notes.map(
                    (note: string) => (
                      <li key={note}>{note}</li>
                    )
                  )}
                </ul>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}