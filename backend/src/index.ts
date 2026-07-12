import app from "./app";
import { env } from "./config/env";

process.on("unhandledRejection", (error) => {
  console.error("[UnhandledRejection]", error);
});

process.on("uncaughtException", (error) => {
  console.error("[UncaughtException]", error);
});

app.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT}`);
});
