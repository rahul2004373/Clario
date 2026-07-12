import { IngestionWorker } from "./modules/sources/jobs/worker";
import express from "express";

process.on("unhandledRejection", (error) => {
  console.error("[Worker UnhandledRejection]", error);
});

process.on("uncaughtException", (error) => {
  console.error("[Worker UncaughtException]", error);
});

console.log("[Worker] Starting background process...");
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
  console.log(`[Worker] Dummy HTTP server listening on port ${PORT} for Render health checks.`);
});
