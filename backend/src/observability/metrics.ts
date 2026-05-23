import client from 'prom-client';

// Enable default runtime metrics (CPU, Memory, GC, Event Loop)
client.collectDefaultMetrics({
    prefix: 'clairo_sys_',
    gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
});

export class MetricsManager {
    // ─── HTTP / API GATEWAY METRICS ───
    static readonly httpRequests = new client.Counter({
        name: 'clairo_http_requests_total',
        help: 'Total HTTP requests handled',
        labelNames: ['method', 'route', 'status_code']
    });

    static readonly httpRequestDuration = new client.Histogram({
        name: 'clairo_http_request_duration_seconds',
        help: 'HTTP request duration in seconds',
        labelNames: ['method', 'route', 'status_code'],
        buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30] // p95, p99, and timeouts coverage
    });

    static readonly httpActiveRequests = new client.Gauge({
        name: 'clairo_http_active_requests',
        help: 'Number of active HTTP requests currently in flight'
    });

    static readonly httpRateLimitHits = new client.Counter({
        name: 'clairo_http_rate_limit_hits_total',
        help: 'Total number of rate limit hits',
        labelNames: ['endpoint_type', 'route'] // dashboard or public
    });

    static readonly httpAuthFailures = new client.Counter({
        name: 'clairo_http_auth_failures_total',
        help: 'Total number of authentication failures',
        labelNames: ['reason'] // invalid_token, expired_session, invalid_api_key
    });

    static readonly httpRequestSize = new client.Histogram({
        name: 'clairo_http_request_size_bytes',
        help: 'HTTP request payload size in bytes',
        labelNames: ['route'],
        buckets: [128, 512, 2048, 8192, 32768, 131072, 524288, 2097152] // Up to 2MB+
    });

    static readonly httpResponseSize = new client.Histogram({
        name: 'clairo_http_response_size_bytes',
        help: 'HTTP response payload size in bytes',
        labelNames: ['route'],
        buckets: [128, 512, 2048, 8192, 32768, 131072, 524288, 2097152]
    });

    static readonly httpTimeouts = new client.Counter({
        name: 'clairo_http_timeouts_total',
        help: 'Total number of requests that exceeded the timeout limit',
        labelNames: ['route']
    });

    // ─── AI / LLM GATEWAY METRICS ───
    static readonly llmRequests = new client.Counter({
        name: 'clairo_llm_requests_total',
        help: 'Total number of LLM provider API requests',
        labelNames: ['provider', 'model', 'status'] // status: success, error, retry, timeout, fallback
    });

    static readonly llmRequestDuration = new client.Histogram({
        name: 'clairo_llm_request_duration_seconds',
        help: 'LLM request duration in seconds',
        labelNames: ['provider', 'model'],
        buckets: [0.1, 0.5, 1, 2, 5, 10, 20, 45, 90]
    });

    static readonly llmTokens = new client.Counter({
        name: 'clairo_llm_tokens_total',
        help: 'Total input/output tokens processed by models',
        labelNames: ['provider', 'model', 'type'] // type: input, output, total
    });

    static readonly llmCost = new client.Counter({
        name: 'clairo_llm_cost_usd_total',
        help: 'Estimated cost of LLM queries in USD',
        labelNames: ['provider', 'model']
    });

    static readonly llmTimeToFirstToken = new client.Histogram({
        name: 'clairo_llm_time_to_first_token_seconds',
        help: 'Time to first token for streaming responses in seconds',
        labelNames: ['provider', 'model'],
        buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5]
    });

    // ─── RAG PIPELINE METRICS ───
    static readonly ragSourcesProcessed = new client.Counter({
        name: 'clairo_rag_sources_processed_total',
        help: 'Total sources processed through RAG pipeline',
        labelNames: ['type', 'status'] // type: file, text, url; status: success, failed
    });

    static readonly ragIngestionDuration = new client.Histogram({
        name: 'clairo_rag_ingestion_duration_seconds',
        help: 'RAG source parsing and chunking duration in seconds',
        labelNames: ['type'],
        buckets: [0.5, 2, 5, 10, 30, 60, 180, 300]
    });

    static readonly ragChunksCreated = new client.Counter({
        name: 'clairo_rag_chunks_created_total',
        help: 'Total chunks created from ingested documents',
        labelNames: ['type']
    });

    static readonly ragRetrievalDuration = new client.Histogram({
        name: 'clairo_rag_retrieval_duration_seconds',
        help: 'RAG retrieval latency (vector database search) in seconds',
        labelNames: ['chatbot_id'],
        buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2]
    });

    static readonly ragEmbeddingDuration = new client.Histogram({
        name: 'clairo_rag_embedding_duration_seconds',
        help: 'Embedding generation duration in seconds',
        labelNames: ['provider'],
        buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5]
    });

    static readonly ragRetrievalEmptyResults = new client.Counter({
        name: 'clairo_rag_retrieval_empty_results_total',
        help: 'Total number of RAG retrievals that returned 0 matching context chunks',
        labelNames: ['chatbot_id']
    });

    // ─── QUEUE & BACKGROUND WORKER METRICS ───
    static readonly queueJobs = new client.Counter({
        name: 'clairo_queue_jobs_total',
        help: 'Total queue jobs handled',
        labelNames: ['queue', 'job_name', 'status'] // status: active, completed, failed, retried
    });

    static readonly queueJobDuration = new client.Histogram({
        name: 'clairo_queue_job_duration_seconds',
        help: 'Background queue job processing duration in seconds',
        labelNames: ['queue', 'job_name'],
        buckets: [0.1, 0.5, 1, 5, 10, 30, 60, 300]
    });

    static readonly queueBacklog = new client.Gauge({
        name: 'clairo_queue_backlog',
        help: 'Number of active/waiting jobs currently backlogged in queues',
        labelNames: ['queue', 'status'] // status: waiting, active, delayed
    });

    // ─── DATABASE METRICS ───
    static readonly dbQueries = new client.Counter({
        name: 'clairo_db_queries_total',
        help: 'Total Prisma/PostgreSQL queries executed',
        labelNames: ['operation', 'model']
    });

    static readonly dbQueryDuration = new client.Histogram({
        name: 'clairo_db_query_duration_seconds',
        help: 'Prisma/PostgreSQL query latency in seconds',
        labelNames: ['operation', 'model'],
        buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5]
    });

    static readonly dbQueryErrors = new client.Counter({
        name: 'clairo_db_query_errors_total',
        help: 'Total Prisma/PostgreSQL queries that failed',
        labelNames: ['operation', 'model']
    });

    // ─── AUTH & USER EVENT METRICS ───
    static readonly authEvents = new client.Counter({
        name: 'clairo_auth_events_total',
        help: 'Core user authentication events',
        labelNames: ['event', 'provider', 'status'] // event: login, signup, refresh; status: success, failure
    });

    // ─── EXTERNAL CHANNELS / INTEGRATIONS METRICS ───
    static readonly integrationEvents = new client.Counter({
        name: 'clairo_integration_events_total',
        help: 'Events processed across channels (Telegram, Slack, Widget, Webhook)',
        labelNames: ['channel', 'direction', 'status'] // direction: inbound, outbound
    });

    static readonly integrationLatency = new client.Histogram({
        name: 'clairo_integration_latency_seconds',
        help: 'Channel response latency (e.g. Telegram message reply delivery time)',
        labelNames: ['channel'],
        buckets: [0.1, 0.5, 1, 2, 5, 10]
    });

    // ─── BUSINESS METRICS ───
    static readonly businessActions = new client.Counter({
        name: 'clairo_business_actions_total',
        help: 'High level business KPI counters',
        labelNames: ['action'] // action: chatbot_created, workspace_created, source_uploaded, chat_message_sent
    });
}

// Global Prometheus pull endpoint exporter
export async function getMetricsRegistry(): Promise<string> {
    return client.register.metrics();
}

export const metricsContentType = client.register.contentType;
