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

      const expiryCheck = validateExpiry(
        analysis.expiryDate
      );

      const result = {
        success: true,

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