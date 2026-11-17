require("dotenv").config();

const { connectDatabase } = require("./server/config/database");
const { createApp } = require("./server/app");

async function start() {
  const app = createApp();
  const port = Number(process.env.PORT || 4000);

  await connectDatabase();

  const server = app.listen(port, () => {
    process.stdout.write("MINDCOMMON API listening on port " + port + "\n");
  });

  const shutdown = async (signal) => {
    process.stdout.write(signal + " received; shutting down.\n");
    server.close(async () => {
      const mongoose = require("mongoose");
      await mongoose.disconnect();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((error) => {
  // Do not print environment variables or request payloads.
  process.stderr.write("API startup failed: " + error.message + "\n");
  process.exit(1);
});
