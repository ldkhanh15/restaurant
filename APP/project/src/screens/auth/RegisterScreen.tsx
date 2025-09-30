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
import { Eye, EyeOff, User, Lock, Mail, Phone } from 'lucide-react-native';

interface RegisterScreenProps {
  navigation: any;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'customer' | 'employee' | 'admin'>('customer');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { fullName, username, email, password, confirmPassword } = formData;
    
    if (!fullName || !username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userData = {
        full_name: formData.fullName,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        role: selectedRole,
        preferences: {
          allergies: [],
          favorite_dishes: [],
          preferred_location: 'near_window',
          dietary_restrictions: [],
          notification_preferences: {
            email: true,
            push: true,
            sms: false,
          },
        },
        ranking: 'regular',
        points: 0,
        is_active: true,
      };

      const user = await mockApi.registerUser(userData);
      if (user) {
        dispatch(setUser(user));
        Alert.alert('Success', 'Account created successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join our luxury dining experience</Text>
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

          {/* Registration Form */}
          <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <User color="#D4AF37" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#666666"
                value={formData.fullName}
                onChangeText={(value) => handleInputChange('fullName', value)}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <User color="#D4AF37" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#666666"
                value={formData.username}
                onChangeText={(value) => handleInputChange('username', value)}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Mail color="#D4AF37" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#666666"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Phone color="#D4AF37" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone (Optional)"
                placeholderTextColor="#666666"
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock color="#D4AF37" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#666666"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
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

            <View style={styles.inputContainer}>
              <Lock color="#D4AF37" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#666666"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff color="#666666" size={20} />
                ) : (
                  <Eye color="#666666" size={20} />
                )}
              </TouchableOpacity>
            </View>

            <LuxuryButton
              title={loading ? 'Creating Account...' : 'Create Account'}
              onPress={handleRegister}
              disabled={loading}
              style={styles.registerButton}
            />

            <TouchableOpacity onPress={handleLogin} style={styles.loginLink}>
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginLinkText}>Sign In</Text>
              </Text>
            </TouchableOpacity>
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
    marginBottom: 30,
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
    marginBottom: 20,
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
    marginBottom: 20,
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
  registerButton: {
    marginTop: 8,
    marginBottom: 20,
  },
  loginLink: {
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    color: '#CCCCCC',
    fontFamily: 'Lato-Regular',
  },
  loginLinkText: {
    color: '#D4AF37',
    fontWeight: '600',
    fontFamily: 'Lato-SemiBold',
  },
});

export default RegisterScreen;
