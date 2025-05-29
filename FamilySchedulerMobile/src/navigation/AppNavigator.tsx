import React from 'react';
import { useSelector } from 'react-redux';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigatorScreenParams } from '@react-navigation/native'; // Import this

import AuthNavigator, { AuthStackParamList } from './AuthNavigator'; // Assuming AuthStackParamList is exported
import MainTabNavigator, { MainTabParamList } from './MainTabNavigator'; // Import MainTabParamList
import { RootState } from '../store/rootReducer';

// Define the Root Stack Param List
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>; // Nested Auth stack
  MainTabs: NavigatorScreenParams<MainTabParamList>; // Nested Main Tab stack
};

const RootStack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <RootStack.Navigator
      // Conditionally set the initial route based on auth state
      // Note: This might cause a flicker on auth state change. Consider managing this differently if needed.
      initialRouteName={isAuthenticated ? 'MainTabs' : 'Auth'}
      screenOptions={{ headerShown: false }} // Hide header for the root stack screens
    >
      {isAuthenticated ? (
        <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
      {/* You could also define both screens always and use navigation.replace on auth change */}
      {/* <RootStack.Screen name="Auth" component={AuthNavigator} />
          <RootStack.Screen name="MainTabs" component={MainTabNavigator} /> */}
    </RootStack.Navigator>
  );
};

export default AppNavigator;
