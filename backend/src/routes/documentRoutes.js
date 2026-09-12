import express from "express";
import multer from "multer";
import { analyseDocument } from "../gemini.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Only PDF, PNG, JPEG and WEBP documents are supported."
        )
      );
    }

    cb(null, true);
  }
});

function checkExpiry(expiryDate) {
  if (!expiryDate) {
    return { hasExpiryDate: false, isExpired: false, status: "NO_EXPIRY_DATE" };
  }

  const expiry = new Date(`${expiryDate}T23:59:59`);
  const today = new Date();

  if (Number.isNaN(expiry.getTime())) {
    return { hasExpiryDate: true, isExpired: false, status: "INVALID_DATE" };
  }

  return {
    hasExpiryDate: true,
    isExpired: expiry < today,
    status: expiry < today ? "EXPIRED" : "VALID"
  };
}

// Combines Gemini's authenticity/readability judgement with the rule-based expiry
// check into a single overall verdict, so a fake document is unmistakably flagged
// and a genuine one (even without an expiry date, e.g. a certificate of incorporation)
// is reported as such rather than as an ambiguous "manual review".
function buildVerdict(analysis, expiryCheck) {
  const appearsAuthentic = analysis.appearsAuthentic !== false;
  const isReadable = analysis.isDocumentReadable !== false;

  if (!appearsAuthentic) {
    return {
      status: "LIKELY_FAKE",
      recommendation: "REJECTED",
      summary: "This document does not appear to be authentic. Do not accept it as valid evidence without further verification."
    };
  }
  if (!isReadable) {
    return {
      status: "UNREADABLE",
      recommendation: "MANUAL_REVIEW",
      summary: "The document could not be read clearly enough for AI screening. A human reviewer should inspect the original file."
    };
  }
  if (expiryCheck.status === "EXPIRED") {
    return {
      status: "EXPIRED",
      recommendation: "REVIEW_REQUIRED",
      summary: "The document appears genuine but has expired. Request an updated version before relying on it."
    };
  }
  if (expiryCheck.status === "INVALID_DATE") {
    return {
      status: "MANUAL_REVIEW",
      recommendation: "MANUAL_REVIEW",
      summary: "The document appears genuine but its expiry date could not be parsed. A human reviewer should confirm validity."
    };
  }
  return {
    status: "GENUINE",
    recommendation: "DOCUMENT_VALID",
    summary: expiryCheck.hasExpiryDate
      ? "This document appears authentic, readable, and currently valid."
      : "This document appears authentic and readable. It has no expiry date to check (normal for documents such as certificates of incorporation)."
  };
}

router.post(
  "/analyse",
  upload.single("document"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No document was uploaded."
        });
      }

      const analysis = await analyseDocument(req.file);
      const expiryCheck = checkExpiry(analysis.expiryDate);
      const verdict = buildVerdict(analysis, expiryCheck);

      const result = {
        success: true,

        file: {
          name: req.file.originalname,
          type: req.file.mimetype,
          size: req.file.size
        },

        document: analysis,

        validation: {
          ...expiryCheck,
          status: verdict.status,
          appearsAuthentic: analysis.appearsAuthentic !== false,
          isReadable: analysis.isDocumentReadable !== false
        },

        recommendation: verdict.recommendation,
        summary: verdict.summary
      };

      res.json(result);
    } catch (error) {
      console.error("Document analysis error:", error);

      res.status(500).json({
        success: false,
        message:
          error.message || "Document analysis failed."
      });
    }
  }
);

export default router;