import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/appConfig';
import { createMockAuth, removeMockAuth } from '../utils/mockAuth';

export const DebugAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      
      setToken(storedToken);
      setUser(storedUser ? JSON.parse(storedUser) : null);
      
      console.log('🔍 Debug Auth Status:');
      console.log('Token:', storedToken ? `${storedToken.substring(0, 20)}...` : 'NOT FOUND');
      console.log('User:', storedUser ? JSON.parse(storedUser) : 'NOT FOUND');
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
    }
  };

  const handleCreateMockAuth = async () => {
    try {
      await createMockAuth();
      await checkAuthStatus();
    } catch (error) {
      console.error('Failed to create mock auth:', error);
    }
  };

  const handleRemoveAuth = async () => {
    try {
      await removeMockAuth();
      await checkAuthStatus();
    } catch (error) {
      console.error('Failed to remove auth:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Auth Status</Text>
      <Text style={styles.text}>Token: {token ? 'Present' : 'Missing'}</Text>
      <Text style={styles.text}>User: {user?.name || 'Not logged in'}</Text>
      <View style={styles.buttons}>
        <Button mode="outlined" onPress={handleCreateMockAuth} style={styles.button}>
          Create Mock Auth
        </Button>
        <Button mode="outlined" onPress={handleRemoveAuth} style={styles.button}>
          Clear Auth
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderRadius: 5,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  text: {
    fontSize: 14,
    marginTop: 5,
  },
  buttons: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  button: {
    flex: 1,
  },
});