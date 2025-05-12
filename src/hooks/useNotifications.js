import React, { createContext, useState, useContext, useMemo, useCallback } from 'react';

// Mock Notification Data
const MOCK_NOTIFICATIONS = [
  { id: '1', title: 'Workout Reminder', message: 'Your Interval Training is scheduled for 6:00 PM today.', timestamp: new Date(Date.now() - 3600 * 1000 * 2), read: false, type: 'reminder' },
  { id: '2', title: 'New Achievement!', message: 'You ran your fastest 5K this week!', timestamp: new Date(Date.now() - 3600 * 1000 * 24), read: false, type: 'achievement' },
  { id: '3', title: 'Weekly Summary Ready', message: 'Your weekly training summary is available.', timestamp: new Date(Date.now() - 3600 * 1000 * 48), read: true, type: 'summary' },
  { id: '4', title: 'Recovery Score Updated', message: 'Your recovery score is 87. Ready for normal training.', timestamp: new Date(Date.now() - 3600 * 1000 * 5), read: true, type: 'recovery' },
];

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  markAllAsRead: () => {},
  // Add more functions as needed (e.g., addNotification, markOneAsRead)
});

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prevNotifications => 
      prevNotifications.map(n => ({ ...n, read: true }))
    );
    console.log("Marked all notifications as read."); // For debugging
  }, []);

  // Add functions here to add/remove/update notifications if needed later

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    markAllAsRead,
  }), [notifications, unreadCount, markAllAsRead]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext); 