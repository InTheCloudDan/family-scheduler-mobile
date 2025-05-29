import React from 'react';
import { createBottomTabNavigator, BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

// --- Screen Components ---
import DashboardStackNavigator from './DashboardStackNavigator';
// import CalendarScreen from '../screens/Calendar/CalendarScreen'; // Replaced with Stack
import CalendarStackNavigator, { CalendarStackParamList } from './CalendarStackNavigator'; // Import Calendar Stack
// EventsScreen removed
import TasksStackNavigator, { TasksStackParamList } from './TasksStackNavigator'; // Import Tasks Stack
// SettingsScreen removed from direct import
import VacationsStackNavigator, { VacationsStackParamList } from './VacationsStackNavigator';
import FamilyStackNavigator from './FamilyStackNavigator';
import SettingsStackNavigator, { SettingsStackParamList } from './SettingsStackNavigator'; // Import the new navigator

import { DashboardStackParamList } from './DashboardStackNavigator';
import { NavigatorScreenParams } from '@react-navigation/native';

// import { CalendarStackParamList } from './CalendarStackNavigator'; // Redundant import removed

// Define Param List for the Tab Navigator
export type MainTabParamList = {
  Dashboard: NavigatorScreenParams<DashboardStackParamList>;
  Calendar: NavigatorScreenParams<CalendarStackParamList>; // Update Calendar type
  // Events removed
  Tasks: NavigatorScreenParams<TasksStackParamList>; // Add Tasks type
  Vacations: NavigatorScreenParams<VacationsStackParamList>;
  Family: undefined; // Keep Family tab type
  Settings: NavigatorScreenParams<SettingsStackParamList>; // Update Settings type
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }: BottomTabScreenProps<MainTabParamList>) => ({
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          let iconName = 'ellipse-outline';

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          // } else if (route.name === 'Events') { // Removed Events icon logic
          //   iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Tasks') { // Add Tasks icon logic
            iconName = focused ? 'checkbox' : 'checkbox-outline';
          } else if (route.name === 'Vacations') {
            iconName = focused ? 'airplane' : 'airplane-outline';
          } else if (route.name === 'Family') { // Add icon logic for Family
            iconName = focused ? 'people' : 'people-outline'; // Use Ionicons names
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarStackNavigator} // Use the Stack Navigator
        options={{ headerShown: false }} // Hide header for the tab itself
      />
      {/* <Tab.Screen name="Events" component={EventsScreen} /> Removed Events Tab */}
      <Tab.Screen // Add Tasks Tab Screen
        name="Tasks"
        component={TasksStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Vacations"
        component={VacationsStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen // Add Family Tab Screen
        name="Family"
        component={FamilyStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator} // Use the Stack Navigator
        options={{ headerShown: false }} // Hide header for the tab itself
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
