const mongoose = require("mongoose");

const accessRequestSchema = new mongoose.Schema({
  // The signed-in member is the participant proposing a controlled use of their own demo record.
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  recipientName: { type: String, required: true, trim: true, maxlength: 100 },
  recipientOrganisation: { type: String, required: true, trim: true, maxlength: 120 },
  purpose: { type: String, enum: ["programme", "research", "ai"], required: true },
  // This prototype deliberately permits synthetic-demo scope only.
  scope: { type: String, enum: ["synthetic-demo"], default: "synthetic-demo", required: true },
  rationale: { type: String, required: true, trim: true, maxlength: 500 },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", required: true },
  reviewNote: { type: String, trim: true, maxlength: 500 },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: { type: Date }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.models.AccessRequest || mongoose.model("AccessRequest", accessRequestSchema);
