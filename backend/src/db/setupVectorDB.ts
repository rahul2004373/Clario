import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const vectorDB = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// ── SQL strings (no backtick template literals — avoids $$ parser issue) ──────

const CREATE_EXTENSION = 'CREATE EXTENSION IF NOT EXISTS vector;';

const DROP_TABLE = 'DROP TABLE IF EXISTS chunks CASCADE;';

const CREATE_TABLE = [
  'CREATE TABLE IF NOT EXISTS chunks (',
  '  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),',
  '  source_id     TEXT        NOT NULL,',
  '  workspace_id  TEXT        NOT NULL,',
  '  content       TEXT        NOT NULL,',
  '  chunk_index   INTEGER     NOT NULL,',
  '  token_count   INTEGER,',
  '  embedding     vector(3072), -- Updated for gemini-embedding-001',
  "  metadata      JSONB       DEFAULT '{}',",
  '  created_at    TIMESTAMPTZ DEFAULT now()',
  ');',
].join('\n');

const CREATE_HNSW_INDEX = [
  'CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw_idx',
  'ON chunks USING hnsw (embedding vector_cosine_ops)',
  'WITH (m = 16, ef_construction = 64);',
].join('\n');

const CREATE_WORKSPACE_INDEX =
  'CREATE INDEX IF NOT EXISTS idx_chunks_workspace ON chunks(workspace_id);';

const CREATE_SOURCE_INDEX =
  'CREATE INDEX IF NOT EXISTS idx_chunks_source ON chunks(source_id);';

// Note: $$ written as string concatenation to avoid TS parser bug
const DOLLAR = '$';
const CREATE_MATCH_FN = [
  'CREATE OR REPLACE FUNCTION match_chunks(',
  '  query_embedding  vector(3072),',
  '  p_workspace_id   TEXT,',
  '  p_source_ids     TEXT[] DEFAULT NULL,',
  '  match_count      INT   DEFAULT 5,',
  '  match_threshold  FLOAT DEFAULT 0.5',
  ')',
  'RETURNS TABLE (id UUID, source_id TEXT, content TEXT, metadata JSONB, score FLOAT)',
  'LANGUAGE sql STABLE AS',
  DOLLAR + DOLLAR,
  '  SELECT id, source_id, content, metadata,',
  '         1 - (embedding <=> query_embedding) AS score',
  '  FROM chunks',
  '  WHERE workspace_id = p_workspace_id',
  '    AND (p_source_ids IS NULL OR array_length(p_source_ids, 1) IS NULL OR source_id = ANY(p_source_ids))',
  '    AND 1 - (embedding <=> query_embedding) > match_threshold',
  '  ORDER BY embedding <=> query_embedding',
  '  LIMIT match_count;',
  DOLLAR + DOLLAR + ';',
].join('\n');

const ENABLE_RLS = 'ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;';

const CREATE_POLICY = [
  'DO',
  DOLLAR + DOLLAR,
  'BEGIN',
  '  IF NOT EXISTS (',
  '    SELECT 1 FROM pg_policies',
  "    WHERE tablename = 'chunks' AND policyname = 'service_role_all'",
  '  ) THEN',
  "    CREATE POLICY \"service_role_all\" ON chunks FOR ALL USING (true);",
  '  END IF;',
  'END',
  DOLLAR + DOLLAR + ';',
].join('\n');

// ── Steps ─────────────────────────────────────────────────────────────────────

const steps: Array<{ name: string; sql: string }> = [
  { name: 'Enable pgvector extension', sql: CREATE_EXTENSION },
  { name: 'Drop existing chunks table', sql: DROP_TABLE },
  { name: 'Create chunks table', sql: CREATE_TABLE },
  { name: 'Create HNSW index', sql: CREATE_HNSW_INDEX },
  { name: 'Create workspace index', sql: CREATE_WORKSPACE_INDEX },
  { name: 'Create source index', sql: CREATE_SOURCE_INDEX },
  { name: 'Create match_chunks RPC', sql: CREATE_MATCH_FN },
  { name: 'Enable RLS', sql: ENABLE_RLS },
  { name: 'Create RLS policy', sql: CREATE_POLICY },
];

// ── Run SQL via Supabase REST ─────────────────────────────────────────────────

async function runSQL(sql: string): Promise<{ ok: boolean; msg: string }> {
  const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/exec_sql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
    },
    body: JSON.stringify({ sql }),
  });
  if (res.ok) return { ok: true, msg: '' };
  return { ok: false, msg: await res.text() };
}

// ── Verify setup works ────────────────────────────────────────────────────────

async function verifySetup(): Promise<void> {
  console.log('\n🧪 Verifying...\n');

  // 1. Table accessible
  const { error: tableErr } = await vectorDB.from('chunks').select('id').limit(1);
  if (tableErr) {
    console.log('  ❌ chunks table not found:', tableErr.message);
    console.log('  👉 Run src/db/chunks.sql manually in Supabase SQL Editor');
    return;
  }
  console.log('  ✅ chunks table accessible');

  // 2. Insert test row
  const dummy: number[] = Array(3072).fill(0.1);
  const { error: insertErr } = await vectorDB.from('chunks').insert({
    source_id: 'setup-test',
    workspace_id: 'setup-test',
    content: 'setup verification row',
    chunk_index: 0,
    token_count: 5,
    embedding: dummy,
    metadata: {},
  });
  if (insertErr) {
    console.log('  ❌ Insert failed:', insertErr.message);
    return;
  }
  console.log('  ✅ Insert works');

  // 3. RPC search
  const { data, error: rpcErr } = await vectorDB.rpc('match_chunks', {
    query_embedding: dummy,
    p_workspace_id: 'setup-test',
    match_count: 5,
    match_threshold: 0.0,
  });
  if (rpcErr) {
    console.log('  ❌ match_chunks RPC failed:', rpcErr.message);
    console.log('  👉 Run the CREATE FUNCTION SQL in Supabase SQL Editor');
  } else {
    console.log('  ✅ match_chunks RPC works —', (data as unknown[])?.length, 'result(s)');
  }

  // Cleanup
  await vectorDB.from('chunks').delete().eq('workspace_id', 'setup-test');
  console.log('  ✅ Test data cleaned\n');
  console.log('🎉 Supabase vector DB is ready!\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
  }

  console.log('🔧 Setting up Supabase vector DB...\n');
  let manualNeeded = false;

  for (const step of steps) {
    process.stdout.write('  ' + step.name + '...');
    const result = await runSQL(step.sql);

    if (result.ok) {
      console.log(' ✅');
    } else {
      let parsed: { message?: string; code?: string } = {};
      try { parsed = JSON.parse(result.msg); } catch { /* ignore */ }

      if (parsed.code === 'PGRST202' || result.msg.includes('exec_sql')) {
        console.log(' ⚠️  skipped (exec_sql not on free tier)');
        manualNeeded = true;
      } else if (result.msg.includes('already exists')) {
        console.log(' ✅ (already exists)');
      } else {
        console.log(' ❌');
        console.error('    ' + result.msg.slice(0, 150));
        manualNeeded = true;
      }
    }
  }

  if (manualNeeded) {
    console.log('\n⚠️  Some steps need manual SQL.');
    console.log('   Go to Supabase Dashboard → SQL Editor');
    console.log('   Copy & run: src/db/chunks.sql\n');
  }

  await verifySetup();
}

main().catch(console.error);