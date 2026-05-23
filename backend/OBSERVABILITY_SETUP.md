# Clairo Node.js Observability Stack Manual

Welcome to the Clairo Backend Observability manual. This guide explains how to boot your new logging & metrics pipeline, how the services correlate, and includes key time-series and query instructions to make full use of the stack.

---

## 🏗️ Architecture Overview

The observability suite consists of a split-channel pipeline to maximize speed and data storage efficiency:

```
[ Express App ] ─── (Pull Scrape) ───> [ Prometheus (Port 9090) ] ──┐
       │                                                             │
(Winston Loki HTTP Push)                                         (PromQL / LogQL)
       │                                                             │
       ▼                                                             ▼
[ Grafana Loki (Port 3100) ] ──────────────────────────────────> [ Grafana (Port 3001) ]
```

1. **Winston Logger** pushes compressed batches of structured logs asynchronously to Loki on port `3100` every 5 seconds.
2. **prom-client** holds active API, DB, LLM, RAG, and worker counters in Node.js memory.
3. **Prometheus** pulls (scrapes) `/metrics` on port `3000` every 15 seconds.
4. **Grafana** brings both worlds together, enabling direct click-through log correlations from metric spikes.

---

## 🚀 Quick Start Guide

### 1. Start Docker Containers
From your backend directory (`e:\clairo\backend`), spin up the Prometheus, Loki, and Grafana containers:
```powershell
docker-compose up -d
```

Verify the health of the containers:
```powershell
docker-compose ps
```

### 2. Port Allocation
* **Express App Server:** `http://localhost:3000`
* **Prometheus Dashboard:** `http://localhost:9090`
* **Grafana Loki Instance:** `http://localhost:3100`
* **Grafana UI Dashboard:** `http://localhost:3001`
  * *Username:* `admin`
  * *Password:* `admin`

---

## 🧪 Testing the Metrics Endpoint

Open your browser or run a GET request to ensure your local `prom-client` is exporting runtime and custom metrics:
```bash
curl http://localhost:3000/metrics
```

Expected output includes structured Prometheus text exposition metrics like:
```text
# HELP clairo_http_requests_total Total HTTP requests handled
# TYPE clairo_http_requests_total counter
clairo_http_requests_total{method="GET",route="/health",status_code="200"} 5
```

---

## 📊 Grafana Explorer & Key Queries

Grafana comes **pre-loaded** with your Prometheus and Loki data sources, so they are ready for exploration out-of-the-box!

### Key PromQL Queries (Metrics)

1. **Total HTTP Requests Rate (Per Route):**
   ```promql
   sum(rate(clairo_http_requests_total[5m])) by (route, method)
   ```
2. **p95 Latency of API Routes:**
   ```promql
   histogram_quantile(0.95, sum(rate(clairo_http_request_duration_seconds_bucket[5m])) by (le, route))
   ```
3. **LLM Query Token Consumption (Input vs Output):**
   ```promql
   sum(rate(clairo_llm_tokens_total[5m])) by (model, type)
   ```
4. **RAG Ingestion Processing Speed:**
   ```promql
   histogram_quantile(0.95, sum(rate(clairo_rag_ingestion_duration_seconds_bucket[5m])) by (le, type))
   ```
5. **Background Ingestion Job Queue Failures Rate:**
   ```promql
   sum(rate(clairo_queue_jobs_total{status="failed"}[5m]))
   ```

### Key LogQL Queries (Logs)

1. **View All Application Error Logs:**
   ```logql
   {app="clairo-backend", env="development"} | json | level = `error`
   ```
2. **Filter Logs for a Specific Workspace:**
   ```logql
   {app="clairo-backend"} | json | workspaceId = `YOUR_WORKSPACE_ID`
   ```
3. **Find Slow Database Queries (Duration > 100ms):**
   ```logql
   {app="clairo-backend"} | json | durationMs > 100 | msg =~ ".*DB.*"
   ```

---

## ⚡ The Killer Correlation Feature

To correlate a Prometheus metric spike directly with its logs in Grafana:
1. Open the **Grafana Explore** page (`http://localhost:3001/explore`).
2. Add a query visualizing your API error rate or slow response time.
3. Click **"Split"** in the top right to open a side-by-side view.
4. Select the **Loki** datasource in the second panel.
5. Apply `{app="clairo-backend"} | json` and you'll see the exact logs matched to the exact millisecond time window of the metric spike!
