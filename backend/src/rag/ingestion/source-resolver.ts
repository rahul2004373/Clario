import { createClient } from "@supabase/supabase-js";
import { env } from "../../config/env";
import type { IngestionInput, SourceType } from "../types";

let storageClient: any = null;

function getStorageClient() {
  if (storageClient) {
    return storageClient;
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for storage resolution");
  }

  storageClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  return storageClient;
}

export function resolveSourceType(input: IngestionInput): SourceType {
  return input.sourceType;
}

export function resolveSourceUrl(input: IngestionInput): string | null {
  if (input.rawContentUrl?.trim()) {
    return input.rawContentUrl.trim();
  }

  if (input.storageBucket?.trim() && input.storagePath?.trim()) {
    return null;
  }

  return null;
}

export async function resolveStorageUrl(input: IngestionInput): Promise<string | null> {
  if (input.rawContentUrl?.trim()) {
    return input.rawContentUrl.trim();
  }

  const bucket = input.storageBucket?.trim() || env.SUPABASE_STORAGE_BUCKET;
  const path = input.storagePath?.trim();

  if (!path) {
    return null;
  }

  if (!bucket) {
    throw new Error("storageBucket is required when storagePath is provided");
  }

  const supabase: any = getStorageClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, env.SUPABASE_SIGNED_URL_TTL);

  if (error) {
    throw new Error(`Failed to create signed URL for ${bucket}/${path}: ${error.message}`);
  }

  return data?.signedUrl ?? null;
}

export async function uploadFileToStorage(params: {
  bucket?: string | null;
  path?: string | null;
  buffer: Buffer;
  contentType?: string | null;
}) {
  const bucket = params.bucket?.trim() || env.SUPABASE_STORAGE_BUCKET;
  const path = params.path?.trim();

  if (!bucket) {
    throw new Error("SUPABASE_STORAGE_BUCKET is required");
  }

  if (!path) {
    throw new Error("storagePath is required for file upload");
  }

  const supabase: any = getStorageClient();
  const { data, error } = await supabase.storage.from(bucket).upload(path, params.buffer, {
    contentType: params.contentType ?? "application/octet-stream",
    upsert: true
  });

  if (error) {
    throw new Error(`Failed to upload file to ${bucket}/${path}: ${error.message}`);
  }

  return {
    bucket,
    path: data?.path ?? path
  };
}
