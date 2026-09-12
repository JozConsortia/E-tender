import { useState } from "react";
import {
  analyseDocument,
  type DocumentAnalysisResponse
} from "../services/documentService";

const VERDICT_STYLES: Record<string, { badge: string; label: string; banner: string }> = {
  GENUINE: { badge: "status-badge success", label: "Genuine", banner: "success-box" },
  LIKELY_FAKE: { badge: "status-badge danger", label: "Likely fake", banner: "error-box" },
  UNREADABLE: { badge: "status-badge warning", label: "Unreadable", banner: "notice warning" },
  EXPIRED: { badge: "status-badge warning", label: "Expired", banner: "notice warning" },
  MANUAL_REVIEW: { badge: "status-badge warning", label: "Manual review", banner: "notice warning" }
};

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

  const verdict = result ? (VERDICT_STYLES[result.validation.status] ?? VERDICT_STYLES.MANUAL_REVIEW) : null;

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

      {result && verdict && (
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

            <span className={verdict.badge}>
              {verdict.label}
            </span>
          </div>

          <div
            style={{
              padding: "20px",
              display: "grid",
              gap: "14px"
            }}
          >

            <div className={verdict.banner}>
              {result.summary}
            </div>

            <div>
              <strong>Authenticity</strong>
              <p>{result.validation.appearsAuthentic ? "Appears authentic" : "Does not appear authentic — treat as fake unless independently verified"}</p>
            </div>

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
                {result.validation.isReadable
                  ? "Readable"
                  : "Needs manual review"}
              </p>
            </div>

            <div>
              <strong>AI Recommendation</strong>
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
