import express from "express";
import cors from "cors";
import { apiRouter } from "./routes/api.routes";
import { requestLogger } from "./middleware/request-logger";

const app = express();

app.use(requestLogger);

app.use(cors());
app.use(express.json());
app.use("/api", apiRouter);

app.use((_request, response) => {
  response.status(404).json({
    error: "Not Found"
  });
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Internal Server Error";
  const statusCode =
    typeof error === "object" && error !== null && "statusCode" in error && typeof (error as { statusCode?: unknown }).statusCode === "number"
      ? (error as { statusCode: number }).statusCode
      : 500;
  console.error("[AppError]", error);
  response.status(statusCode).json({
    error: message
  });
});

export default app;
