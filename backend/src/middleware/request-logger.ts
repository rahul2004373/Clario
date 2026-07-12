import { Request, Response, NextFunction } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    // Choose color based on status
    let statusColor = "\x1b[32m"; // green for 200s
    if (status >= 400 && status < 500) statusColor = "\x1b[33m"; // yellow for 400s
    if (status >= 500) statusColor = "\x1b[31m"; // red for 500s
    
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${statusColor}${status}\x1b[0m - ${duration}ms`
    );
  });

  next();
}
