import { create } from "zustand";
import {
  listWorkspaceConversations,
  listChatbotConversations,
  getConversation,
  getMessages,
  updateConversationStatus,
  deleteConversation as apiDelete,
  type Conversation,
  type Message,
} from "@/lib/api/conversations";

interface ConversationFilters {
  status?: "active" | "resolved";
}

interface ConversationStore {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  messagesMap: Record<string, Message[]>;
  page: number;
  hasMore: boolean;
  filters: ConversationFilters;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isLoadingDetails: boolean;
  error: string | null;

  fetchConversations(
    workspaceId: string,
    chatbotId?: string,
  ): Promise<void>;
  fetchMoreConversations(
    workspaceId: string,
    chatbotId?: string,
  ): Promise<void>;
  fetchConversationDetails(
    workspaceId: string,
    conversationId: string,
  ): Promise<void>;
  fetchMessages(
    workspaceId: string,
    conversationId: string,
  ): Promise<void>;
  updateStatus(
    workspaceId: string,
    conversationId: string,
    data: { isResolved?: boolean; isActive?: boolean },
  ): Promise<void>;
  deleteConversation(
    workspaceId: string,
    conversationId: string,
  ): Promise<void>;
  setFilters(filters: ConversationFilters): void;
  setSelectedConversation(conversation: Conversation | null): void;
  clear(): void;
}

const LIMIT = 20;

export const useConversationStore = create<ConversationStore>((set, get) => ({
  conversations: [],
  selectedConversation: null,
  messagesMap: {},
  page: 1,
  hasMore: true,
  filters: {},
  isLoadingConversations: false,
  isLoadingMessages: false,
  isLoadingDetails: false,
  error: null,

  clear: () => {
    set({
      conversations: [],
      selectedConversation: null,
      messagesMap: {},
      page: 1,
      hasMore: true,
      filters: {},
      isLoadingConversations: false,
      isLoadingMessages: false,
      isLoadingDetails: false,
      error: null,
    });
  },

  fetchConversations: async (workspaceId, chatbotId) => {
    set({ isLoadingConversations: true, error: null, page: 1, hasMore: true });
    try {
      const response = chatbotId
        ? await listChatbotConversations(workspaceId, chatbotId, {
            page: 1,
            limit: LIMIT,
            status: get().filters.status,
          })
        : await listWorkspaceConversations(workspaceId, {
            page: 1,
            limit: LIMIT,
            status: get().filters.status,
          });
      const data = response.data ?? [];
      const pagination = response.pagination;
      set({
        conversations: data,
        page: pagination.page,
        hasMore: pagination.page < pagination.totalPages,
        isLoadingConversations: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load conversations.",
        isLoadingConversations: false,
      });
    }
  },

  fetchMoreConversations: async (workspaceId, chatbotId) => {
    const { hasMore, page } = get();
    if (!hasMore) return;
    try {
      const response = chatbotId
        ? await listChatbotConversations(workspaceId, chatbotId, {
            page: page + 1,
            limit: LIMIT,
            status: get().filters.status,
          })
        : await listWorkspaceConversations(workspaceId, {
            page: page + 1,
            limit: LIMIT,
            status: get().filters.status,
          });
      const data = response.data ?? [];
      const pagination = response.pagination;
      set({
        conversations: [...get().conversations, ...data],
        page: pagination.page,
        hasMore: pagination.page < pagination.totalPages,
      });
    } catch {
      // silently fail for load-more
    }
  },

  fetchConversationDetails: async (workspaceId, conversationId) => {
    set({ isLoadingDetails: true });
    try {
      const raw = await getConversation(workspaceId, conversationId);
      const conversation = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : null;
      set({ selectedConversation: conversation, isLoadingDetails: false });
    } catch {
      set({ isLoadingDetails: false });
    }
  },

  fetchMessages: async (workspaceId, conversationId) => {
    const cached = get().messagesMap[conversationId];
    if (cached) return;
    set({ isLoadingMessages: true });
    try {
      const raw = await getMessages(workspaceId, conversationId);
      const messages = Array.isArray(raw) ? raw : [];
      set({
        messagesMap: { ...get().messagesMap, [conversationId]: messages },
        isLoadingMessages: false,
      });
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  updateStatus: async (workspaceId, conversationId, data) => {
    const result = await updateConversationStatus(
      workspaceId,
      conversationId,
      data,
    );
    set({
      conversations: get().conversations.map((c) =>
        c.id === conversationId
          ? { ...c, isActive: result.isActive, resolvedAt: result.resolvedAt }
          : c,
      ),
      selectedConversation:
        get().selectedConversation?.id === conversationId
          ? {
              ...get().selectedConversation!,
              isActive: result.isActive,
              resolvedAt: result.resolvedAt,
            }
          : get().selectedConversation,
    });
  },

  deleteConversation: async (workspaceId, conversationId) => {
    await apiDelete(workspaceId, conversationId);
    const currentSelectedId = get().selectedConversation?.id;
    set({
      conversations: get().conversations.filter((c) => c.id !== conversationId),
      selectedConversation:
        currentSelectedId === conversationId ? null : get().selectedConversation,
      messagesMap: Object.fromEntries(
        Object.entries(get().messagesMap).filter(([k]) => k !== conversationId),
      ),
    });
  },

  setFilters: (filters) => {
    set({ filters });
  },

  setSelectedConversation: (conversation) => {
    set({ selectedConversation: conversation });
  },
}));
