import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native'; // Removed Text, TextInput, Button
import { StackNavigationProp } from '@react-navigation/stack';
import apiClient from '../../services/api';
import { Text, TextInput, Button, HelperText } from 'react-native-paper'; // Import Paper components
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type PasswordResetRequestScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'PasswordResetRequest'>;

interface Props {
  navigation: PasswordResetRequestScreenNavigationProp;
}

const PasswordResetRequestScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Clear messages on focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setError(null);
      setSuccessMessage(null);
      // setEmail(''); // Optionally clear email on focus
    });
    return unsubscribe;
  }, [navigation]);

  // Clear error on input change
  const handleInputChange = (text: string) => {
    setEmail(text);
    if (error) setError(null);
    if (successMessage) setSuccessMessage(null); // Clear success message too
  };

  const handleRequestReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // API endpoint for requesting password reset - adjust as needed
      await apiClient.post('/auth/password/reset/', { email });
      setSuccessMessage('Password reset email sent. Please check your inbox.');
      // Optionally navigate back to login or show success inline
      // navigation.goBack();
    } catch (err: any) {
      console.error('Password reset request failed:', err);
      let errorMessage = 'Failed to send password reset email. Please try again.';
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.email) {
         errorMessage = `Email: ${err.response.data.email.join ? err.response.data.email.join(', ') : err.response.data.email}`;
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
      <Text variant="headlineMedium" style={styles.title}>Reset Password</Text>
      <HelperText type="error" visible={!!error} style={styles.messageText}>
        {error}
      </HelperText>
       <HelperText type="info" visible={!!successMessage} style={styles.messageText}>
        {successMessage}
      </HelperText>
      <TextInput
        label="Email"
        value={email}
        style={styles.input}
        onChangeText={handleInputChange}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoading}
        mode="outlined"
      />
      <Button
          mode="contained"
          onPress={handleRequestReset}
          disabled={isLoading}
          loading={isLoading}
          style={styles.button}
      >
          Send Reset Link
      </Button>
       <Button
          mode="text"
          onPress={() => navigation.navigate('Login')}
          disabled={isLoading}
          style={styles.button}
       >
          Back to Login
        </Button>
      {/* Removed extra closing view tag that might have caused error */}
    </View>
  );
};

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
    fontSize: 14, // Adjust size if needed
  },
}); // Ensure this closing brace and parenthesis are correct

export default PasswordResetRequestScreen;
