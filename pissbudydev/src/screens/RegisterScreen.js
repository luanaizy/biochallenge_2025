import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthContext } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuthContext();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
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
      const { error } = await signUp(email, password, name);
      
      if (error) {
        Alert.alert('Erro de Cadastro', error.message);
      } else {
        Alert.alert(
          'Sucesso!', 
          'Conta criada com sucesso! Verifique seu email para confirmar.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro durante o cadastro');
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
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Piss Buddy</Text>
              </View>

              {/* Mascot - smaller version */}
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
                  <Text style={styles.label}>Nome</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Sandra"
                    placeholderTextColor="#999"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>

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
                    placeholder="**********"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirmar senha</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="********"
                    placeholderTextColor="#999"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.registerButton, loading && styles.registerButtonDisabled]} 
                  onPress={handleRegister}
                  disabled={loading}
                >
                  <Text style={styles.registerButtonText}>
                    {loading ? 'Cadastrando...' : 'Cadastrar-se'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 40,
    paddingVertical: 20,
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
    marginBottom: 20,
  },
  mascotImage: {
    width: 220,
    height: 220,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 18,
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
  registerButton: {
    backgroundColor: '#8B9A8B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
});
