import { create } from "zustand";
import {
  getChatbots,
  getChatbot,
  createChatbot as apiCreateChatbot,
  updateChatbot as apiUpdateChatbot,
  deleteChatbot as apiDeleteChatbot,
  publishChatbot as apiPublishChatbot,
  type Chatbot,
} from "@/lib/api/chatbots";
import { UnauthorizedError, ForbiddenError, ApiError } from "@/lib/api/client";

interface ChatbotStore {
  chatbots: Chatbot[];
  currentChatbot: Chatbot | null;
  currentChatbotId: string | null;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;

  fetchChatbots(workspaceId: string): Promise<void>;
  fetchChatbot(workspaceId: string, chatbotId: string): Promise<void>;
  createChatbot(
    workspaceId: string,
    data: { name: string; systemPrompt: string; description?: string },
  ): Promise<Chatbot>;
  updateChatbot(
    workspaceId: string,
    chatbotId: string,
    data: Partial<Chatbot>,
  ): Promise<void>;
  deleteChatbot(workspaceId: string, chatbotId: string): Promise<void>;
  publishChatbot(
    workspaceId: string,
    chatbotId: string,
    isPublished: boolean,
  ): Promise<void>;
  setCurrentChatbotId(id: string | null): void;
  clear(): void;
  clearChatbots(): void;
}

export const useChatbotStore = create<ChatbotStore>((set, get) => ({
  chatbots: [],
  currentChatbot: null,
  currentChatbotId: null,
  isLoading: false,
  isFetching: false,
  error: null,

  clear: () => {
    set({
      currentChatbot: null,
      currentChatbotId: null,
      isLoading: false,
      isFetching: false,
      error: null,
    });
  },

  clearChatbots: () => {
    set({ chatbots: [] });
  },

  fetchChatbots: async (workspaceId: string) => {
    set({ isLoading: true, error: null, chatbots: [] });
    try {
      const { chatbots } = await getChatbots(workspaceId);
      set({ chatbots, isLoading: false });
    } catch (err) {
      if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
        set({ isLoading: false });
        throw err;
      }
      set({
        error:
          err instanceof ApiError
            ? err.message
            : "Failed to load chatbots.",
        isLoading: false,
      });
    }
  },

  fetchChatbot: async (workspaceId: string, chatbotId: string) => {
    set({ isFetching: true, error: null, currentChatbotId: chatbotId });
    try {
      const { chatbot } = await getChatbot(workspaceId, chatbotId);
      set({ currentChatbot: chatbot, isFetching: false });
    } catch (err) {
      set({ isFetching: false });
      throw err;
    }
  },

  createChatbot: async (workspaceId, data) => {
    set({ error: null });
    const result = await apiCreateChatbot(workspaceId, data);
    const partial: Chatbot = {
      ...result.chatbot,
      workspaceId,
      description: data.description,
      systemPrompt: data.systemPrompt,
      isPublished: false,
      promptVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Chatbot;
    const chatbots = [...get().chatbots, partial];
    set({ chatbots });
    return partial;
  },

  updateChatbot: async (workspaceId, chatbotId, data) => {
    set({ error: null });
    const result = await apiUpdateChatbot(workspaceId, chatbotId, data);
    const currentChatbot = get().currentChatbot;
    if (currentChatbot?.id === chatbotId) {
      set({
        currentChatbot: { ...currentChatbot, ...result.chatbot } as Chatbot,
      });
    }
    const chatbots = get().chatbots.map((c) =>
      c.id === chatbotId ? ({ ...c, ...result.chatbot } as Chatbot) : c,
    );
    set({ chatbots });
  },

  deleteChatbot: async (workspaceId, chatbotId) => {
    set({ error: null });
    await apiDeleteChatbot(workspaceId, chatbotId);
    set({
      chatbots: get().chatbots.filter((c) => c.id !== chatbotId),
      currentChatbot:
        get().currentChatbot?.id === chatbotId
          ? null
          : get().currentChatbot,
      currentChatbotId:
        get().currentChatbotId === chatbotId
          ? null
          : get().currentChatbotId,
    });
  },

  publishChatbot: async (workspaceId, chatbotId, isPublished) => {
    const previous = get().currentChatbot;
    const previousList = [...get().chatbots];

    set({
      currentChatbot: previous
        ? { ...previous, isPublished }
        : null,
      chatbots: get().chatbots.map((c) =>
        c.id === chatbotId ? { ...c, isPublished } : c,
      ),
    });

    try {
      await apiPublishChatbot(workspaceId, chatbotId, isPublished);
    } catch {
      set({
        currentChatbot: previous,
        chatbots: previousList,
      });
    }
  },

  setCurrentChatbotId: (id) => {
    set({ currentChatbotId: id });
  },
}));
