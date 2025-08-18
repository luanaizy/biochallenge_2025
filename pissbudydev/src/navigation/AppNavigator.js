import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthContext } from '../context/AuthContext';
import { useWeeklyQuestionnaire } from '../hooks/useWeeklyQuestionnaire';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import ISQFQuestionnaireScreen from '../screens/ISQFQuestionnaireScreen';
import BottomTabNavigator from './BottomTabNavigator';

const Stack = createStackNavigator();

const LoadingScreen = () => (
  <LinearGradient
    colors={['#F5F5DC', '#E6E6E6']}
    style={styles.loadingGradient}
  >
    <SafeAreaView style={styles.loadingContainer} edges={['left', 'right', 'bottom']}>
      <Text style={styles.loadingText}>Carregando...</Text>
    </SafeAreaView>
  </LinearGradient>
);

export default function AppNavigator() {
  const { user, loading } = useAuthContext();
  const { needsQuestionnaire, loading: questionnaireLoading, checkQuestionnaireStatus } = useWeeklyQuestionnaire(user);

  console.log('AppNavigator state:', {
    userExists: !!user,
    loading,
    questionnaireLoading,
    needsQuestionnaire
  });

  // Force a recheck every 2 seconds when questionnaire might be completed
  useEffect(() => {
    if (user && !loading && !questionnaireLoading) {
      const interval = setInterval(() => {
        checkQuestionnaireStatus();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [user, loading, questionnaireLoading, needsQuestionnaire]);

  if (loading || questionnaireLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={`questionnaire-${needsQuestionnaire}`}
        screenOptions={{
          headerShown: false,
        }}
      >
        {user ? (
          // User is signed in
          needsQuestionnaire ? (
            // Show questionnaire if needed
            <Stack.Screen name="ISQFQuestionnaire" component={ISQFQuestionnaireScreen} />
          ) : (
            // Show main app
            <Stack.Screen name="Main" component={BottomTabNavigator} />
          )
        ) : (
          // User is not signed in
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    flex: 1,
  },
  loadingText: {
    fontSize: 18,
    color: '#8B9A8B',
    fontWeight: 'bold',
  },
});
