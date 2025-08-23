import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { NotificationService } from './src/services/notificationService';

export default function App() {
  useEffect(() => {
    // Initialize notifications when app starts
    const initNotifications = async () => {
      try {
        // Clear any existing notifications first
        await NotificationService.cancelAllExerciseReminders();
        
        // Then request permissions
        await NotificationService.requestPermissions();
      } catch (error) {
        console.error('Error initializing notifications in App:', error);
      }
    };
    
    initNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar 
        style="dark" 
        backgroundColor="transparent"
        translucent={true}
      />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
