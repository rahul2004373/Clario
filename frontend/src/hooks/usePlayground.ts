"use client";

import { useReducer, useCallback, useEffect, useRef } from "react";
import {
  createSession as apiCreateSession,
  deleteSession as apiDeleteSession,
  deleteSessionKeepalive,
  sendMessageStream,
  type ChatMessage,
} from "@/lib/api/playground";

const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000;

interface PlaygroundState {
  sessionId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  welcomeMessage?: string;
  isInitialising: boolean;
  error: string | null;
  sessionTimedOut: boolean;
}

type Action =
  | { type: "SET_SESSION"; sessionId: string }
  | { type: "ADD_MESSAGE"; message: ChatMessage }
  | { type: "UPDATE_LAST_ASSISTANT"; chunk: string }
  | { type: "STREAM_START" }
  | { type: "STREAM_END" }
  | { type: "STREAM_ERROR"; error: string }
  | { type: "REMOVE_LAST_IF_EMPTY" }
  | { type: "CLEAR" }
  | { type: "SET_INITIALISING"; value: boolean }
  | { type: "SET_ERROR"; error: string | null };

function playgroundReducer(
  state: PlaygroundState,
  action: Action,
): PlaygroundState {
  switch (action.type) {
    case "SET_SESSION":
      return {
        ...state,
        sessionId: action.sessionId,
        isInitialising: false,
        error: null,
      };
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.message],
      };
    case "UPDATE_LAST_ASSISTANT": {
      const msgs = state.messages;
      if (msgs.length === 0) return state;
      const last = msgs[msgs.length - 1];
      if (last.role !== "ASSISTANT") return state;
      const updated: ChatMessage = {
        ...last,
        content: last.content + action.chunk,
      };
      return {
        ...state,
        messages: [...msgs.slice(0, -1), updated],
      };
    }
    case "STREAM_START":
      return { ...state, isStreaming: true, error: null };
    case "STREAM_END":
      return { ...state, isStreaming: false };
    case "STREAM_ERROR":
      return { ...state, isStreaming: false, error: action.error };
    case "REMOVE_LAST_IF_EMPTY": {
      const msgs = state.messages;
      if (msgs.length === 0) return state;
      const last = msgs[msgs.length - 1];
      if (last.role === "ASSISTANT" && last.content === "") {
        return { ...state, messages: msgs.slice(0, -1) };
      }
      return state;
    }
    case "CLEAR":
      return {
        sessionId: null,
        messages: [],
        isStreaming: false,
        welcomeMessage: "Hi! What can I help you with?",
        isInitialising: false,
        error: null,
        sessionTimedOut: false,
      };
    case "SET_INITIALISING":
      return { ...state, isInitialising: action.value };
    case "SET_ERROR":
      return { ...state, error: action.error };
    default:
      return state;
  }
}

const INITIAL: PlaygroundState = {
  sessionId: null,
  messages: [],
  isStreaming: false,
  welcomeMessage: "Hi! What can I help you with?",
  isInitialising: false,
  error: null,
  sessionTimedOut: false,
};

let msgCounter = 0;

export function usePlayground(workspaceId: string, chatbotId: string) {
  const [state, dispatch] = useReducer(playgroundReducer, INITIAL);

  const sessionIdRef = useRef<string | null>(null);
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const creatingRef = useRef(false);

  // Keep ref in sync with state
  sessionIdRef.current = state.sessionId;

  const clearInactivityTimer = useCallback(() => {
    if (inactivityRef.current) {
      clearTimeout(inactivityRef.current);
      inactivityRef.current = null;
    }
  }, []);

  const startInactivityTimer = useCallback(() => {
    clearInactivityTimer();
    inactivityRef.current = setTimeout(async () => {
      const sid = sessionIdRef.current;
      if (sid) {
        try {
          await apiDeleteSession(workspaceId, chatbotId, sid);
        } catch {
          // silent
        }
      }
      dispatch({ type: "CLEAR" });
    }, INACTIVITY_TIMEOUT_MS);
  }, [workspaceId, chatbotId, clearInactivityTimer]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (state.isStreaming || creatingRef.current) return;

      let currentSessionId = state.sessionId;

      // Create session lazily on first message only
      if (!currentSessionId) {
        creatingRef.current = true;
        try {
          const res = await apiCreateSession(workspaceId, chatbotId);
          currentSessionId = res.sessionId;
          dispatch({ type: "SET_SESSION", sessionId: res.sessionId });
          sessionIdRef.current = res.sessionId;
        } catch (err) {
          creatingRef.current = false;
          dispatch({
            type: "SET_ERROR",
            error: err instanceof Error ? err.message : "Failed to create session",
          });
          return;
        }
        creatingRef.current = false;
      }

      // Reset inactivity timer on every message
      startInactivityTimer();

      const userMsg: ChatMessage = {
        id: `msg-${++msgCounter}`,
        role: "USER",
        content,
      };
      dispatch({ type: "ADD_MESSAGE", message: userMsg });

      const assistantMsg: ChatMessage = {
        id: `msg-${++msgCounter}`,
        role: "ASSISTANT",
        content: "",
      };
      dispatch({ type: "ADD_MESSAGE", message: assistantMsg });
      dispatch({ type: "STREAM_START" });

      let streamError = false;

      await sendMessageStream(workspaceId, chatbotId, currentSessionId, content, {
        onChunk: (text: string) => {
          dispatch({ type: "UPDATE_LAST_ASSISTANT", chunk: text });
        },
        onDone: () => {
          // already handled
        },
        onError: (error: string) => {
          streamError = true;
          dispatch({ type: "STREAM_ERROR", error });
          dispatch({ type: "REMOVE_LAST_IF_EMPTY" });
        },
      });

      if (!streamError) {
        dispatch({ type: "STREAM_END" });
      }
    },
    [workspaceId, chatbotId, state.sessionId, state.isStreaming, startInactivityTimer],
  );

  const clearChat = useCallback(async () => {
    clearInactivityTimer();
    dispatch({ type: "CLEAR" });
  }, [clearInactivityTimer]);

  // Close session on page reload/unload
  useEffect(() => {
    if (!state.sessionId) return;

    const handleBeforeUnload = () => {
      const sid = sessionIdRef.current;
      if (sid) {
        deleteSessionKeepalive(workspaceId, chatbotId, sid);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Also close on unmount (navigating away)
      const sid = sessionIdRef.current;
      if (sid) {
        deleteSessionKeepalive(workspaceId, chatbotId, sid);
      }
    };
  }, [workspaceId, chatbotId, state.sessionId]);

  // Clean up inactivity timer on unmount
  useEffect(() => {
    return () => {
      clearInactivityTimer();
    };
  }, [clearInactivityTimer]);

  return {
    ...state,
    sendMessage,
    clearChat,
  };
}
