import { create } from "zustand";
import {
  getWidgetConfig as apiGetConfig,
  updateWidgetConfig as apiUpdate,
  activateWidget as apiActivate,
  type ChatWidget,
} from "@/lib/api/widget";

interface WidgetConfigStore {
  savedConfig: ChatWidget | null;
  localConfig: ChatWidget | null;
  isLoading: boolean;
  isSaving: boolean;
  isActive: boolean;
  error: string | null;

  fetchConfig(workspaceId: string, chatbotId: string): Promise<void>;
  updateLocalConfig(partial: Partial<ChatWidget>): void;
  saveConfig(workspaceId: string, chatbotId: string): Promise<void>;
  discardChanges(): void;
  setActive(workspaceId: string, chatbotId: string, isActive: boolean): Promise<void>;
  getDirtyFields(): Partial<ChatWidget> | null;
  clear(): void;
}

const DEFAULTS: ChatWidget = {
  initialMessages: ["Hi there! How can I help you today?"],
  theme: "LIGHT",
  primaryColor: "#000000",
  bubbleColor: "#000000",
  bubbleAlignment: "BOTTOM_RIGHT",
  isActive: false,
};

export const useWidgetConfigStore = create<WidgetConfigStore>((set, get) => ({
  savedConfig: null,
  localConfig: null,
  isLoading: false,
  isSaving: false,
  isActive: false,
  error: null,

  clear: () => {
    set({
      savedConfig: null,
      localConfig: null,
      isLoading: false,
      isSaving: false,
      isActive: false,
      error: null,
    });
  },

  fetchConfig: async (workspaceId, chatbotId) => {
    set({ isLoading: true, error: null });
    try {
      const config = await apiGetConfig(workspaceId, chatbotId);
      set({
        savedConfig: config,
        localConfig: { ...config },
        isActive: config.isActive,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load widget config.",
        isLoading: false,
      });
    }
  },

  updateLocalConfig: (partial) => {
    const current = get().localConfig;
    if (!current) return;
    set({ localConfig: { ...current, ...partial } });
  },

  saveConfig: async (workspaceId, chatbotId) => {
    const { localConfig, savedConfig } = get();
    if (!localConfig || !savedConfig) return;

    const dirty: Partial<ChatWidget> = {};
    for (const key of Object.keys(localConfig) as (keyof ChatWidget)[]) {
      if (key === "isActive") continue;
      const lv = localConfig[key];
      const sv = savedConfig[key];
      if (JSON.stringify(lv) !== JSON.stringify(sv)) {
        (dirty as any)[key] = lv;
      }
    }

    if (Object.keys(dirty).length === 0) return;

    set({ isSaving: true, error: null });
    try {
      const updated = await apiUpdate(workspaceId, chatbotId, dirty);
      set({
        savedConfig: updated,
        localConfig: { ...updated },
        isSaving: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to save.",
        isSaving: false,
      });
    }
  },

  discardChanges: () => {
    const saved = get().savedConfig;
    if (saved) {
      set({ localConfig: { ...saved }, error: null });
    }
  },

  setActive: async (workspaceId, chatbotId, isActive) => {
    const prev = get().isActive;
    set({ isActive, error: null });
    try {
      const updated = await apiActivate(workspaceId, chatbotId, isActive);
      set({
        savedConfig: updated,
        localConfig: get().localConfig ? { ...get().localConfig!, isActive: updated.isActive } : null,
        isActive: updated.isActive,
      });
    } catch (err) {
      set({
        isActive: prev,
        error: err instanceof Error ? err.message : "Failed to toggle widget.",
      });
    }
  },

  getDirtyFields: () => {
    const { localConfig, savedConfig } = get();
    if (!localConfig || !savedConfig) return null;
    const dirty: Partial<ChatWidget> = {};
    for (const key of Object.keys(localConfig) as (keyof ChatWidget)[]) {
      if (key === "isActive") continue;
      const lv = localConfig[key];
      const sv = savedConfig[key];
      if (JSON.stringify(lv) !== JSON.stringify(sv)) {
        (dirty as any)[key] = lv;
      }
    }
    return Object.keys(dirty).length > 0 ? dirty : null;
  },
}));
