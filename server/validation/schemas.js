const { z } = require("zod");

const purposes = ["programme", "research", "ai"];

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128)
}).strict();

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128)
}).strict();

const consentSchema = z.object({
  purpose: z.enum(purposes),
  status: z.enum(["granted", "withdrawn"]),
  noticeVersion: z.string().trim().min(1).max(40)
}).strict();

const accessRequestSchema = z.object({
  recipientName: z.string().trim().min(2).max(100),
  recipientOrganisation: z.string().trim().min(2).max(120),
  purpose: z.enum(purposes),
  scope: z.literal("synthetic-demo"),
  rationale: z.string().trim().min(20).max(500)
}).strict();

const reviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewNote: z.string().trim().min(10).max(500)
}).strict();

module.exports = {
  purposes,
  registerSchema,
  loginSchema,
  consentSchema,
  accessRequestSchema,
  reviewSchema
};
