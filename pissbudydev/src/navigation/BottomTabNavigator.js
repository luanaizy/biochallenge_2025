import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import ProgressScreen from '../screens/ProgressScreen';
import CalendarScreen from '../screens/CalendarScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Progress') {
            iconName = focused ? 'trending-up' : 'trending-up-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8B9A8B',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.85)' : '#FFFFFF',
          borderTopWidth: 0,
          elevation: Platform.OS === 'android' ? 8 : 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: Platform.OS === 'ios' ? 0.15 : 0,
          shadowRadius: 8,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          borderTopLeftRadius: Platform.OS === 'ios' ? 20 : 0,
          borderTopRightRadius: Platform.OS === 'ios' ? 20 : 0,
          // For iOS 26+ liquid glass effect (will be enhanced when react-native-bottom-tabs is properly configured)
          ...(Platform.OS === 'ios' && {
            position: 'absolute',
            backdropFilter: 'blur(20px)',
          }),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início',
        }}
      />
      <Tab.Screen 
        name="Progress" 
        component={ProgressScreen}
        options={{
          tabBarLabel: 'Progresso',
        }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarScreen}
        options={{
          tabBarLabel: 'Calendário',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Configurações',
        }}
      />
    </Tab.Navigator>
  );
}
