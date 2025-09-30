import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/slices/userSlice';
import { mockApi } from '../../services/mockApi';
import LuxuryButton from '../../components/LuxuryButton';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Eye, EyeOff, User, Lock, Mail } from 'lucide-react-native';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'customer' | 'employee' | 'admin'>('customer');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const user = await mockApi.loginUser(email, password, selectedRole);
      if (user) {
        dispatch(setUser(user));
        // Navigation will be handled by the main app based on user role
      } else {
        Alert.alert('Error', 'Invalid credentials or role mismatch');
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  const roleOptions = [
    { value: 'customer', label: 'Customer', description: 'Browse menu, make reservations, place orders' },
    { value: 'employee', label: 'Employee', description: 'Manage orders, check attendance, view schedules' },
    { value: 'admin', label: 'Admin', description: 'Full system access and management' },
  ];

  return (
    <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Animated.View entering={FadeInUp.duration(800)} style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </Animated.View>

          {/* Role Selection */}
          <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.roleContainer}>
            <Text style={styles.roleTitle}>Select Role</Text>
            {roleOptions.map((role, index) => (
              <TouchableOpacity
                key={role.value}
                style={[
                  styles.roleOption,
                  selectedRole === role.value && styles.selectedRoleOption,
                ]}
                onPress={() => setSelectedRole(role.value as any)}
              >
                <View style={styles.roleContent}>
                  <Text style={[
                    styles.roleLabel,
                    selectedRole === role.value && styles.selectedRoleLabel,
                  ]}>
                    {role.label}
                  </Text>
                  <Text style={[
                    styles.roleDescription,
                    selectedRole === role.value && styles.selectedRoleDescription,
                  ]}>
                    {role.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Login Form */}
          <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Mail color="#D4AF37" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#666666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock color="#D4AF37" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#666666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff color="#666666" size={20} />
                ) : (
                  <Eye color="#666666" size={20} />
                )}
              </TouchableOpacity>
            </View>

            <LuxuryButton
              title={loading ? 'Signing In...' : 'Sign In'}
              onPress={handleLogin}
              disabled={loading}
              style={styles.loginButton}
            />

            <TouchableOpacity onPress={handleRegister} style={styles.registerLink}>
              <Text style={styles.registerText}>
                Don't have an account? <Text style={styles.registerLinkText}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Demo Credentials */}
          <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.demoContainer}>
            <Text style={styles.demoTitle}>Demo Credentials</Text>
            <View style={styles.demoCredentials}>
              <Text style={styles.demoText}>Customer: customer@demo.com / password</Text>
              <Text style={styles.demoText}>Employee: employee@demo.com / password</Text>
              <Text style={styles.demoText}>Admin: admin@demo.com / password</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#D4AF37',
    fontFamily: 'PlayfairDisplay-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    fontFamily: 'Lato-Regular',
  },
  roleContainer: {
    marginBottom: 30,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#D4AF37',
    marginBottom: 16,
    fontFamily: 'Lato-SemiBold',
  },
  roleOption: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  selectedRoleOption: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  roleContent: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CCCCCC',
    marginBottom: 4,
    fontFamily: 'Lato-SemiBold',
  },
  selectedRoleLabel: {
    color: '#D4AF37',
  },
  roleDescription: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Lato-Regular',
  },
  selectedRoleDescription: {
    color: '#CCCCCC',
  },
  formContainer: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: 'white',
    fontFamily: 'Lato-Regular',
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 20,
  },
  registerLink: {
    alignItems: 'center',
  },
  registerText: {
    fontSize: 16,
    color: '#CCCCCC',
    fontFamily: 'Lato-Regular',
  },
  registerLinkText: {
    color: '#D4AF37',
    fontWeight: '600',
    fontFamily: 'Lato-SemiBold',
  },
  demoContainer: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37',
    marginBottom: 12,
    fontFamily: 'Lato-SemiBold',
  },
  demoCredentials: {
    gap: 8,
  },
  demoText: {
    fontSize: 14,
    color: '#CCCCCC',
    fontFamily: 'Lato-Regular',
  },
});

export default LoginScreen;
