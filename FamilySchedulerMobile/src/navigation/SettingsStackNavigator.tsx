import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import Screens
import SettingsScreen from '../screens/Settings/SettingsScreen';
import PendingVacationInvitesScreen from '../screens/Vacations/PendingVacationInvitesScreen';
import AddIcsCalendarScreen from '../screens/Settings/AddIcsCalendarScreen'; // Import the new screen
// Import other screens navigated to from Settings here if needed
// e.g., import ProfileScreen from '../screens/Settings/ProfileScreen';

// Define Param List for this Stack
// (Moved from SettingsScreen.tsx for better organization)
export type SettingsStackParamList = {
  SettingsHome: undefined; // The main settings list screen
  Profile: undefined; // Example screen
  ChangePassword: undefined; // Example screen
  NotificationPreferences: undefined; // Example screen
  CalendarSync: undefined; // Example screen for managing calendars
  AddIcsCalendar: undefined; // Screen to add ICS calendar URL
  PrivacySettings: undefined; // Example screen
  FamilyManagement: undefined; // Example screen - might navigate to another stack
  PendingVacationInvites: undefined; // The new screen
  // Add other screens navigated to from Settings here
};

const Stack = createStackNavigator<SettingsStackParamList>();

const SettingsStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="SettingsHome"
      screenOptions={{
        // Keep header hidden by default as SettingsScreen uses Appbar
        // Individual screens can override this in options
        headerShown: false,
      }}
    >
      <Stack.Screen name="SettingsHome" component={SettingsScreen} />
      <Stack.Screen
        name="PendingVacationInvites"
        component={PendingVacationInvitesScreen}
        options={{
            headerShown: true, // Show header for this specific screen
            title: 'Pending Invites', // Set title for the header
        }}
       />
       <Stack.Screen
        name="AddIcsCalendar"
        component={AddIcsCalendarScreen}
        options={{
            headerShown: true, // Show header for this specific screen
            title: 'Add Calendar URL', // Set title for the header
        }}
       />
      {/* Add other settings screens here */}
      {/* <Stack.Screen name="Profile" component={ProfileScreen} /> */}
      {/* ... other screens */}
    </Stack.Navigator>
  );
};

export default SettingsStackNavigator;
