import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  static async requestPermissions() {
    try {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.log('Failed to get push token for push notification!');
          return false;
        }
        
        // Configure notification channel for Android
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#8B9A8B',
            sound: 'default',
          });
        }
        
        return true;
      } else {
        console.log('Must use physical device for Push Notifications');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  static async scheduleExerciseReminders(userId = null) {
    try {
      // Cancel all existing exercise notifications
      await this.cancelAllExerciseReminders();
      
      const notifications = [
        {
          identifier: 'morning-exercise-reminder',
          content: {
            title: '🌅 Hora dos Exercícios!',
            body: 'Bom dia! Que tal começar o dia com seus exercícios de fortalecimento pélvico?',
            data: { type: 'exercise-reminder', time: 'morning', userId },
          },
          trigger: {
            type: 'calendar',
            hour: 8,
            minute: 0,
            repeats: true,
          },
        },
        {
          identifier: 'afternoon-exercise-reminder',
          content: {
            title: '☀️ Lembrete de Exercícios',
            body: 'Boa tarde! Não se esqueça dos seus exercícios diários.',
            data: { type: 'exercise-reminder', time: 'afternoon', userId },
          },
          trigger: {
            type: 'calendar',
            hour: 14,
            minute: 0,
            repeats: true,
          },
        },
        {
          identifier: 'evening-exercise-reminder',
          content: {
            title: '🌙 Última Chance!',
            body: 'Boa noite! Ainda dá tempo de fazer seus exercícios hoje.',
            data: { type: 'exercise-reminder', time: 'evening', userId },
          },
          trigger: {
            type: 'calendar',
            hour: 19,
            minute: 0,
            repeats: true,
          },
        },
      ];

      for (const notification of notifications) {
        console.log(`Scheduling notification: ${notification.identifier} for ${notification.trigger.hour}:${notification.trigger.minute}`);
        await Notifications.scheduleNotificationAsync(notification);
      }
      
      console.log('Exercise reminders scheduled successfully');
      return true;
    } catch (error) {
      console.error('Error scheduling exercise reminders:', error);
      return false;
    }
  }

  static async cancelAllExerciseReminders() {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        if (notification.identifier.includes('exercise-reminder')) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
      
      console.log('All exercise reminders cancelled');
    } catch (error) {
      console.error('Error cancelling exercise reminders:', error);
    }
  }

  static async scheduleCompletionReminder(exercisesRemaining) {
    try {
      // Cancel any existing completion reminder
      await Notifications.cancelScheduledNotificationAsync('completion-reminder');
      
      if (exercisesRemaining === 0) {
        // Schedule congratulatory notification for tomorrow
        await Notifications.scheduleNotificationAsync({
          identifier: 'completion-reminder',
          content: {
            title: '🎉 Parabéns!',
            body: 'Você completou todos os exercícios de hoje! Continue assim!',
            data: { type: 'completion' },
          },
          trigger: {
            seconds: 5, // Show immediately after completion
          },
        });
      }
    } catch (error) {
      console.error('Error scheduling completion reminder:', error);
    }
  }

  static async checkAndCancelTodaysReminders(completedExercises, totalExercises) {
    try {
      // If user completed all exercises, cancel remaining reminders for today
      if (completedExercises >= totalExercises) {
        const now = new Date();
        const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
        
        for (const notification of scheduledNotifications) {
          if (notification.identifier.includes('exercise-reminder')) {
            const trigger = notification.trigger;
            if (trigger && trigger.hour) {
              // Cancel reminders for later today
              if (trigger.hour > now.getHours()) {
                await Notifications.cancelScheduledNotificationAsync(notification.identifier);
              }
            }
          }
        }
        
        // Schedule completion notification
        await this.scheduleCompletionReminder(0);
        
        console.log('Cancelled remaining reminders for today - all exercises completed');
      }
    } catch (error) {
      console.error('Error checking and cancelling reminders:', error);
    }
  }

  static async getAllScheduledNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  static async sendImmediateNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending immediate notification:', error);
    }
  }

  // Setup notification listeners
  static setupNotificationListeners(navigation) {
    // Listen for notifications received while app is in foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
    });

    // Listen for user tapping on notification
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      
      const { type } = response.notification.request.content.data;
      
      if (type === 'exercise-reminder') {
        // Navigate to home screen when user taps exercise reminder
        navigation.navigate('Home');
      }
    });

    return {
      foregroundSubscription,
      responseSubscription,
    };
  }

  static removeNotificationListeners(subscriptions) {
    if (subscriptions.foregroundSubscription) {
      subscriptions.foregroundSubscription.remove();
    }
    if (subscriptions.responseSubscription) {
      subscriptions.responseSubscription.remove();
    }
  }
}
