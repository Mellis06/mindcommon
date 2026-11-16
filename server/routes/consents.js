const express = require("express");
const ConsentRecord = require("../models/ConsentRecord");
const { requireAuth } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { consentSchema } = require("../validation/schemas");
const { recordAudit } = require("../services/audit");

const router = express.Router();
router.use(requireAuth);

router.get("/me", async (req, res, next) => {
  try {
    const records = await ConsentRecord.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ records });
  } catch (error) {
    next(error);
  }
});

// Consent changes are versioned by appending a new record; prior records are not overwritten.
router.post("/", validateBody(consentSchema), async (req, res, next) => {
  try {
    const record = await ConsentRecord.create({
      userId: req.user._id,
      ...req.validatedBody
    });
    await recordAudit({
      actorId: req.user._id,
      action: "consent.recorded",
      resourceType: "consent",
      resourceId: record._id.toString(),
      details: {
        purpose: record.purpose,
        status: record.status,
        noticeVersion: record.noticeVersion
      }
    });
    res.status(201).json({ record });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
