import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useDispatch } from 'react-redux';
import * as Keychain from 'react-native-keychain'; // Import Keychain
import { Button, List, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import { StackNavigationProp } from '@react-navigation/stack'; // Import StackNavigationProp
import { logout } from '../../store/slices/authSlice';
import { AppDispatch } from '../../store';

// Define a ParamList for the Settings stack if it doesn't exist elsewhere
// This assumes SettingsScreen is part of a StackNavigator
type SettingsStackParamList = {
  SettingsHome: undefined; // The main settings list screen
  Profile: undefined; // Example screen
  ChangePassword: undefined; // Example screen
  NotificationPreferences: undefined; // Example screen
  CalendarSync: undefined; // Example screen
  AddIcsCalendar: undefined; // Add the new screen here
  PrivacySettings: undefined; // Example screen
  FamilyManagement: undefined; // Example screen - might navigate to another stack
  PendingVacationInvites: undefined; // The new screen
  // Add other screens navigated to from Settings here
};

type SettingsScreenNavigationProp = StackNavigationProp<SettingsStackParamList, 'SettingsHome'>;


const SettingsScreen: React.FC = () => { // Removed Props interface as navigation is handled by hook
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<SettingsScreenNavigationProp>(); // Use the hook

  const handleLogout = async () => { // Make async
    try {
      // Clear tokens from Keychain
      await Keychain.resetGenericPassword({ service: 'accessToken' });
      await Keychain.resetGenericPassword({ service: 'refreshToken' });
      console.log('Keychain tokens cleared.');
    } catch (error) {
      console.error('Failed to clear Keychain tokens:', error);
      // Optionally show an error to the user, but proceed with logout anyway
    }
    dispatch(logout()); // Dispatch Redux logout action
  };

  // Updated function to use typed navigation
  const navigateToScreen = (screenName: keyof SettingsStackParamList) => {
      navigation.navigate(screenName);
  };

  return (
    <ScrollView style={styles.container}>
      <List.Section>
        <List.Subheader>Account</List.Subheader>
        <List.Item
          title="Profile"
          description="View and edit your profile information"
          left={props => <List.Icon {...props} icon="account-circle-outline" />}
          onPress={() => navigateToScreen('Profile')}
        />
         <List.Item
          title="Change Password"
          description="Update your account password"
          left={props => <List.Icon {...props} icon="lock-outline" />}
          onPress={() => navigateToScreen('ChangePassword')}
        />
         <List.Item
            title="Pending Vacation Invites"
            description="Accept or decline invites to join vacations"
            left={props => <List.Icon {...props} icon="email-open-outline" />}
            onPress={() => navigateToScreen('PendingVacationInvites')} // Navigate to the new screen
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Preferences</List.Subheader>
         <List.Item
          title="Notifications"
          description="Configure push and email notifications"
          left={props => <List.Icon {...props} icon="bell-outline" />}
          onPress={() => navigateToScreen('NotificationPreferences')}
        />
         <List.Item
          title="Calendar Sync"
          description="Manage connected external calendars"
          left={props => <List.Icon {...props} icon="sync" />}
          onPress={() => navigateToScreen('CalendarSync')}
        />
        <List.Item
          title="Add Calendar via URL (.ics)"
          description="Subscribe to an external calendar"
          left={props => <List.Icon {...props} icon="link-plus" />}
          onPress={() => navigateToScreen('AddIcsCalendar')} // Navigate to the new screen
        />
         <List.Item
          title="Privacy"
          description="Review visibility and privacy settings"
          left={props => <List.Icon {...props} icon="shield-lock-outline" />}
          onPress={() => navigateToScreen('PrivacySettings')} // May link to web
        />
      </List.Section>

       <Divider />

       <List.Section>
         <List.Subheader>Family</List.Subheader>
          <List.Item
            title="Manage Family"
            description="View members and invite others"
            left={props => <List.Icon {...props} icon="account-group-outline" />}
            onPress={() => navigateToScreen('FamilyManagement')}
          />
       </List.Section>

      <Divider />

      {/* Logout Button */}
      <View style={styles.logoutButtonContainer}>
         <Button mode="contained" onPress={handleLogout} buttonColor="red">
            Logout
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // No justifyContent/alignItems needed for ScrollView list
  },
  logoutButtonContainer: {
    marginTop: 30,
    marginBottom: 30, // Add bottom margin too
    paddingHorizontal: 20, // Add horizontal padding
    alignItems: 'center', // Center button
  },
  // Add other styles if needed
});

export default SettingsScreen;
