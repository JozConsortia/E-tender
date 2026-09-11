import express from "express";
import multer from "multer";
import { analyseDocument } from "../gemini.js";

const router = express.Router();

const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp"
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(
        new Error(
          "Only PDF, PNG, JPEG and WEBP documents are supported."
        )
      );
    }

    cb(null, true);
  }
});

function validateExpiry(expiryDate) {
  if (!expiryDate) {
    return {
      hasExpiryDate: false,
      isExpired: false,
      status: "NO_EXPIRY_DATE"
    };
  }

  const expiry = new Date(`${expiryDate}T23:59:59`);
  const today = new Date();

  if (Number.isNaN(expiry.getTime())) {
    return {
      hasExpiryDate: true,
      isExpired: false,
      status: "INVALID_DATE"
    };
  }

  return {
    hasExpiryDate: true,
    isExpired: expiry < today,
    status: expiry < today ? "EXPIRED" : "VALID"
  };
}

const KNOWN_DOCUMENT_TYPES = [
  ["company registration", "Company Registration"],
  ["cipc", "Company Registration"],
  ["tax", "Tax Compliance Certificate"],
  ["bbbee", "B-BBEE Certificate"],
  ["b-bbee", "B-BBEE Certificate"],
  ["bee", "B-BBEE Certificate"],
  ["financial", "Financial Proposal"],
  ["technical", "Technical Proposal"],
  ["proposal", "Proposal"],
  ["bank", "Bank Confirmation Letter"],
  ["cv", "Curriculum Vitae"]
];

// Filename-based screening used when no Gemini key is configured, so the
// assessment page stays usable without external credentials.
function screenDocumentOffline(file) {
  const name = file.originalname.toLowerCase();
  const match = KNOWN_DOCUMENT_TYPES.find(([keyword]) => name.includes(keyword));

  return {
    documentType: match ? match[1] : "",
    companyName: "",
    documentNumber: "",
    issueDate: "",
    expiryDate: "",
    registrationDetails: "",
    isDocumentReadable: file.size > 0,
    appearsAuthentic: false,
    extractedRequirements: [],
    missingInformation: [
      "Company name",
      "Document number",
      "Issue date",
      "Expiry date"
    ],
    notes: [
      "GEMINI_API_KEY is not configured, so the document content was not read.",
      match
        ? `The filename suggests a ${match[1]}.`
        : "The document type could not be determined from the filename.",
      "A procurement official must review this document manually."
    ]
  };
}

router.post("/analyse", (req, res) => {
  upload.single("document")(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        success: false,
        message: uploadError.message || "The document could not be uploaded."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No document was uploaded."
      });
    }

    try {
      const usedAi = Boolean(process.env.GEMINI_API_KEY);
      const analysis = usedAi
        ? await analyseDocument(req.file)
        : screenDocumentOffline(req.file);

      const expiryCheck = validateExpiry(analysis.expiryDate);

      return res.json({
        success: true,
        assessedBy: usedAi ? "GEMINI" : "FILENAME_SCREENING",

        file: {
          name: req.file.originalname,
          type: req.file.mimetype,
          size: req.file.size
        },

        document: analysis,

        validation: expiryCheck,

        recommendation:
          expiryCheck.status === "EXPIRED"
            ? "REVIEW_REQUIRED"
            : expiryCheck.status === "VALID"
              ? "DOCUMENT_VALID"
              : "MANUAL_REVIEW"
      });
    } catch (error) {
      console.error("Document analysis error:", error);

      return res.status(502).json({
        success: false,
        message: error.message || "Document analysis failed."
      });
    }
  });
});

export default router;
