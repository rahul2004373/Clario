-- CreateEnum
CREATE TYPE "WorkspacePlan" AS ENUM ('FREE', 'HOBBY', 'GROWTH', 'UNLIMITED', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "WorkspaceMemberRole" AS ENUM ('OWNER', 'ADMIN', 'VIEWER');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('GENERAL', 'ECOMMERCE', 'SAAS', 'HEALTHCARE', 'EDUCATION', 'REAL_ESTATE', 'LEGAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AgentRole" AS ENUM ('SUPPORT', 'SALES', 'INTERNAL', 'DOCS', 'BOOKING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AgentTone" AS ENUM ('FRIENDLY', 'PROFESSIONAL', 'CARING', 'TECHNICAL', 'FORMAL');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('PDF', 'DOCX', 'XLSX', 'CSV', 'TXT', 'URL', 'YOUTUBE', 'NOTION', 'SITEMAP', 'PLAIN_TEXT');

-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REINGESTING');

-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('PUBLIC_WEB', 'INTERNAL_TOOL', 'THIRD_PARTY', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ToolAuthType" AS ENUM ('NONE', 'BEARER', 'API_KEY', 'BASIC', 'CUSTOM_HEADER');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('NONE', 'EMAIL_OTP', 'PHONE_OTP', 'JWT_PASSTHROUGH', 'KNOWLEDGE_BASED');

-- CreateEnum
CREATE TYPE "EscalationMethod" AS ENUM ('EMAIL', 'SLACK', 'ZENDESK_TICKET', 'FRESHDESK_TICKET', 'WEBHOOK', 'PHONE_PROMPT', 'DISABLED');

-- CreateEnum
CREATE TYPE "EscalationTrigger" AS ENUM ('LOW_CONFIDENCE', 'USER_REQUESTED', 'TURN_LIMIT_REACHED', 'SENSITIVE_TOPIC', 'TOOL_FAILURE', 'NO_CONTEXT_FOUND');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'TOOL');

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'EMAIL', 'PHONE', 'NUMBER', 'SELECT', 'DATE', 'BOOLEAN');

-- CreateEnum
CREATE TYPE "ApiKeyScope" AS ENUM ('FULL', 'READ_ONLY', 'WIDGET_ONLY');

-- CreateEnum
CREATE TYPE "OnboardingStep" AS ENUM ('WORKSPACE_CREATED', 'INDUSTRY_SELECTED', 'AGENT_CREATED', 'DOCUMENT_UPLOADED', 'TOOL_CONFIGURED', 'PLAYGROUND_TESTED', 'WIDGET_DEPLOYED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "website" TEXT,
    "businessType" "BusinessType" NOT NULL DEFAULT 'GENERAL',
    "plan" "WorkspacePlan" NOT NULL DEFAULT 'FREE',
    "maxChatbots" INTEGER NOT NULL DEFAULT 2,
    "msgLimitMonth" INTEGER NOT NULL DEFAULT 100,
    "messagesUsedMonth" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WorkspaceMemberRole" NOT NULL DEFAULT 'VIEWER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_onboarding" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "completedSteps" "OnboardingStep"[],
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_onboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "scope" "ApiKeyScope" NOT NULL DEFAULT 'FULL',
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbots" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "agentRole" "AgentRole" NOT NULL DEFAULT 'SUPPORT',
    "businessType" "BusinessType" NOT NULL DEFAULT 'GENERAL',
    "systemPrompt" TEXT NOT NULL,
    "promptVersion" INTEGER NOT NULL DEFAULT 1,
    "agentTone" "AgentTone" NOT NULL DEFAULT 'FRIENDLY',
    "avatarUrl" TEXT,
    "welcomeMessage" TEXT NOT NULL DEFAULT 'Hi! How can I help you today?',
    "fallbackMessage" TEXT NOT NULL DEFAULT 'I''m sorry, I couldn''t find an answer. Let me connect you with a human agent.',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatbots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "chatbotId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "pageCount" INTEGER,
    "sourceUrl" TEXT,
    "crawlDepth" INTEGER DEFAULT 1,
    "ingestionStatus" "IngestionStatus" NOT NULL DEFAULT 'PENDING',
    "ingestionError" TEXT,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "tokenCount" INTEGER NOT NULL DEFAULT 0,
    "lastIngestedAt" TIMESTAMP(3),
    "accessLevels" "AccessLevel"[] DEFAULT ARRAY['PUBLIC_WEB']::"AccessLevel"[],
    "autoReIngest" BOOLEAN NOT NULL DEFAULT false,
    "reIngestEveryHours" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_metadata" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[],
    "version" TEXT,
    "owner" TEXT,
    "validUntil" TIMESTAMP(3),
    "externalUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_configs" (
    "id" TEXT NOT NULL,
    "chatbotId" TEXT NOT NULL,
    "toolKey" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "authType" "ToolAuthType" NOT NULL DEFAULT 'BEARER',
    "authValue" TEXT,
    "customHeaders" JSONB,
    "parameters" JSONB NOT NULL,
    "responseMapping" JSONB,
    "requiresVerification" BOOLEAN NOT NULL DEFAULT false,
    "verificationType" "VerificationType" NOT NULL DEFAULT 'NONE',
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isPreset" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_fields" (
    "id" TEXT NOT NULL,
    "chatbotId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" "FieldType" NOT NULL DEFAULT 'TEXT',
    "placeholder" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "options" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalation_configs" (
    "id" TEXT NOT NULL,
    "chatbotId" TEXT NOT NULL,
    "triggers" "EscalationTrigger"[],
    "method" "EscalationMethod" NOT NULL DEFAULT 'EMAIL',
    "escalationMessage" TEXT,
    "maxTurnsBeforeEscalate" INTEGER NOT NULL DEFAULT 3,
    "emailTo" TEXT,
    "emailSubjectTemplate" TEXT,
    "slackWebhookUrl" TEXT,
    "slackChannel" TEXT,
    "zendeskApiUrl" TEXT,
    "zendeskApiKey" TEXT,
    "zendeskTagsList" TEXT[],
    "freshdeskApiUrl" TEXT,
    "freshdeskApiKey" TEXT,
    "webhookUrl" TEXT,
    "webhookSecret" TEXT,
    "includeTranscript" BOOLEAN NOT NULL DEFAULT true,
    "includeSummary" BOOLEAN NOT NULL DEFAULT true,
    "includeUserInfo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escalation_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "chatbotId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "userPhone" TEXT,
    "fingerprint" TEXT,
    "userName" TEXT,
    "formData" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEscalated" BOOLEAN NOT NULL DEFAULT false,
    "escalatedAt" TIMESTAMP(3),
    "escalationTicketId" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "turnCount" INTEGER NOT NULL DEFAULT 0,
    "resolvedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "retrievedChunkIds" TEXT[],
    "avgRetrievalScore" DOUBLE PRECISION,
    "guardrailPassed" BOOLEAN,
    "guardrailScore" DOUBLE PRECISION,
    "toolCallsMade" JSONB,
    "citations" JSONB,
    "followUpSuggestions" TEXT[],
    "verificationRequired" BOOLEAN NOT NULL DEFAULT false,
    "verificationCompleted" BOOLEAN NOT NULL DEFAULT false,
    "latencyMs" INTEGER,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "estimatedCostUsd" DOUBLE PRECISION,
    "langsmithRunId" TEXT,
    "userRating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_analytics" (
    "id" TEXT NOT NULL,
    "chatbotId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "questionTopicTag" TEXT,
    "avgRetrievalScore" DOUBLE PRECISION,
    "chunksRetrieved" INTEGER NOT NULL DEFAULT 0,
    "guardrailPassed" BOOLEAN NOT NULL DEFAULT true,
    "responseLatencyMs" INTEGER,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "estimatedCostUsd" DOUBLE PRECISION,
    "wasToolCall" BOOLEAN NOT NULL DEFAULT false,
    "toolsUsed" TEXT[],
    "wasEscalated" BOOLEAN NOT NULL DEFAULT false,
    "escalationReason" TEXT,
    "wasVerificationRequired" BOOLEAN NOT NULL DEFAULT false,
    "wasCached" BOOLEAN NOT NULL DEFAULT false,
    "cacheType" TEXT,
    "userRating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_events" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "chatbotId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_workspaceId_userId_key" ON "workspace_members"("workspaceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_onboarding_workspaceId_key" ON "workspace_onboarding"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "sources_chatbotId_idx" ON "sources"("chatbotId");

-- CreateIndex
CREATE UNIQUE INDEX "source_metadata_sourceId_key" ON "source_metadata"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "tool_configs_chatbotId_toolKey_key" ON "tool_configs"("chatbotId", "toolKey");

-- CreateIndex
CREATE UNIQUE INDEX "form_fields_chatbotId_fieldKey_key" ON "form_fields"("chatbotId", "fieldKey");

-- CreateIndex
CREATE UNIQUE INDEX "escalation_configs_chatbotId_key" ON "escalation_configs"("chatbotId");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_sessionId_key" ON "conversations"("sessionId");

-- CreateIndex
CREATE INDEX "conversations_chatbotId_startedAt_idx" ON "conversations"("chatbotId", "startedAt");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_analytics_messageId_key" ON "conversation_analytics"("messageId");

-- CreateIndex
CREATE INDEX "conversation_analytics_chatbotId_createdAt_idx" ON "conversation_analytics"("chatbotId", "createdAt");

-- CreateIndex
CREATE INDEX "conversation_analytics_workspaceId_createdAt_idx" ON "conversation_analytics"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "conversation_analytics_chatbotId_questionTopicTag_idx" ON "conversation_analytics"("chatbotId", "questionTopicTag");

-- CreateIndex
CREATE INDEX "usage_events_workspaceId_createdAt_idx" ON "usage_events"("workspaceId", "createdAt");

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_onboarding" ADD CONSTRAINT "workspace_onboarding_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbots" ADD CONSTRAINT "chatbots_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "chatbots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_metadata" ADD CONSTRAINT "source_metadata_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_configs" ADD CONSTRAINT "tool_configs_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "chatbots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "chatbots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalation_configs" ADD CONSTRAINT "escalation_configs_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "chatbots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "chatbots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_analytics" ADD CONSTRAINT "conversation_analytics_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "chatbots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
