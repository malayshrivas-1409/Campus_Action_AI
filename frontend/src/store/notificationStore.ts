import { create } from 'zustand';
import { Notification } from '@/types';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;

  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification: Notification) => {
    set((state) => {
      const newNotifications = [notification, ...state.notifications];
      const unreadCount = newNotifications.filter((n) => !n.is_read).length;
      return {
        notifications: newNotifications,
        unreadCount,
      };
    });
  },

  removeNotification: (id: string) => {
    set((state) => {
      const newNotifications = state.notifications.filter((n) => n.id !== id);
      const unreadCount = newNotifications.filter((n) => !n.is_read).length;
      return {
        notifications: newNotifications,
        unreadCount,
      };
    });
  },

  markAsRead: (id: string) => {
    set((state) => {
      const newNotifications = state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      );
      const unreadCount = newNotifications.filter((n) => !n.is_read).length;
      return {
        notifications: newNotifications,
        unreadCount,
      };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));
  },

  clearAll: () => {
    set({
      notifications: [],
      unreadCount: 0,
    });
  },
}));
