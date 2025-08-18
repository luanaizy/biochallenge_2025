import React, { useState } from 'react';
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
import { useAuthContext } from '../context/AuthContext';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuthContext();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Erro', 'Por favor, digite seu email');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Erro', 'Por favor, digite um email válido');
      return;
    }

    setLoading(true);
    try {
      const { error } = await resetPassword(email);

      if (error) {
        Alert.alert('Erro', error.message);
      } else {
        Alert.alert(
          'Email Enviado!',
          'Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao enviar o email de recuperação');
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
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>← Voltar</Text>
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Recuperar Senha</Text>
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
                Digite seu email e enviaremos um link para redefinir sua senha.
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="email@email.com"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus={true}
                />
              </View>

              <TouchableOpacity 
                style={[styles.resetButton, loading && styles.resetButtonDisabled]} 
                onPress={handleResetPassword}
                disabled={loading}
              >
                <Text style={styles.resetButtonText}>
                  {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
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
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 16,
    color: '#8B9A8B',
    fontWeight: '500',
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
    width: 200,
    height: 200,
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
  resetButton: {
    backgroundColor: '#8B9A8B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  resetButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resetButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
});
