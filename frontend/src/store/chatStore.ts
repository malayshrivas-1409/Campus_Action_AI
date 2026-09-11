import { create } from 'zustand';
import { Message, Conversation } from '@/types';
import { chatAPI } from '@/services/api';

interface ChatStore {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;

  fetchConversations: () => Promise<void>;
  fetchConversationMessages: (conversationId: string) => Promise<void>;
  createConversation: (title: string) => Promise<Conversation>;
  deleteConversation: (conversationId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  clearError: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  error: null,

  fetchConversations: async () => {
    set({ loading: true, error: null });
    try {
      const response = await chatAPI.listConversations();
      set({ conversations: response.data });
    } catch (err: any) {
      const error = err.response?.data?.detail || 'Failed to fetch conversations';
      set({ error });
    } finally {
      set({ loading: false });
    }
  },

  fetchConversationMessages: async (conversationId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await chatAPI.getConversation(conversationId);
      set({
        currentConversation: response.data,
        messages: response.data.messages || [],
      });
    } catch (err: any) {
      const error = err.response?.data?.detail || 'Failed to fetch messages';
      set({ error });
    } finally {
      set({ loading: false });
    }
  },

  createConversation: async (title: string) => {
    try {
      // Note: API doesn't have direct create endpoint
      // Creating implicit conversation through first message
      return {
        id: '',
        user_id: '',
        title,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } catch (err: any) {
      const error = err.response?.data?.detail || 'Failed to create conversation';
      set({ error });
      throw err;
    }
  },

  deleteConversation: async (conversationId: string) => {
    try {
      await chatAPI.deleteConversation(conversationId);
      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== conversationId),
      }));
    } catch (err: any) {
      const error = err.response?.data?.detail || 'Failed to delete conversation';
      set({ error });
      throw err;
    }
  },

  addMessage: (message: Message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  clearError: () => set({ error: null }),
}));
