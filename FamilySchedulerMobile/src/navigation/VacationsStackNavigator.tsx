import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import VacationsScreen from '../screens/Vacations/VacationsScreen';
import VacationDetailScreen from '../screens/Vacations/VacationDetailScreen';
import VacationFormScreen from '../screens/Vacations/VacationFormScreen';
import PackingListScreen from '../screens/Vacations/PackingListScreen'; // Import new screen
import GroceryListScreen from '../screens/Vacations/GroceryListScreen'; // Import new screen

// Define Param List for the Stack Navigator
export type VacationsStackParamList = {
  VacationsList: undefined;
  VacationDetail: { vacationId: number };
  VacationForm: { vacationId?: number };
  PackingList: { vacationId: number; listId?: number }; // Added PackingList screen params
  GroceryList: { vacationId: number; listId?: number }; // Added GroceryList screen params
};

const Stack = createStackNavigator<VacationsStackParamList>();

const VacationsStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="VacationsList"
      screenOptions={{
        headerShown: false, // Hide stack header, screens manage their own Appbar
      }}
    >
      <Stack.Screen name="VacationsList" component={VacationsScreen} />
      <Stack.Screen name="VacationDetail" component={VacationDetailScreen} />
      <Stack.Screen name="VacationForm" component={VacationFormScreen} />
      <Stack.Screen name="PackingList" component={PackingListScreen} />
      <Stack.Screen name="GroceryList" component={GroceryListScreen} />
    </Stack.Navigator>
  );
};

export default VacationsStackNavigator;
