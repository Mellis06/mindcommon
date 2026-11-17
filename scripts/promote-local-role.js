require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../server/models/User");

async function main() {
  const environment = process.env.NODE_ENV || "development";
  if (environment === "production") {
    throw new Error("This local helper cannot run in production.");
  }
  if (process.env.ALLOW_LOCAL_ROLE_PROMOTION !== "true") {
    throw new Error("Set ALLOW_LOCAL_ROLE_PROMOTION=true explicitly to enable this local-only operation.");
  }

  const email = String(process.argv[2] || "").trim().toLowerCase();
  const role = String(process.argv[3] || "").trim();
  if (!email || !["reviewer", "admin", "member"].includes(role)) {
    throw new Error("Usage: npm run promote:local-role -- user@example.test reviewer|admin|member");
  }
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");

  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { role } },
    { new: true, runValidators: true }
  ).select("_id name email role");

  if (!user) {
    throw new Error("No account found for that email. Create the local demo account first.");
  }

  process.stdout.write("Updated local demo account role: " + user.email + " -> " + user.role + "\n");
}

main()
  .catch(error => {
    process.stderr.write("Role update failed: " + error.message + "\n");
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
