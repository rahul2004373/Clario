import "newrelic";
import app from "./app";
import { env } from "./config/env";
import { logger } from "./logger";

process.on("unhandledRejection", (error) => {
  logger.error({ err: error }, "[UnhandledRejection]");
});

process.on("uncaughtException", (error) => {
  logger.error({ err: error }, "[UncaughtException]");
});

app.listen(env.PORT, () => {
  logger.info(`Server listening on port ${env.PORT}`);
});
