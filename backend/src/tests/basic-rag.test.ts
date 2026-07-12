import { runIngestionPipeline } from "../rag/ingestion/pipeline";
import { runQueryPipeline, runQueryPipelineStream } from "../rag/retrieval/query-pipeline";

async function main() {
  const workspaceId = "test-workspace-123";
  const sourceId = "test-doc-abc";

  console.log("=== 1. Testing Ingestion Pipeline ===");
  const testText = `
  Clairo is a multi-tenant AI agent platform.
  It enables businesses to create intelligent chatbots trained on their own data.
  
  The key verticals for Clairo are:
  - E-commerce: Handling order tracking and return queries.
  - SaaS: Product documentation lookup and bug reporting.
  - Healthcare: Appointment booking.
  - Education: Student portals.
  
  This is a specific test token: SECRET_CODE_9988.
  `;

  console.log("Ingesting sample text into the database...");
  const ingestResult = await runIngestionPipeline({
    sourceId,
    workspaceId,
    sourceType: "text",
    content: testText,
    metadata: { test: true }
  });

  console.log("Ingestion completed successfully!");
  console.log("Chunks created:", ingestResult.chunkCount);
  console.log("Characters processed:", ingestResult.charCount);

  console.log("\n=== 2. Testing Query Retrieval (Non-Streaming) ===");
  const query = "What are the key verticals of Clairo?";
  console.log(`Query: "${query}"`);

  const queryResult = await runQueryPipeline({
    query,
    workspaceId,
    topK: 3,
    threshold: 0.1
  });

  console.log("Context Chunks Retrieved:", queryResult.context.length);
  queryResult.context.forEach((c, idx) => {
    console.log(`  [Chunk ${idx + 1}] Similarity: ${c.similarity.toFixed(4)}`);
    console.log(`    Content: "${c.content.replace(/\n/g, " ")}"`);
  });
  console.log("\nGenerated Answer:");
  console.log(queryResult.answer);

  console.log("\n=== 3. Testing Query Retrieval (Streaming) ===");
  const streamQuery = "What is the secret code in the document?";
  console.log(`Query: "${streamQuery}"`);

  const streamResult = await runQueryPipelineStream({
    query: streamQuery,
    workspaceId,
    topK: 3,
    threshold: 0.1
  });

  console.log("Context Chunks Retrieved:", streamResult.context.length);
  console.log("\nStreaming Answer tokens: ");
  for await (const token of streamResult.tokenStream) {
    process.stdout.write(token);
  }
  console.log("\n\n=== RAG Tests Completed ===");
}

main().catch((err) => {
  console.error("Test failed with error:", err);
});
