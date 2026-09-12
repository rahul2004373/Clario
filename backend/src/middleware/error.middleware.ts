import { Request, Response, NextFunction } from "express";

interface ErrorWithStatusCode {
  statusCode: number;
}

function hasStatusCode(error: unknown): error is ErrorWithStatusCode {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof (error as Record<string, unknown>).statusCode === "number"
  );
}

export const errorMiddleware = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const message = error instanceof Error ? error.message : "Internal Server Error";
  
  let statusCode = 500;
  if (hasStatusCode(error)) {
    statusCode = error.statusCode;
  }

  console.error("[AppError]", error);
  res.status(statusCode).json({
    error: message
  });
};

