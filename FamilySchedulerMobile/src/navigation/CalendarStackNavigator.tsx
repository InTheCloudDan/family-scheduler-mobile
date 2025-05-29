import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CalendarScreen from '../screens/Calendar/CalendarScreen';
import EventFormScreen from '../screens/Events/EventFormScreen'; // Import the new screen
// TODO: Import EventDetailScreen if needed within this stack
// import EventDetailScreen from '../screens/Events/EventDetailScreen';

export type CalendarStackParamList = {
  Calendar: undefined; // Calendar screen takes no params directly in this stack
  EventForm: { eventId?: number; date?: string }; // Params for EventForm
  // EventDetail: { eventId: number }; // Example if EventDetail is needed here
};

const Stack = createStackNavigator<CalendarStackParamList>();

const CalendarStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Calendar"
      screenOptions={{
        headerShown: false, // Typically hide stack header in tabs
      }}
    >
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen
        name="EventForm"
        component={EventFormScreen}
        options={{
          headerShown: true, // Show header for the form screen
          title: 'Add/Edit Event', // Set a title for the header
        }}
      />
      {/* Add EventDetailScreen here if navigation from Calendar list items is desired */}
      {/* <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{
          headerShown: true,
          title: 'Event Details',
        }}
      /> */}
    </Stack.Navigator>
  );
};

export default CalendarStackNavigator;
