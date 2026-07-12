<div align="center">
  <h1>Clario - Enterprise AI Chatbot Platform</h1>
  <p>A production-ready, multi-tenant backend for building, training, and deploying custom AI support agents to any website.</p>
</div>

---

## Overview

Clario is an enterprise-grade AI chatbot platform that allows businesses to create intelligent, RAG-powered (Retrieval-Augmented Generation) agents. Users can upload PDFs or link websites to train their chatbot, customize its tone and behavior, and instantly deploy it as a floating widget on their website.

This repository houses the **Node.js/Express Backend** which orchestrates the complex RAG pipeline, manages multi-tenant workspaces, and handles highly-concurrent Server-Sent Event (SSE) chat streams.

---

## Core Features

- **🏢 Multi-Tenant Architecture:** Full workspace management with granular Role-Based Access Control (RBAC: Owner, Admin, Viewer).
- **🧠 Intelligent RAG Pipeline:** Automated PDF parsing, intelligent text chunking, and semantic vector embedding generation using PostgreSQL (`pgvector`).
- **⚡ Real-time Streaming:** Extremely low-latency, character-by-character token streaming to the frontend via Server-Sent Events (SSE).
- **🔄 Background Processing:** Reliable background workers powered by Redis & BullMQ to handle heavy document ingestion without blocking the main event loop.
- **🔌 Public Widget API:** Highly secure, headless API endpoints that allow chatbots to be embedded seamlessly via an iframe/script tag on external domains.
- **📊 Analytics Engine:** Real-time metrics tracking conversation volume, token costs, user traffic sources, and AI guardrail pass rates.

---

## System Architecture

The following diagram illustrates how the Clario platform orchestrates requests between the clients, the core backend, background workers, and AI providers.

```mermaid
graph TD
    Client[Client App / Widget] --> API[Node.js / Express API]

    API --> Db[(Supabase / PostgreSQL)]
    API -.-> Redis[Redis Queue]

    Redis -.-> Worker[Background Worker]
    Worker --> Db

    API <--> LLM[OpenAI / Bynara LLM]
```

---

## Technology Stack

| Category         | Technology                         |
| :--------------- | :--------------------------------- |
| **Runtime**      | Node.js / TypeScript               |
| **Framework**    | Express.js                         |
| **Database**     | PostgreSQL (Supabase) + `pgvector` |
| **ORM**          | Prisma                             |
| **AI/LLM**       | OpenAI API, Custom Bynara Models   |
| **Vector Tools** | LangChain Text Splitters, tiktoken |
| **Queues**       | Redis, BullMQ                      |

---

## Getting Started (Local Development)

### Prerequisites

- Node.js (v18+)
- Redis server running locally or remotely
- A Supabase PostgreSQL database with the `pgvector` extension enabled

### 1. Installation

Clone the repository and install dependencies:

```bash
cd clario-project/backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
PORT=4000
NODE_ENV=development

# Supabase / Prisma
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"



# AI Providers
GEMNINI_API_KEY="sk-..."

# Security
JWT_SECRET="your-super-secret-key"
```

### 3. Database Setup

Push the Prisma schema to your database to create the necessary tables and vector indices:

```bash
npx prisma generate
npx prisma db push
```

### 4. Run the Application

Start both the Main Web Server and the Background Worker concurrently:

```bash
npm run dev
```

_The API will be available at `http://localhost:4000/api`._

---

## Security Best Practices

- **Zero-Trust Dashboard:** Every dashboard route strictly enforces Workspace Membership and Role Verification (Owner, Admin, Viewer).
- **Public API Isolation:** The widget operates on isolated `/api/public/` routes using unguessable `embedPublicKey` verification to prevent internal ID enumeration.
- **SQL Injection Prevention:** 100% of database interactions are sanitized and routed safely through the Prisma ORM.

---

_Built with ❤️ for next-generation customer support._
