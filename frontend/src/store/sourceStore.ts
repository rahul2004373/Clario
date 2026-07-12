import { create } from "zustand";
import {
  listSources,
  getSource,
  uploadSource as apiUpload,
  createUrlSource as apiCreateUrl,
  createTextSource as apiCreateText,
  updateSource as apiUpdate,
  deleteSource as apiDelete,
  reingestSource as apiReingest,
  listJobs,
  type Source,
  type IngestionJob,
  type SourceMetadata,
} from "@/lib/api/sources";

interface SourceStore {
  sources: Source[];
  selectedSource: Source | null;
  jobs: IngestionJob[];
  isLoading: boolean;
  isFetchingJobs: boolean;
  error: string | null;

  fetchSources(workspaceId: string, chatbotId: string): Promise<void>;
  fetchSource(
    workspaceId: string,
    chatbotId: string,
    sourceId: string,
  ): Promise<Source>;
  uploadSource(
    workspaceId: string,
    chatbotId: string,
    file: File,
    name?: string,
  ): Promise<Source>;
  createUrlSource(
    workspaceId: string,
    chatbotId: string,
    data: { name: string; sourceUrl: string },
  ): Promise<Source>;
  createTextSource(
    workspaceId: string,
    chatbotId: string,
    data: { name: string; content: string },
  ): Promise<Source>;
  updateSource(
    workspaceId: string,
    chatbotId: string,
    sourceId: string,
    data: { name?: string; metadata?: SourceMetadata },
  ): Promise<void>;
  deleteSource(
    workspaceId: string,
    chatbotId: string,
    sourceId: string,
  ): Promise<void>;
  reingestSource(
    workspaceId: string,
    chatbotId: string,
    sourceId: string,
  ): Promise<void>;
  fetchJobs(workspaceId: string, chatbotId: string): Promise<void>;
  setSelectedSource(source: Source | null): void;
  clear(): void;
}

export const useSourceStore = create<SourceStore>((set, get) => ({
  sources: [],
  selectedSource: null,
  jobs: [],
  isLoading: false,
  isFetchingJobs: false,
  error: null,

  clear: () => {
    set({
      sources: [],
      selectedSource: null,
      jobs: [],
      isLoading: false,
      isFetchingJobs: false,
      error: null,
    });
  },

  fetchSources: async (workspaceId, chatbotId) => {
    set({ isLoading: true, error: null, sources: [] });
    try {
      const { sources } = await listSources(workspaceId, chatbotId);
      set({ sources, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load sources.",
        isLoading: false,
      });
    }
  },

  fetchSource: async (workspaceId, chatbotId, sourceId) => {
    const { source } = await getSource(workspaceId, chatbotId, sourceId);
    return source;
  },

  uploadSource: async (workspaceId, chatbotId, file, name) => {
    const result = await apiUpload(workspaceId, chatbotId, file, name);
    const source = { ...result.source, chatbotId } as Source;
    set({ sources: [...get().sources, source] });
    return source;
  },

  createUrlSource: async (workspaceId, chatbotId, data) => {
    const result = await apiCreateUrl(workspaceId, chatbotId, data);
    const source = { ...result.source, chatbotId } as Source;
    set({ sources: [...get().sources, source] });
    return source;
  },

  createTextSource: async (workspaceId, chatbotId, data) => {
    const result = await apiCreateText(workspaceId, chatbotId, data);
    const source = { ...result.source, chatbotId } as Source;
    set({ sources: [...get().sources, source] });
    return source;
  },

  updateSource: async (workspaceId, chatbotId, sourceId, data) => {
    const result = await apiUpdate(workspaceId, chatbotId, sourceId, data);
    set({
      sources: get().sources.map((s) =>
        s.id === sourceId ? { ...s, ...result.source } as Source : s,
      ),
      selectedSource:
        get().selectedSource?.id === sourceId
          ? { ...get().selectedSource, ...result.source } as Source
          : get().selectedSource,
    });
  },

  deleteSource: async (workspaceId, chatbotId, sourceId) => {
    await apiDelete(workspaceId, chatbotId, sourceId);
    set({
      sources: get().sources.filter((s) => s.id !== sourceId),
      selectedSource:
        get().selectedSource?.id === sourceId
          ? null
          : get().selectedSource,
    });
  },

  reingestSource: async (workspaceId, chatbotId, sourceId) => {
    await apiReingest(workspaceId, chatbotId, sourceId);
  },

  fetchJobs: async (workspaceId, chatbotId) => {
    set({ isFetchingJobs: true });
    try {
      const { jobs } = await listJobs(workspaceId, chatbotId);
      set({ jobs, isFetchingJobs: false });
    } catch {
      set({ isFetchingJobs: false });
    }
  },

  setSelectedSource: (source) => {
    set({ selectedSource: source });
  },
}));
