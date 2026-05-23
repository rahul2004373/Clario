import winston from 'winston';
import LokiTransport from 'winston-loki';

// Define validated log levels
const levels = {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4
};

// Define colors for console output
const colors = {
    fatal: 'red',
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue'
};

winston.addColors(colors);

// Custom format to pretty-print console logs in development
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.printf(
        (info) => `[${info.timestamp}] [${info.level}]: ${info.message} ${
            Object.keys(info).filter(k => !['timestamp', 'level', 'message'].includes(k)).length 
                ? JSON.stringify(Object.fromEntries(Object.entries(info).filter(([k]) => !['timestamp', 'level', 'message'].includes(k))))
                : ''
        }`
    )
);

// General JSON format for structured logs in Loki/Production
const jsonFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

const transports: winston.transport[] = [
    new winston.transports.Console({
        format: consoleFormat
    })
];

// Add Loki transport if Loki is enabled or in production
const lokiHost = process.env.LOKI_HOST || 'http://localhost:3100';
console.log(`[Observability] Initializing Loki log push transport targeting: ${lokiHost}`);

transports.push(
    new LokiTransport({
        host: lokiHost,
        labels: { app: 'clairo-backend', env: process.env.NODE_ENV || 'development' },
        json: true,
        batching: true,
        interval: 5, // Push logs to Loki every 5 seconds
        replaceTimestamp: true, // Use Winston's timestamp instead of arrival time
        format: jsonFormat,
        onConnectionError: (err: any) => {
            console.error('[Observability] Loki connection error, logs are still being printed to console:', err.message);
        }
    })
);

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
    levels,
    transports
});

// Helper for type-safe structured logging
export interface LogMetadata {
    requestId?: string;
    userId?: string;
    workspaceId?: string;
    chatbotId?: string;
    sourceId?: string;
    conversationId?: string;
    route?: string;
    method?: string;
    statusCode?: number;
    durationMs?: number;
    errorCode?: string;
    errorMessage?: string;
    providerName?: string;
    modelName?: string;
    [key: string]: any;
}

export const log = {
    debug: (message: string, meta?: LogMetadata) => logger.log('debug', message, meta),
    info: (message: string, meta?: LogMetadata) => logger.log('info', message, meta),
    warn: (message: string, meta?: LogMetadata) => logger.log('warn', message, meta),
    error: (message: string, meta?: LogMetadata) => logger.log('error', message, meta),
    fatal: (message: string, meta?: LogMetadata) => logger.log('fatal', message, meta)
};
