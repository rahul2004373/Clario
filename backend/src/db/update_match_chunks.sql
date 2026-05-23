-- Run this in your Supabase SQL Editor to update the match_chunks function.
-- This supports filtering by an array of source_ids. If the array is NULL or empty, it searches all sources in the workspace.

CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding  vector(3072),
  p_workspace_id   TEXT,
  p_source_ids     TEXT[] DEFAULT NULL,
  match_count      INT   DEFAULT 5,
  match_threshold  FLOAT DEFAULT 0.5
)
RETURNS TABLE (id UUID, source_id TEXT, content TEXT, metadata JSONB, score FLOAT)
LANGUAGE sql STABLE AS
$$
  SELECT id, source_id, content, metadata,
         1 - (embedding <=> query_embedding) AS score
  FROM chunks
  WHERE workspace_id = p_workspace_id
    AND (
      p_source_ids IS NULL 
      OR array_length(p_source_ids, 1) IS NULL 
      OR source_id = ANY(p_source_ids)
    )
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
