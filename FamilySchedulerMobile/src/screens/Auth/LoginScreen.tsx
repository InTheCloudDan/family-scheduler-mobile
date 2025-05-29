import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native'; // Removed Text, TextInput, Button
import { useDispatch, useSelector } from 'react-redux';
import * as Keychain from 'react-native-keychain';
import { Text, TextInput, Button, HelperText } from 'react-native-paper'; // Import Paper components
import { StackNavigationProp } from '@react-navigation/stack';
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin'; // Import Google Sign-In components

import {
  loginStart,
  loginSuccess,
  loginFailure,
  clearAuthError, // Import action to clear error on screen focus/input change
} from '../../store/slices/authSlice';
import apiClient from '../../services/api';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { AppDispatch } from '../../store'; // Import AppDispatch from store index
import { RootState } from '../../store/rootReducer'; // Import RootState from rootReducer

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch<AppDispatch>(); // Use AppDispatch type
  const isLoading = useSelector((state: RootState) => state.auth.isLoading); // Use RootState type
  const error = useSelector((state: RootState) => state.auth.error); // Use RootState type

  // Clear error when component focuses
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      dispatch(clearAuthError());
    });
    return unsubscribe;
  }, [navigation, dispatch]);

  // Clear error when user starts typing
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (text: string) => {
    setter(text);
    if (error) {
      dispatch(clearAuthError());
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    dispatch(loginStart());
    try {
      // API endpoint for JWT login - Send email value as 'username' field
      const response = await apiClient.post('/auth/login/', { username: email, password });

      // IMPORTANT: Adjust structure based on actual API response!
      // Assuming response.data contains { access: string, refresh?: string, user: UserObject }
      const { access, refresh, user } = response.data;

      if (!access || !user) {
        console.error('Invalid login response structure:', response.data);
        throw new Error('Invalid login response from server.');
      }

      // Store tokens securely using Keychain
      // Use email or user ID as the username for Keychain, access token as password
      await Keychain.setGenericPassword(user.id.toString() || email, access, { service: 'accessToken' });
      if (refresh) {
        // Store refresh token separately if needed
        await Keychain.setGenericPassword(user.id.toString() || email, refresh, { service: 'refreshToken' });
      }

      // Dispatch success action to update Redux state
      // Ensure the 'user' object structure matches the User interface in authSlice
      dispatch(loginSuccess({ user: user, token: access, refreshToken: refresh }));

      // Navigation to the main app will happen automatically via AppNavigator
      // due to the change in isAuthenticated state.

    } catch (err: any) {
      console.error('Login API call failed:', err);
      let errorMessage = 'Login failed. Please check your credentials or network connection.';
      // Try to extract a more specific error message from the API response
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data && typeof err.response.data === 'object') {
         // Handle cases where error might be nested or have multiple fields
         const firstErrorKey = Object.keys(err.response.data)[0];
         if (firstErrorKey && Array.isArray(err.response.data[firstErrorKey])) {
            errorMessage = `${firstErrorKey}: ${err.response.data[firstErrorKey][0]}`;
         } else if (firstErrorKey) {
            errorMessage = `${firstErrorKey}: ${JSON.stringify(err.response.data[firstErrorKey])}`;
         }
      } else if (err.message) {
        errorMessage = err.message; // Fallback to generic error message
      }
      dispatch(loginFailure(errorMessage));
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices(); // Check for Play Services on Android
      dispatch(loginStart()); // Indicate loading

      const userInfo = await GoogleSignin.signIn();
      // Access idToken safely using optional chaining on the nested data object
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        throw new Error('Google Sign-In failed to return ID token.');
      }

      console.log('Google ID Token:', idToken); // Log for debugging

      // Send the idToken to your backend for verification and JWT exchange
      // IMPORTANT: Adjust the endpoint and payload structure based on your backend API
      const response = await apiClient.post('/auth/google/', { access_token: idToken });

      const { access, refresh, user } = response.data;
      if (!access || !user) {
        throw new Error('Invalid response from backend Google auth endpoint.');
      }

      // Store tokens securely
      await Keychain.setGenericPassword(user.id.toString() || user.email, access, { service: 'accessToken' });
      if (refresh) {
        await Keychain.setGenericPassword(user.id.toString() || user.email, refresh, { service: 'refreshToken' });
      }

      // Dispatch success action
      dispatch(loginSuccess({ user: user, token: access, refreshToken: refresh }));

    } catch (error: any) {
      let errorMessage = 'Google Sign-In failed.';
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        errorMessage = 'Google Sign-In cancelled by user.';
        dispatch(clearAuthError()); // Clear loading/error state if cancelled
      } else if (error.code === statusCodes.IN_PROGRESS) {
        errorMessage = 'Google Sign-In is already in progress.';
        // Don't dispatch failure, just inform user
        Alert.alert('Info', errorMessage);
        dispatch(clearAuthError()); // Clear loading state
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorMessage = 'Google Play Services not available or outdated.';
        dispatch(loginFailure(errorMessage));
      } else {
        // Handle API errors from your backend or other errors
        if (error.response?.data?.detail) {
            errorMessage = error.response.data.detail;
        } else if (error.message) {
            errorMessage = error.message;
        }
        console.error('Google Sign-In Error:', error.code, error.message, error.response?.data);
        dispatch(loginFailure(errorMessage));
      }
      // Only show alert for actual failures, not cancellations or in-progress
      if (error.code !== statusCodes.SIGN_IN_CANCELLED && error.code !== statusCodes.IN_PROGRESS) {
         Alert.alert('Login Error', errorMessage);
      }
    }
  };


  const navigateToRegister = () => {
    if (!isLoading) { // Prevent navigation while loading
        navigation.navigate('Register');
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>Login</Text>
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
        mode="outlined" // Use Paper's input style
      />
      <TextInput
        label="Password"
        value={password}
        style={styles.input}
        onChangeText={handleInputChange(setPassword)}
        secureTextEntry
        editable={!isLoading}
        mode="outlined" // Use Paper's input style
      />
      <Button
          mode="contained" // Paper button style
          onPress={handleLogin}
          disabled={isLoading}
          loading={isLoading} // Show loading indicator on button
          style={styles.button}
      >
          Login
      </Button>
      <Button
          mode="text" // Paper button style
          onPress={navigateToRegister}
          disabled={isLoading}
          style={styles.button}
      >
          Don't have an account? Register
       </Button>
       <Button
           mode="text" // Paper button style
           onPress={() => navigation.navigate('PasswordResetRequest')}
           disabled={isLoading}
           style={styles.button}
           labelStyle={styles.forgotPasswordLabel} // Custom style for link-like appearance
       >
           Forgot Password?
        </Button>
        {/* Add Google Sign-In Button */}
         <GoogleSigninButton
             style={styles.googleButton}
             size={GoogleSigninButton.Size.Wide}
             color={GoogleSigninButton.Color.Dark}
             onPress={handleGoogleSignIn}
             disabled={isLoading}
         />
      </View>
   );
 };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5', // Example background color
   },
   title: {
     // Use Paper's Text variant prop instead of direct styling for size/weight
     marginBottom: 30,
     textAlign: 'center',
   },
   input: {
     width: '100%',
     marginBottom: 10, // Adjust spacing
     // height is managed by Paper's TextInput
   },
   button: { // Style for Paper buttons
     width: '100%',
     marginTop: 10,
     paddingVertical: 5, // Add some padding
   },
   errorText: {
     width: '100%', // Ensure helper text spans width
     textAlign: 'center',
     marginBottom: 10,
   },
   forgotPasswordLabel: { // Custom style for forgot password button text
       fontSize: 14,
       // color: '#666', // Can set color here or via Button's textColor prop
   },
   googleButton: {
       width: '100%',
       height: 48, // Standard Google button height
       marginTop: 20,
   }
 });

export default LoginScreen;
