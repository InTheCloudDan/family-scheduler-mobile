import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screen components once they are created
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen'; // Import actual RegisterScreen
import PasswordResetRequestScreen from '../screens/Auth/PasswordResetRequestScreen'; // Import request screen
import PasswordResetConfirmScreen from '../screens/Auth/PasswordResetConfirmScreen'; // Import confirm screen

// Placeholder screens
// import { View, Text } from 'react-native'; // Removed unused imports
// const LoginScreen = () => <View><Text>Login Screen Placeholder</Text></View>; // Replaced by import
// const RegisterScreen = () => <View><Text>Register Screen Placeholder</Text></View>; // Replaced by import
// const PasswordResetScreen = () => <View><Text>Password Reset Placeholder</Text></View>;


// Define the parameter list for the Auth stack
// Undefined means no params passed to the route, add types for params if needed
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  PasswordResetRequest: undefined; // Add screen for requesting reset
  PasswordResetConfirm: { uid: string; token: string }; // Add screen for confirming reset (needs params)
};

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false, // Hide headers for auth flow, or customize as needed
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="PasswordResetRequest" component={PasswordResetRequestScreen} />
      <Stack.Screen name="PasswordResetConfirm" component={PasswordResetConfirmScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
