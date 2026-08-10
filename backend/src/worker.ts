import "newrelic";
import { IngestionWorker } from "./modules/sources/jobs/worker";
import express from "express";
import { logger } from "./logger";

process.on("unhandledRejection", (error) => {
  logger.error({ err: error }, "[Worker UnhandledRejection]");
});

process.on("uncaughtException", (error) => {
  logger.error({ err: error }, "[Worker UncaughtException]");
});

logger.info("[Worker] Starting background process...");
IngestionWorker.startPolling();

// --- DUMMY HTTP SERVER FOR RENDER ---
// Render free tier requires "Web Services" to bind to a port within 60 seconds.
// By doing this, we can deploy the worker as a standard Web Service!
const app = express();

app.get("/", (req, res) => {
  res.status(200).send("Worker is alive and polling!");
});

app.get("/health", (req, res) => {
  res.status(200).send("Worker is alive and polling!");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  logger.info(`[Worker] Dummy HTTP server listening on port ${PORT} for Render health checks.`);
});
