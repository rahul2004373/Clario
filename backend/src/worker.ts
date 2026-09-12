import { IngestionWorker } from "./modules/sources/jobs/worker";
import express from "express";
import morgan from "morgan";
import { errorMiddleware } from "./middleware/error.middleware";

process.on("unhandledRejection", (error) => {
  console.error("[Worker UnhandledRejection]", error);
});

process.on("uncaughtException", (error) => {
  console.error("[Worker UncaughtException]", error);
});

console.log("[Worker] Starting background process...");
IngestionWorker.startPolling();

const app = express();

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.status(200).send("Worker is alive and polling!");
});

app.get("/health", (req, res) => {
  res.status(200).send("Worker is alive and polling!");
});

app.use(errorMiddleware);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`[Worker] Dummy HTTP server listening on port ${PORT} for Render health checks.`);
});

