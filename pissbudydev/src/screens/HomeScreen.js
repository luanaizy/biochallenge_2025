import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthContext } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import ExerciseInstructionsModal from '../components/ExerciseInstructionsModal';
import { exerciseData } from '../data/exerciseData';

// Define styles first so they can be used by icon components
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
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B9A8B',
    letterSpacing: 0.5,
  },
  welcomeContainer: {
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  calendarContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthYear: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B9A8B',
    textAlign: 'center',
    marginBottom: 15,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  weekDay: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    width: 35,
    textAlign: 'center',
  },
  datesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dateButton: {
    width: 35,
    height: 35,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDateButton: {
    backgroundColor: '#8B9A8B',
  },
  todayDateButton: {
    backgroundColor: '#FFE4B5',
    borderWidth: 2,
    borderColor: '#8B9A8B',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedDateText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  todayDateText: {
    color: '#8B9A8B',
    fontWeight: 'bold',
  },
  calendarHint: {
    fontSize: 12,
    color: '#FF9800',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  exercisesContainer: {
    gap: 20,
    marginBottom: 30,
  },
  exerciseCard: {
    borderRadius: 20,
    padding: 20,
    minHeight: 140,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    zIndex: 10,
    position: 'relative',
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  infoButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  infoIcon: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  repetitions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  exerciseIconContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  sittingImage: {
    width: 213,
    height: 86,
  },
  kegelImage: {
    width: 114,
    height: 114,
  },
  alongamentoImage: {
    width: 100,
    height: 100,
  },
  elevacaoCalcanharesImage: {
    width: 100,
    height: 100,
  },
  marchaEstacionariaImage: {
    width: 100,
    height: 100,
  },
  completedBadge: {
    position: 'absolute',
    top: 15,
    right: 50,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  lockedBadge: {
    position: 'absolute',
    top: 15,
    right: 50,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedText: {
    fontSize: 16,
  },
  disabledCard: {
    opacity: 0.6,
  },
  disabledText: {
    color: '#999',
    fontStyle: 'italic',
  },
});

// Move icon components outside to prevent re-creation on every render
const SittingIcon = () => (
  <Image 
    source={require('../../assets/sit.png')} 
    style={styles.sittingImage}
    resizeMode="contain"
  />
);

const KegelIcon = () => (
  <Image 
    source={require('../../assets/kegel.png')} 
    style={styles.kegelImage}
    resizeMode="contain"
  />
);

const AlongamentoIcon = () => (
  <Image 
    source={require('../../assets/alongamento.png')} 
    style={styles.alongamentoImage}
    resizeMode="contain"
  />
);

const ElevacaoCalcanharesIcon = () => (
  <Image 
    source={require('../../assets/elevacao_calcanhares.png')} 
    style={styles.elevacaoCalcanharesImage}
    resizeMode="contain"
  />
);

const MarchaEstacionariaIcon = () => (
  <Image 
    source={require('../../assets/marcha_estacionaria.png')} 
    style={styles.marchaEstacionariaImage}
    resizeMode="contain"
  />
);

export default function HomeScreen() {
  const [userProfile, setUserProfile] = useState(null);
  const [exerciseSessions, setExerciseSessions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const { user } = useAuthContext();
  
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
  
  // Calculate current week dates
  const getCurrentWeek = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday
    const dates = [];
    
    // Calculate the start of the week (Sunday)
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - currentDay + i);
      dates.push(date.getDate());
    }
    
    return dates;
  };
  
  const getCurrentMonthYear = () => {
    const today = new Date();
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${months[today.getMonth()]} ${today.getFullYear()}`;
  };
  
  const dates = getCurrentWeek();
  const today = new Date().getDate();
  const [selectedDate, setSelectedDate] = useState(today);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchExerciseSessions();
    }
  }, [user, selectedDate]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is fine for new users
        console.error('Error fetching profile:', error);
      } else if (data) {
        setUserProfile(data);
      } else {
        // Profile doesn't exist, create one
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: user.user_metadata?.name || 'Usuário',
            email: user.email,
          });
        
        if (!insertError) {
          // Fetch the newly created profile
          fetchUserProfile();
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchExerciseSessions = async () => {
    try {
      // Create date string for the selected date
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1; // getMonth() returns 0-11
      const selectedDateString = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${selectedDate.toString().padStart(2, '0')}`;
      
      const { data, error } = await supabase
        .from('exercise_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', selectedDateString);

      if (error) {
        console.error('Error fetching exercise sessions:', error);
      } else {
        setExerciseSessions(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleExerciseComplete = async (exerciseType, repetitions) => {
    // Check if the selected date is today
    if (selectedDate !== today) {
      Alert.alert(
        'Não é possível completar', 
        'Você só pode completar exercícios para o dia atual.'
      );
      return;
    }

    try {
      // Create date string for today
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const todayDateString = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${today.toString().padStart(2, '0')}`;
      
      const { error } = await supabase
        .from('exercise_sessions')
        .insert([
          {
            user_id: user.id,
            exercise_type: exerciseType,
            repetitions: repetitions,
            date: todayDateString,
          }
        ]);

      if (error) {
        Alert.alert('Erro', 'Não foi possível salvar o exercício');
        console.error('Error saving exercise:', error);
      } else {
        Alert.alert('Sucesso!', `Exercício de ${exerciseType} concluído!`);
        fetchExerciseSessions(); // Refresh the sessions
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar o exercício');
    }
  };

  const handleShowInstructions = (exerciseType) => {
    console.log('Exercise type clicked:', exerciseType);
    const exercise = exerciseData[exerciseType];
    console.log('Exercise data found:', exercise);
    if (exercise) {
      setSelectedExercise(exercise);
      setModalVisible(true);
    } else {
      Alert.alert('Debug', `Exercise type "${exerciseType}" not found in data`);
    }
  };

  const renderExerciseCard = (title, repetitions, icon, color, bgColor, exerciseType) => {
    const isCompleted = exerciseSessions.some(session => session.exercise_type === exerciseType);
    const isToday = selectedDate === today;
    const canComplete = isToday && !isCompleted;
    
    return (
      <TouchableOpacity 
        style={[
          styles.exerciseCard, 
          { backgroundColor: bgColor },
          !canComplete && styles.disabledCard
        ]}
        onPress={() => canComplete && handleExerciseComplete(exerciseType, 10)}
        disabled={!canComplete}
      >
        <View style={styles.exerciseHeader}>
          <Text style={styles.exerciseTitle}>{title}</Text>
          <TouchableOpacity 
            style={styles.infoButton}
            onPress={() => handleShowInstructions(exerciseType)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.infoIcon}>?</Text>
          </TouchableOpacity>
        </View>
        <Text style={[
          styles.repetitions,
          !isToday && styles.disabledText
        ]}>
          {isCompleted 
            ? 'Concluído!' 
            : !isToday 
              ? 'Só disponível hoje' 
              : repetitions
          }
        </Text>
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>✓</Text>
          </View>
        )}
        {!isToday && !isCompleted && (
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedText}>🔒</Text>
          </View>
        )}
        <View style={styles.exerciseIconContainer}>
          {icon}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <LinearGradient
        colors={['#F5F5DC', '#E6E6E6']}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Piss Buddy</Text>
            </View>

            {/* Welcome Message */}
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>
                Bem vindo de volta{userProfile?.name ? `, ${userProfile.name}` : ''}!
              </Text>
              <Text style={styles.welcomeSubtitle}>
                Aqui está o plano para esta semana:
              </Text>
            </View>

            {/* Calendar */}
            <View style={styles.calendarContainer}>
              <Text style={styles.monthYear}>{getCurrentMonthYear()}</Text>
              <View style={styles.weekDaysContainer}>
                {weekDays.map((day, index) => (
                  <Text key={day} style={styles.weekDay}>{day}</Text>
                ))}
              </View>
              <View style={styles.datesContainer}>
                {dates.map((date, index) => {
                  const isToday = date === today;
                  const isSelected = selectedDate === date;
                  
                  return (
                    <TouchableOpacity
                      key={`${date}-${index}`}
                      style={[
                        styles.dateButton,
                        isSelected && styles.selectedDateButton,
                        isToday && !isSelected && styles.todayDateButton
                      ]}
                      onPress={() => setSelectedDate(date)}
                    >
                      <Text style={[
                        styles.dateText,
                        isSelected && styles.selectedDateText,
                        isToday && !isSelected && styles.todayDateText
                      ]}>
                        {date}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {selectedDate !== today && (
                <Text style={styles.calendarHint}>
                  💡 Exercícios só podem ser feitos no dia atual
                </Text>
              )}
            </View>

            {/* Exercise Cards */}
            <View style={styles.exercisesContainer}>
              {renderExerciseCard(
                'Sentar e Levantar',
                '10 repetições',
                <SittingIcon />,
                '#8B9A8B',
                '#B8C5B8',
                'sitting_standing'
              )}
              
              {renderExerciseCard(
                'Exercício de Kegel',
                '10 repetições',
                <KegelIcon />,
                '#D4A5A5',
                '#E8D4D4',
                'kegel'
              )}
              
              {renderExerciseCard(
                'Alongamento',
                '15-30 segundos',
                <AlongamentoIcon />,
                '#A5C9D4',
                '#D4E8F0',
                'alongamento'
              )}
              
              {renderExerciseCard(
                'Elevação de Calcanhares',
                '10-15 repetições',
                <ElevacaoCalcanharesIcon />,
                '#D4C5A5',
                '#F0E8D4',
                'elevacao_calcanhares'
              )}
              
              {renderExerciseCard(
                'Marcha Estacionária',
                '30 segundos - 2 minutos',
                <MarchaEstacionariaIcon />,
                '#C9A5D4',
                '#E8D4F0',
                'marcha_estacionaria'
              )}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
      
      <ExerciseInstructionsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        exercise={selectedExercise}
      />
    </SafeAreaView>
  );
}
