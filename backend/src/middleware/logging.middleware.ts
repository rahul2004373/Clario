import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { log } from '../observability/logger';

export interface InstrumentedRequest extends Request {
    requestId?: string;
    userId?: string;
    workspaceId?: string;
}

export function loggingMiddleware(req: InstrumentedRequest, res: Response, next: NextFunction) {
    const start = process.hrtime();
    
    // Generate or extract request correlation ID
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    // Capture standard details
    const method = req.method;
    const url = req.originalUrl || req.url;

    // Bypass logs for metrics scraping and favicon queries to keep logging streams clean
    if (url === '/metrics' || url === '/favicon.ico') {
        next();
        return;
    }

    // Log the request arrival at debug level
    log.debug(`Incoming HTTP ${method} ${url}`, {
        requestId,
        route: url,
        method
    });

    // Intercept finish event to calculate execution duration
    res.on('finish', () => {
        const diff = process.hrtime(start);
        const durationMs = Math.round((diff[0] * 1e9 + diff[1]) / 1e6);
        const statusCode = res.statusCode;

        const meta = {
            requestId,
            userId: req.userId || (req as any).apiWorkspaceId, // Bind either dashboard userId or public workspace/api key
            workspaceId: req.workspaceId || (req as any).apiWorkspaceId,
            route: url,
            method,
            statusCode,
            durationMs
        };

        if (statusCode >= 500) {
            log.error(`HTTP request failed with server error: ${method} ${url} [${statusCode}] (${durationMs}ms)`, meta);
        } else if (statusCode >= 400) {
            log.warn(`HTTP request warning: ${method} ${url} [${statusCode}] (${durationMs}ms)`, meta);
        } else {
            log.info(`HTTP request success: ${method} ${url} [${statusCode}] (${durationMs}ms)`, meta);
        }
    });

    next();
}
