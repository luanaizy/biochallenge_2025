import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthContext } from '../context/AuthContext';
import { useWeeklyQuestionnaire } from '../hooks/useWeeklyQuestionnaire';
import { supabase } from '../config/supabase';

export default function ISQFQuestionnaireScreen({ navigation }) {
  const { user } = useAuthContext();
  const { markQuestionnaireCompleted } = useWeeklyQuestionnaire(user);
  const [answers, setAnswers] = useState({
    question1: null, // frequency
    question2: null, // quantity
    question3: null, // interference scale 0-10
  });
  const [loading, setLoading] = useState(false);

  const question1Options = [
    { value: 0, label: 'Nenhuma' },
    { value: 1, label: 'Uma vez' },
    { value: 2, label: 'Duas ou três vezes' },
    { value: 3, label: 'Uma vez ao dia' },
    { value: 4, label: 'Diversas vezes ao dia' },
    { value: 5, label: 'O tempo todo' },
  ];

  const question2Options = [
    { value: 0, label: 'Nenhuma' },
    { value: 1, label: 'Uma pequena quantidade' },
    { value: 2, label: 'Uma quantidade moderada' },
    { value: 3, label: 'Uma grande quantidade' },
  ];

  const handleAnswer = (questionNumber, value) => {
    setAnswers(prev => ({
      ...prev,
      [`question${questionNumber}`]: value
    }));
  };

  const calculateISQFScore = () => {
    // ICIQ-SF scoring formula (maximum 21)
    // Q1 (0-5) + Q2 (0-3) + Q3 (0-10) = Total score (0-18)
    // Plus additional points based on Q1 and Q2 combination for max 21
    const q1Score = answers.question1 || 0;
    const q2Score = answers.question2 || 0;
    const q3Score = answers.question3 || 0;
    
    // Basic score: Q1 + Q2 + Q3 (max 18)
    const basicScore = q1Score + q2Score + q3Score;
    
    // Additional scoring based on ICIQ-SF methodology
    let additionalScore = 0;
    if (q1Score >= 3 && q2Score >= 2) additionalScore = 1;
    if (q1Score >= 4 && q2Score >= 3) additionalScore = 2;
    if (q1Score === 5 && q2Score === 3) additionalScore = 3;
    
    return Math.min(basicScore + additionalScore, 21); // Cap at 21
  };

  const handleSubmit = async () => {
    // Validate all questions are answered
    if (answers.question1 === null || answers.question2 === null || answers.question3 === null) {
      Alert.alert('Questionário incompleto', 'Por favor, responda todas as perguntas antes de enviar.');
      return;
    }

    setLoading(true);
    
    try {
      const totalScore = calculateISQFScore();
      const currentWeek = getCurrentWeekNumber();
      
      // Save to database with individual answers
      const { error } = await supabase
        .from('progress_tracking')
        .insert({
          user_id: user.id,
          metric_type: 'iciq_sf',
          value: totalScore,
          week_number: currentWeek,
          recorded_at: new Date().toISOString(),
          question1_answer: answers.question1,
          question2_answer: answers.question2,
          question3_answer: answers.question3,
        });

      if (error) {
        throw error;
      }

      console.log('Questionnaire completed successfully, calling markQuestionnaireCompleted');

      // Show completion message
      Alert.alert(
        'Questionário concluído!',
        `Sua pontuação ICIQ-SF desta semana: ${totalScore}/21`,
        [
          {
            text: 'OK',
            onPress: async () => {
              console.log('Alert OK pressed, marking questionnaire as completed');
              // Mark questionnaire as completed, which will trigger navigation change
              await markQuestionnaireCompleted();
              console.log('markQuestionnaireCompleted finished');
              
              // Force a small delay to ensure state update
              setTimeout(() => {
                console.log('Attempting to force re-render');
              }, 100);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      Alert.alert('Erro', 'Não foi possível salvar o questionário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentWeekNumber = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
  };

  const renderCheckboxOption = (questionNumber, options, selectedValue) => {
    return options.map((option) => (
      <TouchableOpacity
        key={option.value}
        style={styles.optionContainer}
        onPress={() => handleAnswer(questionNumber, option.value)}
        disabled={loading}
      >
        <View style={[
          styles.checkbox,
          selectedValue === option.value && styles.checkboxSelected
        ]}>
          {selectedValue === option.value && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.optionText}>{option.label}</Text>
      </TouchableOpacity>
    ));
  };

  const renderScaleOption = () => {
    const scales = Array.from({ length: 11 }, (_, i) => i);
    
    return (
      <View style={styles.scaleContainer}>
        <View style={styles.scaleRow}>
          {scales.map((value) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.scaleBox,
                answers.question3 === value && styles.scaleBoxSelected
              ]}
              onPress={() => handleAnswer(3, value)}
              disabled={loading}
            >
              <Text style={[
                styles.scaleText,
                answers.question3 === value && styles.scaleTextSelected
              ]}>
                {value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.scaleLabels}>
          <Text style={styles.scaleLabel}>0</Text>
          <Text style={styles.scaleLabel}>10</Text>
        </View>
      </View>
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

            {/* Greeting */}
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>Olá, {user?.user_metadata?.name || 'Usuário'}.</Text>
              <Text style={styles.subtitle}>
                Você ainda não nos contou sobre a semana que passou.
              </Text>
            </View>

            {/* Question 1 */}
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>
                1. Com que frequência você perdeu urina?
              </Text>
              {renderCheckboxOption(1, question1Options, answers.question1)}
            </View>

            {/* Question 2 */}
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>
                2. Qual quantidade de urina você pensa que perdeu?
              </Text>
              {renderCheckboxOption(2, question2Options, answers.question2)}
            </View>

            {/* Question 3 */}
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>
                3. No geral, quanto que você perder urina interfere em sua vida diária? Marque 0 para não interfere e 10 para interfere muito.
              </Text>
              {renderScaleOption()}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Enviando...' : 'Enviar'}
              </Text>
            </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B9A8B',
  },
  greetingContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  questionContainer: {
    marginBottom: 30,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    lineHeight: 22,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#8B9A8B',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#8B9A8B',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  optionText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  scaleContainer: {
    alignItems: 'center',
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  scaleBox: {
    width: 30,
    height: 30,
    borderWidth: 2,
    borderColor: '#8B9A8B',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  scaleBoxSelected: {
    backgroundColor: '#8B9A8B',
  },
  scaleText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  scaleTextSelected: {
    color: 'white',
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 15,
  },
  scaleLabel: {
    fontSize: 12,
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#8B9A8B',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
