import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, Image, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthContext } from '../context/AuthContext';
import { useWeeklyQuestionnaire } from '../hooks/useWeeklyQuestionnaire';
import { supabase } from '../config/supabase';

export default function ISQFQuestionnaireScreen({ navigation }) {
  const { user } = useAuthContext();
  const { markQuestionnaireCompleted } = useWeeklyQuestionnaire(user);

  const [answers, setAnswers] = useState({
    question1: '', // idade
    question2: '', // altura
    question3: '', // peso
    question4: null, // frequência
    question5: null, // quantidade
    question6: null, // interferência
    question7: [], // escapes
    question8: null, // café
    question9: null, // álcool
    question10: {
      forca_pelvica: '',
      forca_abd: '',
      resistencia_pelvica: '',
      resistencia_abd: ''
    }
  });

  const [loading, setLoading] = useState(false);

  const question4Options = [
    { value: 0, label: 'Nunca' },
    { value: 1, label: 'Uma vez por semana' },
    { value: 2, label: 'Duas ou três vezes por semana' },
    { value: 3, label: 'Uma vez ao dia' },
    { value: 4, label: 'Diversas vezes ao dia' },
    { value: 5, label: 'O tempo todo' },
  ];

  const question5Options = [
    { value: 0, label: 'Nada ou muito pouco' },
    { value: 1, label: 'Um pouco' },
    { value: 2, label: 'Média quantidade' },
    { value: 3, label: 'Muita' },
  ];

  const question7Options = [
    { label: 'Quando tusso ou espirro', key: 'espirro', image_path: require('../../assets/cough.png')},
    { label: 'Quando faço atividade física', key: 'atividade', image_path: require('../../assets/fitness.png')},
    { label: 'Quando termino de urinar e me visto', key: 'termino', image_path: require('../../assets/clothes.png')},
  ];

  const frequencyOptions = [
    { value: 0, label: 'Nenhuma' },
    { value: 1, label: 'De uma a três por semana' },
    { value: 2, label: 'Uma por dia' },
    { value: 3, label: 'Mais de uma por dia' },
  ];

  const handleAnswer = (key, value) => {
    setAnswers(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const renderButtonOption = (questionKey, options, selectedValue) => {
    return options.map(option => (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.buttonOption,
          selectedValue === option.value && styles.buttonOptionSelected
        ]}
        onPress={() => handleAnswer(questionKey, option.value)}
        disabled={loading}
      >
        <Text style={[
          styles.buttonOptionText,
          selectedValue === option.value && styles.buttonOptionTextSelected
        ]}>
          {option.label}
        </Text>
      </TouchableOpacity>
    ));
  };

  const getCurrentWeekNumber = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    return Math.ceil(diff / (1000 * 60 * 60 * 24 * 7));
  };

  const handleSubmit = async () => {
    const requiredFields = [
      answers.question1, answers.question2, answers.question3,
      answers.question4, answers.question5, answers.question6,
      answers.question8, answers.question9,
    ];
    if (requiredFields.includes('') || requiredFields.includes(null)) {
      Alert.alert('Questionário incompleto', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('progress_tracking')
        .insert({
          user_id: user.id,
          metric_type: 'iciq_sf_v2',
          value: null,
          week_number: getCurrentWeekNumber(),
          recorded_at: new Date().toISOString(),
          idade: answers.question1,
          altura: answers.question2,
          peso: answers.question3,
          frequencia: answers.question4,
          quantidade: answers.question5,
          interferencia: answers.question6,
          escapes_urina: answers.question7,
          cafe: answers.question8,
          alcool: answers.question9,
          forca_pelvica: answers.question10.forca_pelvica,
          forca_abd: answers.question10.forca_abd,
          resistencia_pelvica: answers.question10.resistencia_pelvica,
          resistencia_abd: answers.question10.resistencia_abd
        });

      if (error) throw error;

      Alert.alert('Sucesso', 'Questionário enviado com sucesso!', [
        { text: 'OK', onPress: async () => await markQuestionnaireCompleted() }
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível enviar o questionário.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#F5F5DC', '#E6E6E6']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} contentContainerStyle={{ padding: 20 }}>
          <Text style={styles.title}>Piss Buddy</Text>

          {/* Perguntas 1–3 */}
          {['question1', 'question2', 'question3'].map((key, idx) => (
            <View key={key} style={styles.questionContainer}>
              <Text style={styles.questionText}>
                {idx + 1}. {['Quantos anos você tem?', 'Qual é a sua altura?', 'Quanto você pesa?'][idx]}
              </Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={answers[key]}
                onChangeText={text => handleAnswer(key, text)}
              />
            </View>
          ))}

          {/* Pergunta 4 */}
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>4. Com que frequência sente que escapa urina?</Text>
            {renderButtonOption('question4', question4Options, answers.question4)}
          </View>

          {/* Pergunta 5 */}
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>5. Qual quantidade de urina você acha que escapa?</Text>
            {renderButtonOption('question5', question5Options, answers.question5)}
          </View>

          {/* Pergunta 6 */}
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>
              6. O quanto isso interfere em sua vida diária? (0 = não interfere, 10 = interfere muito)
            </Text>
            <View style={styles.scaleRow}>
              {Array.from({ length: 11 }, (_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.scaleBox, answers.question6 === i && styles.scaleBoxSelected]}
                  onPress={() => handleAnswer('question6', i)}
                >
                  <Text style={[
                    styles.scaleText,
                    answers.question6 === i && styles.scaleTextSelected
                  ]}>
                    {i}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Pergunta 7 */}
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>7. Quando você perde urina?</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {question7Options.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.buttonOption,
                    answers.question7.includes(opt.key) && styles.buttonOptionSelected
                  ]}
                  onPress={() => {
                    const selected = answers.question7.includes(opt.key)
                      ? answers.question7.filter(k => k !== opt.key)
                      : [...answers.question7, opt.key];
                    handleAnswer('question7', selected);
                  }}
                >
                  <Image
                    source={opt.image_path} 
                    style={{ width: 40, height: 40, marginBottom: 5 }}
                  />
                  <Text style={styles.buttonOptionText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Perguntas 8 e 9 */}
          {[8, 9].map(num => (
            <View key={num} style={styles.questionContainer}>
              <Text style={styles.questionText}>
                {num === 8 ? '8. Quantas xícaras de café costuma tomar?' : '9. Quantas vezes consome álcool?'}
              </Text>
              {renderButtonOption(`question${num}`, frequencyOptions, answers[`question${num}`])}
            </View>
          ))}

          {/* Pergunta 10 */}
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>10. Acompanhamento profissional:</Text>
            {Object.keys(answers.question10).map(field => (
              <TextInput
                key={field}
                style={styles.input}
                keyboardType="numeric"
                placeholder={field.replace(/_/g, ' ').toUpperCase()}
                value={answers.question10[field]}
                onChangeText={text =>
                  setAnswers(prev => ({
                    ...prev,
                    question10: { ...prev.question10, [field]: text }
                  }))
                }
              />
            ))}
          </View>

          {/* Botão Enviar */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>{loading ? 'Enviando...' : 'Enviar'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollView: { flexGrow: 1 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  questionContainer: { marginBottom: 20 },
  questionText: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 10 },
  input: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  buttonOption: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    margin: 5,
    alignItems: 'center',
    width: '100%',
  },
  buttonOptionSelected: {
    backgroundColor: '#8B9A8B',
  },
  buttonOptionText: {
    color: '#333',
    fontSize: 14,
  },
  buttonOptionTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  scaleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  scaleBox: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    margin: 2,
  },
  scaleBoxSelected: {
    backgroundColor: '#8B9A8B',
  },
  scaleText: { fontSize: 12, color: '#333' },
  scaleTextSelected: { color: '#fff' },
  submitButton: {
    backgroundColor: '#8B9A8B',
    paddingVertical: 15,
    borderRadius: 30,
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
  }
});
