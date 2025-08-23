import { useState, useEffect } from 'react';
import { NotificationService } from '../services/notificationService';

export const useNotifications = (navigation) => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [notificationListeners, setNotificationListeners] = useState(null);

  useEffect(() => {
    initializeNotifications();
    
    return () => {
      // Cleanup listeners on unmount
      if (notificationListeners) {
        NotificationService.removeNotificationListeners(notificationListeners);
      }
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      // Request permissions
      const granted = await NotificationService.requestPermissions();
      setPermissionGranted(granted);
      
      if (granted) {
        // Setup listeners (but don't schedule reminders automatically)
        const listeners = NotificationService.setupNotificationListeners(navigation);
        setNotificationListeners(listeners);
        
        console.log('Notifications initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const scheduleReminders = async (userId = null) => {
    if (permissionGranted) {
      return await NotificationService.scheduleExerciseReminders(userId);
    }
    return false;
  };

  const cancelReminders = async () => {
    return await NotificationService.cancelAllExerciseReminders();
  };

  const handleExerciseCompletion = async (completedCount, totalCount) => {
    if (permissionGranted) {
      await NotificationService.checkAndCancelTodaysReminders(completedCount, totalCount);
    }
  };

  const sendImmediateNotification = async (title, body, data = {}) => {
    if (permissionGranted) {
      return await NotificationService.sendImmediateNotification(title, body, data);
    }
    return false;
  };

  return {
    permissionGranted,
    scheduleReminders,
    cancelReminders,
    handleExerciseCompletion,
    sendImmediateNotification,
    initializeNotifications,
  };
};
