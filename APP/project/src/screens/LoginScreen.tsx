import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch } from 'react-redux';
import { setUser, setLoading } from '../store/slices/userSlice';
import { mockApi } from '../services/mockApi';
import LuxuryButton from '../components/LuxuryButton';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const LoginScreen: React.FC = () => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('john@example.com');
  const [password, setPassword] = useState('password');
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    phone: '',
  });

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    dispatch(setLoading(true));

    try {
      if (isLogin) {
        const user = await mockApi.loginUser(email, password);
        if (user) {
          dispatch(setUser(user));
        } else {
          Alert.alert('Error', 'Invalid credentials');
        }
      } else {
        if (!formData.full_name || !formData.username) {
          Alert.alert('Error', 'Please fill in all required fields');
          return;
        }

        const user = await mockApi.registerUser({
          email,
          full_name: formData.full_name,
          username: formData.username,
          phone: formData.phone,
        });
        dispatch(setUser(user));
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <LinearGradient colors={['#000000', '#1a1a1a', '#000000']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.View entering={FadeInUp.duration(1000)} style={styles.logoContainer}>
          <Text style={styles.logo}>AURUM</Text>
          <Text style={styles.subtitle}>Luxury Dining Experience</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.formContainer}>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, isLogin && styles.activeToggle]}
              onPress={() => setIsLogin(true)}
            >
              <Text style={[styles.toggleText, isLogin && styles.activeToggleText]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, !isLogin && styles.activeToggle]}
              onPress={() => setIsLogin(false)}
            >
              <Text style={[styles.toggleText, !isLogin && styles.activeToggleText]}>Register</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            {!isLogin && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#666666"
                  value={formData.full_name}
                  onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#666666"
                  value={formData.username}
                  onChangeText={(text) => setFormData({ ...formData, username: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Phone (optional)"
                  placeholderTextColor="#666666"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                />
              </>
            )}
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <LuxuryButton
            title={isLogin ? 'Sign In' : 'Create Account'}
            onPress={handleSubmit}
            style={styles.submitButton}
          />

          {isLogin && (
            <View style={styles.demoContainer}>
              <Text style={styles.demoTitle}>Demo Credentials:</Text>
              <Text style={styles.demoText}>Email: john@example.com</Text>
              <Text style={styles.demoText}>Password: password</Text>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 42,
    fontWeight: '700',
    color: '#D4AF37',
    fontFamily: 'PlayfairDisplay-Bold',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    marginTop: 8,
    fontFamily: 'Lato-Regular',
  },
  formContainer: {
    width: '100%',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: '#D4AF37',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  activeToggleText: {
    color: '#000000',
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: 'white',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    fontFamily: 'Lato-Regular',
  },
  submitButton: {
    marginBottom: 24,
  },
  demoContainer: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37',
    marginBottom: 8,
    fontFamily: 'Lato-SemiBold',
  },
  demoText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 4,
    fontFamily: 'Lato-Regular',
  },
});

export default LoginScreen;