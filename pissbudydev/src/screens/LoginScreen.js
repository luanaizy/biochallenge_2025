import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuthContext();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        Alert.alert('Erro de Login', error.message);
      }
      // Remove manual navigation - AuthContext will handle this automatically
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro durante o login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('Register');
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
              <Text style={styles.title}>Piss Buddy</Text>
            </View>

            {/* Mascot */}
            <View style={styles.mascotContainer}>
              <Image 
                source={require('../../assets/pissIcon.png')} 
                style={styles.mascotImage}
                resizeMode="contain"
              />
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
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="********"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={styles.forgotPassword}>Esqueci minha senha</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'Entrando...' : 'Login'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSignUp}>
                <Text style={styles.signUpText}>
                  Não tem uma conta? <Text style={styles.signUpLink}>Cadastre-se aqui</Text>
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
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B9A8B',
    letterSpacing: 1,
  },
  mascotContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mascotImage: {
    width: 220,
    height: 220,
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
  forgotPassword: {
    fontSize: 14,
    color: '#5B9BD5',
    textAlign: 'right',
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  loginButton: {
    backgroundColor: '#8B9A8B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  signUpText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  signUpLink: {
    color: '#5B9BD5',
    fontWeight: 'bold',
  },
});
