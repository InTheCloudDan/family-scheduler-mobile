import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native'; // Keep View, StyleSheet, Alert
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Keychain from 'react-native-keychain';
import { Text, TextInput, Button, HelperText } from 'react-native-paper'; // Import Paper components

import {
  loginStart,
  loginSuccess,
  loginFailure,
  clearAuthError,
} from '../../store/slices/authSlice';
import apiClient from '../../services/api';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { AppDispatch } from '../../store';
import { RootState } from '../../store/rootReducer';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // const [referralCode, setReferralCode] = useState(''); // Add if needed

  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);
  const error = useSelector((state: RootState) => state.auth.error);

  // Clear error on focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      dispatch(clearAuthError());
    });
    return unsubscribe;
  }, [navigation, dispatch]);

  // Clear error on input change
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (text: string) => {
    setter(text);
    if (error) {
      dispatch(clearAuthError());
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      // Use HelperText for this error instead? Or keep Alert? Alert is fine for now.
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    dispatch(loginStart());

    try {
      const payload = { email, password, password2: confirmPassword };
      // if (referralCode) payload.referral_code = referralCode;

      const response = await apiClient.post('/auth/register/', payload);

      if (response.data?.access && response.data?.user) {
        const { access, refresh, user } = response.data;
        await Keychain.setGenericPassword(user.id.toString() || email, access, { service: 'accessToken' });
        if (refresh) {
          await Keychain.setGenericPassword(user.id.toString() || email, refresh, { service: 'refreshToken' });
        }
        dispatch(loginSuccess({ user: user, token: access, refreshToken: refresh }));
      } else {
         dispatch(clearAuthError());
         Alert.alert(
           'Registration Successful',
           'Please log in with your new credentials.',
           [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
         );
      }

    } catch (err: any) {
      console.error('Registration API call failed:', err);
      let errorMessage = 'Registration failed. Please try again.';
       if (err.response?.data) {
           const errors = err.response.data;
           const messages = Object.keys(errors).map(key => `${key}: ${errors[key].join ? errors[key].join(', ') : errors[key]}`);
           errorMessage = messages.join('\n') || errorMessage;
       } else if (err.message) {
        errorMessage = err.message;
      }
      dispatch(loginFailure(errorMessage));
    }
  };

  const navigateToLogin = () => {
    if (!isLoading) {
        navigation.navigate('Login');
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>Register</Text>
      <HelperText type="error" visible={!!error} style={styles.errorText}>
        {error}
      </HelperText>
      <TextInput
        label="Email"
        value={email}
        style={styles.input}
        onChangeText={handleInputChange(setEmail)}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoading}
        mode="outlined"
      />
      <TextInput
        label="Password"
        value={password}
        style={styles.input}
        onChangeText={handleInputChange(setPassword)}
        secureTextEntry
        editable={!isLoading}
        mode="outlined"
      />
      <TextInput
        label="Confirm Password"
        value={confirmPassword}
        style={styles.input}
        onChangeText={handleInputChange(setConfirmPassword)}
        secureTextEntry
        editable={!isLoading}
        mode="outlined"
      />
      {/* Add Referral Code input if needed */}
      <Button
          mode="contained"
          onPress={handleRegister}
          disabled={isLoading}
          loading={isLoading}
          style={styles.button}
      >
          Register
      </Button>
      <Button
          mode="text"
          onPress={navigateToLogin}
          disabled={isLoading}
          style={styles.button}
      >
          Already have an account? Login
      </Button>
    </View>
  );
};

// Use similar styles as LoginScreen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    marginBottom: 10,
  },
  button: {
    width: '100%',
    marginTop: 10,
    paddingVertical: 5,
  },
  errorText: {
    width: '100%',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default RegisterScreen;
