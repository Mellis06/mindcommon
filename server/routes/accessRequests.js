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

// Members can submit governance requests. The prototype accepts synthetic-demo scope only.
router.post("/", validateBody(accessRequestSchema), async (req, res, next) => {
  try {
    const accessRequest = await AccessRequest.create({
      submittedBy: req.user._id,
      ...req.validatedBody
    });
    await recordAudit({
      actorId: req.user._id,
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

    const accessRequest = await AccessRequest.findById(req.params.id);
    if (!accessRequest) return res.status(404).json({ error: "NOT_FOUND", message: "Access request not found." });
    if (accessRequest.status !== "pending") {
      return res.status(409).json({ error: "ALREADY_REVIEWED", message: "This request has already been reviewed." });
    }

    const { status, reviewNote } = req.validatedBody;
    if (status === "approved") {
      const latestConsent = await ConsentRecord.findOne({
        userId: accessRequest.submittedBy,
        purpose: accessRequest.purpose
      }).sort({ createdAt: -1 }).lean();

      if (!latestConsent || latestConsent.status !== "granted") {
        return res.status(409).json({
          error: "CONSENT_REQUIRED",
          message: "Approval is blocked because the latest purpose-specific consent record is not granted."
        });
      }
    }

    accessRequest.status = status;
    accessRequest.reviewNote = reviewNote;
    accessRequest.reviewedBy = req.user._id;
    accessRequest.reviewedAt = new Date();
    await accessRequest.save();

    await recordAudit({
      actorId: req.user._id,
      action: "access_request.reviewed",
      resourceType: "access_request",
      resourceId: accessRequest._id.toString(),
      details: { status, purpose: accessRequest.purpose }
    });

    res.json({ request: accessRequest });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
