import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage } from '../types/chat';

type ChatState = {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clear: () => void;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      clear: () => set({ messages: [] }),
    }),
    { name: 'week2-chat' },
  ),
);
