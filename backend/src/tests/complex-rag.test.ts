import { runIngestionPipeline } from "../rag/ingestion/pipeline";
import { runQueryPipeline, runQueryPipelineStream } from "../rag/retrieval/query-pipeline";
import { generateRoutedResponse } from "../rag/retrieval/llm-router";

async function main() {
  const workspaceId = "test-workspace-complex";
  
  console.log("=== 1. Ingesting Multiple Documents ===");
  const docs = [
    {
      id: "doc-1",
      content: "Clario's pricing model is tier-based. The Starter tier is $29/mo and includes 1000 AI interactions. The Pro tier is $99/mo and includes unlimited interactions and custom API access."
    },
    {
      id: "doc-2",
      content: "To integrate Clario with Slack, navigate to Settings > Integrations, click 'Add Slack', and authorize the workspace. You will need admin privileges in your Slack workspace."
    },
    {
      id: "doc-3",
      content: "The advanced RAG engine in Clario supports multi-modal embeddings, though the current version relies solely on text chunks. The default similarity threshold is 0.7."
    }
  ];

  for (const doc of docs) {
    console.log(`Ingesting ${doc.id}...`);
    await runIngestionPipeline({
      sourceId: doc.id,
      workspaceId,
      sourceType: "text",
      content: doc.content,
      metadata: { docId: doc.id }
    });
  }
  console.log("Ingestion complete.\n");

  console.log("=== 2. Testing Specific Fact Retrieval ===");
  const query1 = "How much does the Pro tier cost and what does it include?";
  console.log(`Query: "${query1}"`);
  const result1 = await runQueryPipeline({
    query: query1,
    workspaceId,
    topK: 2,
    threshold: 0.5
  });
  console.log("Context retrieved:", result1.context.length, "chunks");
  console.log("Answer:", result1.answer, "\n");

  console.log("=== 3. Testing Out-of-Domain / No Context ===");
  const query2 = "How do I bake a chocolate cake?";
  console.log(`Query: "${query2}"`);
  const result2 = await runQueryPipeline({
    query: query2,
    workspaceId,
    topK: 2,
    threshold: 0.8 // High threshold so it finds nothing
  });
  console.log("Context retrieved:", result2.context.length, "chunks");
  console.log("Answer:", result2.answer, "\n");

  console.log("=== 4. Testing Direct LLM Router Access (No RAG) ===");
  console.log("Testing generic router generation...");
  const directResponse = await generateRoutedResponse({
    systemPrompt: "You are a helpful assistant.",
    question: "What is 2 + 2? Answer in one word.",
    context: "",
    temperature: 0.1
  });
  console.log("Direct LLM Response:", directResponse, "\n");

  console.log("=== Complex RAG Tests Completed ===");
}

main().catch(console.error);
