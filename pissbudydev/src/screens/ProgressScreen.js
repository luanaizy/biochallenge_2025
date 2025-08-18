import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthContext } from '../context/AuthContext';
import { supabase } from '../config/supabase';

const { width } = Dimensions.get('window');
const chartWidth = width - 40; // Use more of the available width

// Utility function to get week number
const getWeekNumber = (date) => {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target) / 604800000);
};

// Chart configuration
const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(91, 155, 213, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
  style: {
    borderRadius: 16,
    marginLeft: -30, // Aggressive negative margin to counter internal padding
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#ffffff',
  },
  propsForBackgroundLines: {
    strokeDasharray: '',
    stroke: '#E0E0E0',
    strokeWidth: 1,
  },
  propsForLabels: {
    fontSize: 9,
  },
  paddingRight: 10,
  paddingLeft: -10, // Negative padding to pull chart left
};

// Custom Chart Component
const CustomLineChart = ({ data, title, yAxisSuffix = '', minValue = 0, maxValue = 25 }) => {
  // Generate week labels with actual dates
  const getWeekLabels = () => {
    const now = new Date();
    const labels = [];
    
    for (let i = 3; i >= 0; i--) {
      // Calculate week start (Sunday) for each week going back
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      
      // Find the Sunday of that week
      const dayOfWeek = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - dayOfWeek);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const startDay = weekStart.getDate();
      const endDay = weekEnd.getDate();
      
      // Handle month changes
      if (weekStart.getMonth() !== weekEnd.getMonth()) {
        const startMonth = weekStart.getMonth() + 1;
        const endMonth = weekEnd.getMonth() + 1;
        labels.push(`${startDay}/${startMonth}-${endDay}/${endMonth}`);
      } else {
        const month = weekStart.getMonth() + 1;
        labels.push(`${startDay}-${endDay}/${month}`);
      }
    }
    
    return labels;
  };

  // Ensure we have valid data for the chart
  const chartData = {
    labels: getWeekLabels(),
    datasets: [
      {
        data: data.length > 0 ? data : [0, 0, 0, 0], // Fallback to zeros if no data
        color: (opacity = 1) => `rgba(91, 155, 213, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.chartWrapper}>
        <LineChart
          data={chartData}
          width={chartWidth}
          height={200}
          yAxisSuffix={yAxisSuffix}
          chartConfig={{
            ...chartConfig,
            formatYLabel: (value) => {
              return Math.round(parseFloat(value)).toString();
            },
          }}
          bezier
          style={styles.chart}
          fromZero={false}
          segments={4}
        />
      </View>
    </View>
  );
};

export default function ProgressScreen() {
  const { user } = useAuthContext();
  const [progressData, setProgressData] = useState({
    isqfSF: [18, 15, 12, 9], // Sample data - declining ICIQ-SF scores (lower is better, max 21)
    exercisesCompleted: [20, 40, 60, 50], // Sample data - total repetitions per week
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [user]);

  // Also refetch when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        console.log('ProgressScreen focused, refetching data');
        fetchProgressData();
      }
    }, [user])
  );

  const fetchProgressData = async () => {
    try {
      console.log('Fetching progress data for user:', user?.id);
      
      // Fetch ICIQ-SF scores (if they exist in the database)
      const { data: isqfData, error: isqfError } = await supabase
        .from('progress_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('metric_type', 'iciq_sf')
        .order('week_number');

      console.log('ICIQ-SF data:', isqfData, 'Error:', isqfError);

      // Fetch exercise completion data with repetitions
      const { data: exerciseData, error: exerciseError } = await supabase
        .from('exercise_sessions')
        .select('date, exercise_type, repetitions')
        .eq('user_id', user.id)
        .order('date');

      console.log('Exercise data:', exerciseData, 'Error:', exerciseError);

      if (!isqfError && isqfData?.length > 0) {
        // Map ICIQ-SF data to the last 4 weeks shown in the chart
        const now = new Date();
        const currentWeek = getWeekNumber(now);
        const iciqValues = [];
        
        console.log('Raw ICIQ-SF data from database:', isqfData);
        console.log('Current week number:', currentWeek);
        
        // Get data for the last 4 weeks (week numbers from oldest to newest)
        for (let i = 3; i >= 0; i--) {
          const targetWeek = currentWeek - i;
          const weekData = isqfData.find(item => item.week_number === targetWeek);
          
          console.log(`Looking for week ${targetWeek}, found:`, weekData);
          
          if (weekData) {
            iciqValues.push(weekData.value);
          } else {
            // If no data for this week, use null to indicate missing data
            iciqValues.push(null);
          }
        }
        
        console.log('ICIQ-SF values mapped to weeks:', iciqValues);
        
        // Only set real data if we have at least one valid value
        const hasValidData = iciqValues.some(value => value !== null);
        if (hasValidData) {
          // Replace nulls with the nearest valid value for chart display
          const processedValues = [];
          let lastValidValue = null;
          
          for (let i = 0; i < iciqValues.length; i++) {
            if (iciqValues[i] !== null) {
              lastValidValue = iciqValues[i];
              processedValues.push(iciqValues[i]);
            } else if (lastValidValue !== null) {
              // Use the last known value for missing weeks
              processedValues.push(lastValidValue);
            } else {
              // If no previous value exists, use 0 to show no data
              processedValues.push(0);
            }
          }
          
          setProgressData(prev => ({
            ...prev,
            isqfSF: processedValues
          }));
        } else {
          console.log('No valid ICIQ-SF data found, using sample data');
          setProgressData(prev => ({
            ...prev,
            isqfSF: [18, 15, 12, 9] // Sample data
          }));
        }
      } else {
        console.log('No ICIQ-SF data found or error occurred, using sample data');
        // Only use sample data if no real data exists
        setProgressData(prev => ({
          ...prev,
          isqfSF: [18, 15, 12, 9] // Sample data
        }));
      }

      // Calculate weekly exercise completion
      if (!exerciseError && exerciseData?.length > 0) {
        const weeklyExercises = calculateWeeklyExercises(exerciseData);
        console.log('Weekly exercises calculated:', weeklyExercises);
        setProgressData(prev => ({
          ...prev,
          exercisesCompleted: weeklyExercises
        }));
      } else {
        console.log('No exercise data found, using sample data');
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeklyExercises = (exerciseData) => {
    // Group exercises by week and sum total repetitions - last 4 weeks
    const now = new Date();
    const weeks = [];
    
    for (let i = 3; i >= 0; i--) {
      // Calculate week start (Sunday) for each week going back
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      
      // Find the Sunday of that week
      const dayOfWeek = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekExercises = exerciseData.filter(exercise => {
        const exerciseDate = new Date(exercise.date);
        return exerciseDate >= weekStart && exerciseDate <= weekEnd;
      });
      
      // Sum all repetitions for this week
      const totalReps = weekExercises.reduce((sum, exercise) => {
        return sum + (exercise.repetitions || 0);
      }, 0);
      
      weeks.push(totalReps);
    }
    
    return weeks.length > 0 ? weeks : [20, 40, 60, 50]; // Default sample data showing total repetitions
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <LinearGradient
        colors={['#F5F5DC', '#E6E6E6']}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Piss Buddy</Text>
            </View>

            {/* Subtitle */}
            <View style={styles.subtitleContainer}>
              <Text style={styles.subtitle}>Sua evolução</Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Carregando dados...</Text>
              </View>
            ) : (
              <>
                {/* ICIQ-SF Chart */}
                <CustomLineChart
                  data={progressData.isqfSF}
                  title="ICIQ-SF"
                  minValue={0}
                  maxValue={21}
                />

                {/* Exercises Chart */}
                <View style={styles.exerciseChartContainer}>
                  <CustomLineChart
                    data={progressData.exercisesCompleted}
                    title="Exercícios feitos"
                    minValue={0}
                    maxValue={80}
                  />
                </View>
              </>
            )}
          </View>
        </ScrollView>
        
        {/* Fixed motivational message - always visible above bottom tab bar */}
        {!loading && (
          <View style={styles.fixedMessageContainer}>
            <View style={styles.messageBubble}>
              <Text style={styles.messageText}>
                {progressData.exercisesCompleted[3] < progressData.exercisesCompleted[2] 
                  ? "Seu padrão não está legal!" 
                  : "Continue assim! Você está melhorando!"}
              </Text>
            </View>
          </View>
        )}
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
  scrollContent: {
    paddingBottom: 100, // Extra space to ensure content isn't hidden behind fixed message
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B9A8B',
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center', // Center the chart content
    justifyContent: 'center', // Center vertically as well
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
    marginLeft: -20, // Offset the internal left padding
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  exerciseChartContainer: {
    width: '100%',
  },
  fixedMessageContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 80, // Position above the bottom tab bar
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  messageContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  messageBubble: {
    backgroundColor: '#FFE4E1',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FFB6C1',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  messageText: {
    color: '#D2691E',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
});
