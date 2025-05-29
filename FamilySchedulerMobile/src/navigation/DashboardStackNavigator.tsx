import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import EventDetailScreen from '../screens/Events/EventDetailScreen'; // Corrected path
import { Event } from '../store/slices/eventsSlice'; // Import Event type

// Define the Param List for this Stack Navigator
export type DashboardStackParamList = {
  DashboardHome: undefined; // Renamed to avoid conflict with Tab name
  EventDetail: { event: Event }; // Pass the whole event object
};

const Stack = createStackNavigator<DashboardStackParamList>();

const DashboardStackNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="DashboardHome">
      <Stack.Screen
        name="DashboardHome"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }} // Set a title for the screen in the stack
      />
      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{ title: 'Event Details' }} // Set a title for the detail screen
      />
      {/* Add other screens relevant to the Dashboard flow here if needed */}
    </Stack.Navigator>
  );
};

export default DashboardStackNavigator;
