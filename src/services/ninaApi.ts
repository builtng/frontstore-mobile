import api from './api';

export interface NinaMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const ninaApi = {
  chat: async (message: string, history: NinaMessage[] = []): Promise<string> => {
    const { data } = await api.post('/nina/chat', { message, history });
    return data.message as string;
  },
};
