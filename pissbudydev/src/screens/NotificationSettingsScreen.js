import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthContext } from '../context/AuthContext';
import { NotificationService } from '../services/notificationService';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NotificationSettingsScreen({ navigation }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [morningEnabled, setMorningEnabled] = useState(true);
  const [afternoonEnabled, setAfternoonEnabled] = useState(true);
  const [eveningEnabled, setEveningEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthContext();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem(`notification_settings_${user.id}`);
      if (settings) {
        const parsed = JSON.parse(settings);
        setNotificationsEnabled(parsed.notificationsEnabled ?? true);
        setMorningEnabled(parsed.morningEnabled ?? true);
        setAfternoonEnabled(parsed.afternoonEnabled ?? true);
        setEveningEnabled(parsed.eveningEnabled ?? true);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem(
        `notification_settings_${user.id}`,
        JSON.stringify(newSettings)
      );
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const handleMainToggle = async (value) => {
    setNotificationsEnabled(value);
    
    const newSettings = {
      notificationsEnabled: value,
      morningEnabled,
      afternoonEnabled,
      eveningEnabled,
    };
    
    await saveSettings(newSettings);
    
    if (value) {
      // Re-enable notifications
      const permitted = await NotificationService.requestPermissions();
      if (permitted) {
        await NotificationService.scheduleExerciseReminders();
        Alert.alert('Sucesso', 'Notificações ativadas!');
      } else {
        Alert.alert('Erro', 'Não foi possível ativar as notificações. Verifique as configurações do dispositivo.');
        setNotificationsEnabled(false);
      }
    } else {
      // Disable notifications
      await NotificationService.cancelAllExerciseReminders();
      Alert.alert('Sucesso', 'Notificações desativadas!');
    }
  };

  const handleTimeToggle = async (type, value) => {
    let newSettings = {
      notificationsEnabled,
      morningEnabled,
      afternoonEnabled,
      eveningEnabled,
    };

    switch (type) {
      case 'morning':
        setMorningEnabled(value);
        newSettings.morningEnabled = value;
        break;
      case 'afternoon':
        setAfternoonEnabled(value);
        newSettings.afternoonEnabled = value;
        break;
      case 'evening':
        setEveningEnabled(value);
        newSettings.eveningEnabled = value;
        break;
    }

    await saveSettings(newSettings);

    // Reschedule notifications with new settings
    if (notificationsEnabled) {
      await NotificationService.cancelAllExerciseReminders();
      
      // Only schedule enabled notifications
      if (newSettings.morningEnabled || newSettings.afternoonEnabled || newSettings.eveningEnabled) {
        await scheduleSelectedNotifications(newSettings);
      }
    }
  };

  const scheduleSelectedNotifications = async (settings) => {
    try {
      const notifications = [];

      if (settings.morningEnabled) {
        notifications.push({
          identifier: 'morning-exercise-reminder',
          content: {
            title: '🌅 Hora dos Exercícios!',
            body: 'Bom dia! Que tal começar o dia com seus exercícios de fortalecimento pélvico?',
            data: { type: 'exercise-reminder', time: 'morning' },
          },
          trigger: {
            type: 'calendar',
            hour: 8,
            minute: 0,
            repeats: true,
          },
        });
      }

      if (settings.afternoonEnabled) {
        notifications.push({
          identifier: 'afternoon-exercise-reminder',
          content: {
            title: '☀️ Lembrete de Exercícios',
            body: 'Boa tarde! Não se esqueça dos seus exercícios diários.',
            data: { type: 'exercise-reminder', time: 'afternoon' },
          },
          trigger: {
            type: 'calendar',
            hour: 14,
            minute: 0,
            repeats: true,
          },
        });
      }

      if (settings.eveningEnabled) {
        notifications.push({
          identifier: 'evening-exercise-reminder',
          content: {
            title: '🌙 Última Chance!',
            body: 'Boa noite! Ainda dá tempo de fazer seus exercícios hoje.',
            data: { type: 'exercise-reminder', time: 'evening' },
          },
          trigger: {
            type: 'calendar',
            hour: 19,
            minute: 0,
            repeats: true,
          },
        });
      }

      for (const notification of notifications) {
        await Notifications.scheduleNotificationAsync(notification);
      }
    } catch (error) {
      console.error('Error scheduling selected notifications:', error);
    }
  };

  const testNotification = async () => {
    await NotificationService.sendImmediateNotification(
      '🧪 Teste de Notificação',
      'Esta é uma notificação de teste para verificar se está funcionando!'
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#F0F4F0', '#E8F5E8']} style={styles.gradient}>
          <View style={styles.content}>
            <Text style={styles.loadingText}>Carregando configurações...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#F0F4F0', '#E8F5E8']} style={styles.gradient}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Configurações de Notificação</Text>
              <Text style={styles.subtitle}>
                Configure quando você deseja receber lembretes para fazer seus exercícios
              </Text>
            </View>

            <View style={styles.settingsContainer}>
              {/* Main Toggle */}
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Ativar Notificações</Text>
                  <Text style={styles.settingDescription}>
                    Receber lembretes para fazer exercícios
                  </Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleMainToggle}
                  trackColor={{ false: '#ccc', true: '#8B9A8B' }}
                  thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
                />
              </View>

              {/* Time-specific toggles */}
              {notificationsEnabled && (
                <>
                  <View style={styles.settingItem}>
                    <View style={styles.settingInfo}>
                      <Text style={styles.settingTitle}>🌅 Manhã (8:00)</Text>
                      <Text style={styles.settingDescription}>
                        Lembrete matinal para começar o dia
                      </Text>
                    </View>
                    <Switch
                      value={morningEnabled}
                      onValueChange={(value) => handleTimeToggle('morning', value)}
                      trackColor={{ false: '#ccc', true: '#8B9A8B' }}
                      thumbColor={morningEnabled ? '#fff' : '#f4f3f4'}
                    />
                  </View>

                  <View style={styles.settingItem}>
                    <View style={styles.settingInfo}>
                      <Text style={styles.settingTitle}>☀️ Tarde (14:00)</Text>
                      <Text style={styles.settingDescription}>
                        Lembrete do meio do dia
                      </Text>
                    </View>
                    <Switch
                      value={afternoonEnabled}
                      onValueChange={(value) => handleTimeToggle('afternoon', value)}
                      trackColor={{ false: '#ccc', true: '#8B9A8B' }}
                      thumbColor={afternoonEnabled ? '#fff' : '#f4f3f4'}
                    />
                  </View>

                  <View style={styles.settingItem}>
                    <View style={styles.settingInfo}>
                      <Text style={styles.settingTitle}>🌙 Noite (19:00)</Text>
                      <Text style={styles.settingDescription}>
                        Último lembrete do dia
                      </Text>
                    </View>
                    <Switch
                      value={eveningEnabled}
                      onValueChange={(value) => handleTimeToggle('evening', value)}
                      trackColor={{ false: '#ccc', true: '#8B9A8B' }}
                      thumbColor={eveningEnabled ? '#fff' : '#f4f3f4'}
                    />
                  </View>
                </>
              )}
            </View>

            {/* Test Button */}
            <TouchableOpacity
              style={styles.testButton}
              onPress={testNotification}
            >
              <Text style={styles.testButtonText}>Testar Notificação</Text>
            </TouchableOpacity>

            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>💡 Dica</Text>
              <Text style={styles.infoText}>
                As notificações só serão enviadas se você ainda não completou todos os exercícios do dia.
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  settingsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  testButton: {
    backgroundColor: '#8B9A8B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB800',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 50,
  },
});
