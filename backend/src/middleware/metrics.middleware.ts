import { Request, Response, NextFunction } from 'express';
import { MetricsManager } from '../observability/metrics';

/**
 * Normalizes dynamic path parameters (like UUIDs, numeric IDs, or literal placeholder :id)
 * into standardized route labels (e.g., :workspaceId, :chatbotId, :conversationId)
 * to reduce Prometheus metric cardinality and enable clean, aggregated dashboard queries.
 */
export function normalizeRoute(path: string): string {
    if (!path) return '/';

    // Split path into segments
    const segments = path.split('/');

    // Standard UUID pattern (with dashes)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const prevSegment = i > 0 ? segments[i - 1].toLowerCase() : '';

        const isUuid = uuidRegex.test(segment);
        const isGenericId = segment === ':id' || segment === ':chatbotId' || segment === ':workspaceId' || segment === ':conversationId';

        if (isUuid || isGenericId) {
            switch (prevSegment) {
                case 'workspaces':
                    segments[i] = ':workspaceId';
                    break;
                case 'chatbots':
                    segments[i] = ':chatbotId';
                    break;
                case 'conversations':
                    segments[i] = ':conversationId';
                    break;
                case 'sources':
                    segments[i] = ':sourceId';
                    break;
                case 'api-keys':
                    segments[i] = ':apiKeyId';
                    break;
                case 'webhook':
                    segments[i] = ':chatbotId';
                    break;
                case 'widget':
                    segments[i] = ':widgetToken';
                    break;
                default:
                    if (isUuid) {
                        segments[i] = ':id';
                    }
                    break;
            }
        }
    }

    // Reconstruct normalized route
    let normalized = segments.join('/');

    // Normalize formatting (collapse multiple slashes, remove trailing slashes)
    normalized = normalized.replace(/\/+/g, '/');
    if (normalized.endsWith('/') && normalized.length > 1) {
        normalized = normalized.slice(0, -1);
    }

    return normalized;
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime();
    
    // Increment concurrent requests count
    MetricsManager.httpActiveRequests.inc();

    // Track request payload size if available
    const reqLengthStr = req.headers['content-length'];
    if (reqLengthStr) {
        const reqSize = parseInt(reqLengthStr, 10);
        if (!isNaN(reqSize)) {
            // Observe request size (normalized)
            const rawRoute = req.baseUrl + (req.route?.path || req.path);
            const normalizedRoute = normalizeRoute(rawRoute);
            MetricsManager.httpRequestSize.observe({ route: normalizedRoute }, reqSize);
        }
    }

    res.on('finish', () => {
        const diff = process.hrtime(start);
        const durationSeconds = (diff[0] * 1e9 + diff[1]) / 1e9;
        
        // Decrement concurrent requests count
        MetricsManager.httpActiveRequests.dec();

        // Resolve parametrized route name (e.g. /api/v1/chatbots/:id/chat)
        const rawRoute = req.route ? (req.baseUrl + req.route.path) : req.path;
        const normalizedRoute = normalizeRoute(rawRoute);
        const method = req.method;
        const statusCode = res.statusCode.toString();

        // Record total request count
        MetricsManager.httpRequests.inc({
            method,
            route: normalizedRoute,
            status_code: statusCode
        });

        // Record request duration latency
        MetricsManager.httpRequestDuration.observe(
            {
                method,
                route: normalizedRoute,
                status_code: statusCode
            },
            durationSeconds
        );

        // Record response payload size if header is set
        const resLengthStr = res.getHeader('content-length');
        if (resLengthStr) {
            const resSize = parseInt(resLengthStr as string, 10);
            if (!isNaN(resSize)) {
                MetricsManager.httpResponseSize.observe({ route: normalizedRoute }, resSize);
            }
        }
    });

    next();
}
