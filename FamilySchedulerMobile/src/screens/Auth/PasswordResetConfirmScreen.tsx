import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native'; // Removed Text, TextInput, Button
import { StackNavigationProp } from '@react-navigation/stack';
// import { RouteProp } from '@react-navigation/native'; // Removed unused import
import apiClient from '../../services/api';
import { Text, TextInput, Button, HelperText } from 'react-native-paper'; // Import Paper components
import { AuthStackParamList } from '../../navigation/AuthNavigator';

// Define route params - uncomment and adjust when adding to AuthStackParamList
// type PasswordResetConfirmScreenRouteProp = RouteProp<AuthStackParamList, 'PasswordResetConfirm'>;
type PasswordResetConfirmScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'PasswordResetConfirm'>; // Add 'PasswordResetConfirm' to param list later

interface Props {
  // route: PasswordResetConfirmScreenRouteProp; // To access token/uid from params
  navigation: PasswordResetConfirmScreenNavigationProp;
}

const PasswordResetConfirmScreen: React.FC<Props> = ({ /* route, */ navigation }) => {
  // TODO: Get uid and token from route.params when deep linking/navigation is set up
  const uid = 'TEMP_UID'; // Placeholder
  const token = 'TEMP_TOKEN'; // Placeholder

  const [newPassword1, setNewPassword1] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

   // Clear messages on focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setError(null);
      setSuccessMessage(null);
    });
    return unsubscribe;
  }, [navigation]);

  // Clear error on input change
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (text: string) => {
    setter(text);
    if (error) setError(null);
    if (successMessage) setSuccessMessage(null);
  };


  const handleConfirmReset = async () => {
    if (!newPassword1 || !newPassword2) {
      Alert.alert('Error', 'Please enter and confirm your new password.');
      return;
    }
    if (newPassword1 !== newPassword2) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    // TODO: Add password strength validation if needed

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // API endpoint for confirming password reset - adjust as needed
      const payload = {
        uid: uid, // From route params
        token: token, // From route params
        new_password1: newPassword1,
        new_password2: newPassword2,
      };
      await apiClient.post('/auth/password/reset/confirm/', payload); // Adjust endpoint if necessary
      setSuccessMessage('Password has been successfully reset.');
      Alert.alert(
        'Success',
        'Password has been reset. Please log in with your new password.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err: any) {
      console.error('Password reset confirmation failed:', err.response?.data || err);
      let errorMessage = 'Failed to reset password. The link may be invalid or expired.';
       if (err.response?.data) {
           const errors = err.response.data;
           const messages = Object.keys(errors).map(key => `${key}: ${errors[key].join ? errors[key].join(', ') : errors[key]}`);
           errorMessage = messages.join('\n') || errorMessage;
       } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Set New Password</Text>
       <HelperText type="error" visible={!!error} style={styles.messageText}>
        {error}
      </HelperText>
       <HelperText type="info" visible={!!successMessage} style={styles.messageText}>
        {successMessage}
      </HelperText>
      <TextInput
        label="New Password"
        value={newPassword1}
        style={styles.input}
        onChangeText={handleInputChange(setNewPassword1)}
        secureTextEntry
        editable={!isLoading}
        mode="outlined"
      />
      <TextInput
        label="Confirm New Password"
        value={newPassword2}
        style={styles.input}
        onChangeText={handleInputChange(setNewPassword2)}
        secureTextEntry
        editable={!isLoading}
        mode="outlined"
      />
      <Button
          mode="contained"
          onPress={handleConfirmReset}
          disabled={isLoading}
          loading={isLoading}
          style={styles.button}
      >
          Reset Password
      </Button>
       <Button
          mode="text"
          onPress={() => navigation.navigate('Login')}
          disabled={isLoading}
          style={styles.button}
       >
          Back to Login
        </Button>
      {/* Removed extra closing view tag */}
    </View>
  );
};

// Use similar styles
const styles = StyleSheet.create({
   container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    // fontSize: 24, // Use variant prop
    // fontWeight: 'bold', // Use variant prop
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    marginBottom: 15,
  },
  button: {
    width: '100%',
    marginTop: 10,
    paddingVertical: 5,
  },
  messageText: { // Style for both error and success messages
    width: '100%',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
  },
}); // Ensure closing brace/parenthesis are correct

export default PasswordResetConfirmScreen;
