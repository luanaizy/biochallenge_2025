import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../config/supabase';

export default function ResetPasswordScreen({ navigation }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        Alert.alert('Erro', error.message);
      } else {
        Alert.alert(
          'Sucesso!',
          'Sua senha foi atualizada com sucesso.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar a senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#F5F5DC', '#E6E6E6']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Nova Senha</Text>
            </View>

            {/* Mascot */}
            <View style={styles.mascotContainer}>
              <Image 
                source={require('../../assets/pissIcon.png')} 
                style={styles.mascotImage}
                resizeMode="contain"
              />
            </View>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsText}>
                Digite sua nova senha abaixo.
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nova Senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite sua nova senha"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoFocus={true}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirmar Nova Senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirme sua nova senha"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity 
                style={[styles.updateButton, loading && styles.updateButtonDisabled]} 
                onPress={handleUpdatePassword}
                disabled={loading}
              >
                <Text style={styles.updateButtonText}>
                  {loading ? 'Atualizando...' : 'Atualizar Senha'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 40,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B9A8B',
    letterSpacing: 1,
  },
  mascotContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mascotImage: {
    width: 150,
    height: 150,
  },
  instructionsContainer: {
    marginBottom: 30,
  },
  instructionsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  updateButton: {
    backgroundColor: '#8B9A8B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  updateButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  updateButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
});
