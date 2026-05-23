# Clairo Public Customer REST API Reference

Welcome to the Clairo Public REST API developer guide. This API allows you to programmatically manage your chatbots, query the RAG search and generation pipeline (with streaming and non-streaming responses), upload raw text or web URL sources, monitor the background ingestion pipeline, and purge resources.

---

## Authentication & Headers

All requests to the Clairo Public REST API must be securely authenticated using a standard **Bearer API Token** generated inside your dashboard.

### Required Header:
```http
Authorization: Bearer cl_sk_YOUR_API_KEY
Content-Type: application/json
```

### Rate Limiting:
* Requests are rate-limited to **500 requests per 15 minutes** per workspace.
* Standard `X-RateLimit-*` headers are returned in every response.
* If rate limits are exceeded, a standard `429 Too Many Requests` error will be returned.

---

## Standard Error Payload

In the event of an error, the API returns standard, developer-friendly JSON error payloads:

```json
{
  "error": {
    "code": "UNAUTHORIZED | BAD_REQUEST | NOT_FOUND | RATE_LIMIT_EXCEEDED | INTERNAL_SERVER_ERROR",
    "message": "A human-readable description of what went wrong."
  }
}
```

---

## Chatbots API

### 1. List All Chatbots
Retrieve a complete list of chatbots belonging to your workspace.

* **Endpoint:** `GET /public/v1/chatbots`
* **Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "e6a2bc4e-7b19-45d2-8da5-13b7a5a8e0f9",
      "name": "Acme Support Bot",
      "systemPrompt": "You are a helpful customer support agent for Acme Corp...",
      "createdAt": "2026-05-20T10:14:22.000Z",
      "updatedAt": "2026-05-21T12:00:00.000Z"
    }
  ]
}
```

---

### 2. Get Chatbot Details
Retrieve the configuration, prompts, and active widget/Telegram channel settings for a specific chatbot.

* **Endpoint:** `GET /public/v1/chatbots/:chatbotId`
* **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "e6a2bc4e-7b19-45d2-8da5-13b7a5a8e0f9",
    "name": "Acme Support Bot",
    "workspaceId": "d1a89b0c-43bf-40ea-9ca1-aaef38cdab10",
    "systemPrompt": "You are a helpful customer support agent...",
    "sourceIds": ["f3a2c5b9-1234-5678-abcd-ef0123456789"],
    "telegramSetting": {
      "botUsername": "AcmeSupportBot",
      "isActive": true
    },
    "widgetSetting": {
      "allowedDomains": ["https://acme.com"],
      "welcomeMessage": "Hello! How can I help you today?",
      "isActive": true
    },
    "createdAt": "2026-05-20T10:14:22.000Z",
    "updatedAt": "2026-05-21T12:00:00.000Z"
  }
}
```

---

### 3. Programmatic Chat
Submit a query to the chatbot's RAG pipeline and receive an AI-driven, grounded response based on your training sources.

* **Endpoint:** `POST /public/v1/chatbots/:chatbotId/chat`
* **Request Body:**
```json
{
  "message": "What is the warranty policy on metal chairs?",
  "conversationId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d" 
}
```
> [!NOTE]
> `conversationId` is **optional**. Omit it to start a new chat session. The response will return a new `conversationId` which you can pass in subsequent requests to maintain context memory.

* **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "conversationId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "status": "active",
    "response": "According to the product manual, all Acme metal chairs carry a standard 5-year warranty from the date of purchase...",
    "citations": [
      {
        "content": "Warranty: Acme metal chairs are built to last and are covered under a 5-year replacement warranty...",
        "score": 0.92,
        "sourceId": "f3a2c5b9-1234-5678-abcd-ef0123456789"
      }
    ]
  }
}
```

---

### 4. Streaming Programmatic Chat (SSE)
Receive real-time tokens via a Server-Sent Events (SSE) stream.

* **Endpoint:** `POST /public/v1/chatbots/:chatbotId/chat/stream`
* **Request Body:**
```json
{
  "message": "Tell me more about the metal processing.",
  "conversationId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
}
```

* **Server-Sent Event Format:**
```sse
event: start
data: {"conversationId":"a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d","status":"active"}

event: chunk
data: {"text":"Acme"}

event: chunk
data: {"text":" uses"}

event: chunk
data: {"text":" high"}

...

event: done
data: {"done":true,"citations":[{"content":"...","score":0.95,"sourceId":"..."}],"conversationId":"a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"}
```

---

### 5. Trigger Training / Indexing
Trigger background synchronization and token ingestion for all `PENDING` or `FAILED` sources associated with the chatbot.

* **Endpoint:** `POST /public/v1/chatbots/:chatbotId/train`
* **Request Body:**
```json
{
  "force": false
}
```
> [!TIP]
> Setting `"force": true` will force-rebuild and re-index all sources, including those that are already `READY`.

* **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Training triggered successfully. Queued 2 source(s) for background processing.",
  "data": {
    "totalSources": 5,
    "queuedSourcesCount": 2
  }
}
```

---

### 6. Get Chatbot Ingestion & Training Status
Get the overall synchronization and training health of the chatbot's sources.

* **Endpoint:** `GET /public/v1/chatbots/:chatbotId/training-status`
* **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "status": "READY | PROCESSING | PENDING | FAILED | PARTIAL_SUCCESS | NO_SOURCES",
    "totalSourcesCount": 5,
    "breakdown": {
      "ready": 4,
      "processing": 0,
      "pending": 0,
      "failed": 1
    }
  }
}
```

---

## Sources API

### 1. List Chatbot Sources
Retrieve a complete list of documents, text snippets, and URLs linked to a specific chatbot.

* **Endpoint:** `GET /public/v1/chatbots/:chatbotId/sources`
* **Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "f3a2c5b9-1234-5678-abcd-ef0123456789",
      "name": "Acme_Chairs_Catalog.pdf",
      "type": "pdf",
      "status": "READY",
      "fileSize": 2048576,
      "chunkCount": 38,
      "errorMsg": null,
      "syncedAt": "2026-05-21T10:00:00.000Z",
      "createdAt": "2026-05-21T09:45:00.000Z"
    }
  ]
}
```

---

### 2. Upload Document Source
Upload a binary document (PDF, DOCX, or TXT) to train your chatbot.

* **Endpoint:** `POST /public/v1/chatbots/:chatbotId/sources/file`
* **Request Format:** `multipart/form-data`
* **Parameters:**
  * `file`: (Binary File) Must be `.pdf`, `.docx`, or `.txt` up to 25MB.
* **Response `202 Accepted`:**
```json
{
  "success": true,
  "message": "File source uploaded successfully and queued for background indexing.",
  "data": {
    "sourceId": "f3a2c5b9-1234-5678-abcd-ef0123456789",
    "name": "User_Manual_v2.pdf",
    "status": "PENDING"
  }
}
```

---

### 3. Add Raw Text Source
Upload raw text content directly without needing a file.

* **Endpoint:** `POST /public/v1/chatbots/:chatbotId/sources/text`
* **Request Body:**
```json
{
  "name": "Acme Delivery Policy FAQ",
  "content": "Standard deliveries are made within 3-5 business days. Expited shipping guarantees delivery within 24-48 hours..."
}
```
* **Response `202 Accepted`:**
```json
{
  "success": true,
  "message": "Text source added successfully and queued for background indexing.",
  "data": {
    "sourceId": "8b5a312d-fa9e-4c7b-8911-3e4ab8c7d6e5",
    "name": "Acme Delivery Policy FAQ",
    "status": "PENDING"
  }
}
```

---

### 4. Add Web URL Source
Provide a website address. Clairo's crawler will scrape and index the page content.

* **Endpoint:** `POST /public/v1/chatbots/:chatbotId/sources/url`
* **Request Body:**
```json
{
  "url": "https://acme.com/help/warranty-terms"
}
```
* **Response `202 Accepted`:**
```json
{
  "success": true,
  "message": "URL source added successfully and queued for background scraping and indexing.",
  "data": {
    "sourceId": "7e2cb09f-4318-498c-8ea6-d5d14e39b7ac",
    "name": "https://acme.com/help/warranty-terms",
    "status": "PENDING"
  }
}
```

---

### 5. Retrieve Source Status
Check the status of a specific source in your workspace.

* **Endpoint:** `GET /public/v1/sources/:sourceId`
* **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "f3a2c5b9-1234-5678-abcd-ef0123456789",
    "name": "User_Manual_v2.pdf",
    "type": "pdf",
    "status": "PROCESSING | READY | FAILED | PENDING",
    "fileSize": 102456,
    "mimeType": "application/pdf",
    "chunkCount": 12,
    "errorMsg": null,
    "syncedAt": "2026-05-21T12:05:00.000Z",
    "workspaceId": "d1a89b0c-43bf-40ea-9ca1-aaef38cdab10",
    "createdAt": "2026-05-21T12:00:00.000Z",
    "updatedAt": "2026-05-21T12:05:00.000Z"
  }
}
```

---

### 6. Trigger Single Source Ingestion
Manually trigger or force retry a pending or failed document sync.

* **Endpoint:** `POST /public/v1/sources/:sourceId/process`
* **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Source reprocessing triggered successfully and queued.",
  "data": {
    "sourceId": "f3a2c5b9-1234-5678-abcd-ef0123456789",
    "status": "PENDING"
  }
}
```

---

### 7. Delete Source
Purge a source entirely. This will clean up the database, remove the file from Amazon S3, and delete all associated vector chunks from the Supabase Vector Database.

* **Endpoint:** `DELETE /public/v1/sources/:sourceId`
* **Response `204 No Content`** on success.
