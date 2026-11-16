const mongoose = require("mongoose");

const accessRequestSchema = new mongoose.Schema({
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  requesterName: { type: String, required: true, trim: true, maxlength: 100 },
  organisation: { type: String, required: true, trim: true, maxlength: 120 },
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
