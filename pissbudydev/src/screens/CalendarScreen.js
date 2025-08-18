import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function CalendarScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <LinearGradient
        colors={['#F5F5DC', '#E6E6E6']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Calendário</Text>
          <Text style={styles.subtitle}>Visualize seus treinos no calendário</Text>
        </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B9A8B',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
