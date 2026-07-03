import { create } from 'zustand';

export interface NinaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface NinaStore {
  messages: NinaMessage[];
  isTyping: boolean;
  addUserMessage: (content: string) => NinaMessage;
  addAssistantMessage: (content: string) => void;
  setTyping: (typing: boolean) => void;
  clearChat: () => void;
}

export const useNinaStore = create<NinaStore>((set, get) => ({
  messages: [],
  isTyping: false,

  addUserMessage: (content) => {
    const msg: NinaMessage = {
      id: `${Date.now()}-u`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    set((s) => ({ messages: [...s.messages, msg] }));
    return msg;
  },

  addAssistantMessage: (content) => {
    const msg: NinaMessage = {
      id: `${Date.now()}-a`,
      role: 'assistant',
      content,
      timestamp: Date.now(),
    };
    set((s) => ({ messages: [...s.messages, msg], isTyping: false }));
  },

  setTyping: (typing) => set({ isTyping: typing }),

  clearChat: () => set({ messages: [], isTyping: false }),
}));
