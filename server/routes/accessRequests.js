const express = require("express");
const AccessRequest = require("../models/AccessRequest");
const ConsentRecord = require("../models/ConsentRecord");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { accessRequestSchema, reviewSchema } = require("../validation/schemas");
const { recordAudit } = require("../services/audit");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const filter = ["reviewer", "admin"].includes(req.user.role)
      ? {}
      : { submittedBy: req.user._id };
    const requests = await AccessRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate("submittedBy", "name email role")
      .populate("reviewedBy", "name email")
      .lean();
    res.json({ requests });
  } catch (error) {
    next(error);
  }
});

// A member proposes sharing their own synthetic demo record with a named recipient.
router.post("/", validateBody(accessRequestSchema), async (req, res, next) => {
  try {
    const accessRequest = await AccessRequest.create({
      submittedBy: req.user._id,
      ...req.validatedBody
    });
    await recordAudit({
      actorId: req.user._id,
      subjectId: req.user._id,
      action: "access_request.submitted",
      resourceType: "access_request",
      resourceId: accessRequest._id.toString(),
      details: { purpose: accessRequest.purpose, scope: accessRequest.scope }
    });
    res.status(201).json({ request: accessRequest });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/review", requireRole("reviewer", "admin"), validateBody(reviewSchema), async (req, res, next) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ error: "INVALID_ID", message: "The request ID is invalid." });
    }

    const existing = await AccessRequest.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: "NOT_FOUND", message: "Access request not found." });
    if (existing.submittedBy.toString() === req.user._id.toString()) {
      return res.status(403).json({ error: "SELF_REVIEW_BLOCKED", message: "A reviewer cannot review their own request." });
    }
    if (existing.status !== "pending") {
      return res.status(409).json({ error: "ALREADY_REVIEWED", message: "This request has already been reviewed." });
    }

    const { status, reviewNote } = req.validatedBody;
    if (status === "approved") {
      const latestConsent = await ConsentRecord.findOne({
        userId: existing.submittedBy,
        purpose: existing.purpose
      }).sort({ createdAt: -1 }).lean();

      if (!latestConsent || latestConsent.status !== "granted") {
        return res.status(409).json({
          error: "CONSENT_REQUIRED",
          message: "Approval is blocked because the latest purpose-specific consent record is not granted."
        });
      }
    }

    // Conditional update ensures only one concurrent reviewer can decide a pending request.
    const reviewed = await AccessRequest.findOneAndUpdate(
      { _id: existing._id, status: "pending" },
      {
        $set: {
          status,
          reviewNote,
          reviewedBy: req.user._id,
          reviewedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!reviewed) {
      return res.status(409).json({ error: "ALREADY_REVIEWED", message: "Another reviewer has already decided this request." });
    }

    await recordAudit({
      actorId: req.user._id,
      subjectId: reviewed.submittedBy,
      action: "access_request.reviewed",
      resourceType: "access_request",
      resourceId: reviewed._id.toString(),
      details: { status, purpose: reviewed.purpose }
    });

    res.json({ request: reviewed });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
