import express from "express";
import cors from "cors";
import morgan from "morgan";
import { apiRouter } from "./routes/api.routes";
import { errorMiddleware } from "./middleware/error.middleware";

const app = express();

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("dev"));
}

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: `${Math.round(process.uptime())}s`,
    memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
  });
});

app.use("/api", apiRouter);

app.use((_request, response) => {
  response.status(404).json({
    error: "Not Found"
  });
});

app.use(errorMiddleware);

export default app;

