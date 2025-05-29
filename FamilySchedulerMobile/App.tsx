/**
 * Family Scheduler Mobile App Entry Point
 *
 * @format
 */

// Import gesture handler - must be at the top
import 'react-native-gesture-handler';

import React, { useEffect, useRef } from 'react'; // Add useRef
import { Provider as ReduxProvider, useDispatch, useSelector } from 'react-redux';
// Import NavigationContainer and theme types/objects
import { NavigationContainer, DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme, Theme as NavigationTheme, LinkingOptions, NavigationContainerRef } from '@react-navigation/native'; // Removed useNavigationContainerRef here, will use directly in RootApp
import { StatusBar, useColorScheme, ActivityIndicator, View, StyleSheet, Linking, Alert } from 'react-native'; // Add Linking, Alert
// Import Paper components and theme types/objects
import {
  Provider as PaperProvider,
  MD3LightTheme,
  MD3DarkTheme,
  adaptNavigationTheme, // We still use this to get adapted *colors*
  configureFonts,
  useTheme as usePaperTheme,
} from 'react-native-paper';
import store, { AppDispatch } from './src/store';
import { RootState } from './src/store/rootReducer';
import { checkAuthToken } from './src/store/thunks/authThunks';
import { acceptVacationInviteByToken, clearInviteError } from './src/store/slices/vacationsSlice'; // Import invite thunk
import AppNavigator, { RootStackParamList } from './src/navigation/AppNavigator'; // Import RootStackParamList
import { GoogleSignin } from '@react-native-google-signin/google-signin';
// MainTabParamList no longer needed here

// --- Theme Configuration ---

// 1. Adapt Paper theme colors for Navigation
const { LightTheme: AdaptedNavColorsLight, DarkTheme: AdaptedNavColorsDark } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

// 2. Define the full Paper themes (using adapted colors for consistency)
const CombinedPaperLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...AdaptedNavColorsLight.colors, // Merge adapted navigation colors
    // Add custom light theme overrides here if needed
    // primary: '#6200ee',
    // background: '#f6f6f6',
    // surfaceVariant: '#e0e0e0', // Often used for input backgrounds
    // onSurfaceVariant: '#444444', // Text color on surfaceVariant
    // placeholder: '#a0a0a0', // Placeholder text color
  },
  // fonts: configureFonts({config: fontConfig, isV3: true}), // Optional font config
};

const CombinedPaperDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...AdaptedNavColorsDark.colors, // Merge adapted navigation colors
    // Add custom dark theme overrides here if needed
    // primary: '#bb86fc',
    // background: '#121212',
    // surfaceVariant: '#333333', // Often used for input backgrounds
    // onSurfaceVariant: '#cccccc', // Text color on surfaceVariant
    // placeholder: '#888888', // Placeholder text color
  },
  // fonts: configureFonts({config: fontConfig, isV3: true}), // Optional font config
};

// 3. Define themes strictly for NavigationContainer using standard structure + adapted colors
const NavigationLightThemeForContainer: NavigationTheme = {
  ...NavigationDefaultTheme, // Base structure
  colors: CombinedPaperLightTheme.colors, // Use colors from our combined Paper theme
};

const NavigationDarkThemeForContainer: NavigationTheme = {
  ...NavigationDarkTheme, // Base structure
  colors: CombinedPaperDarkTheme.colors, // Use colors from our combined Paper theme
};

// --- End Theme Configuration ---

// --- Linking Configuration ---
// Use the RootStackParamList for the LinkingOptions
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['https://kinhearthly.com', 'famsched://'],
  config: {
    // Configuration for matching screens and params from the URL
    screens: {
      // Match the structure of RootStackParamList
      MainTabs: { // The screen name in the RootStack
        screens: { // Screens within the MainTabNavigator
          Vacations: { // The screen name in the MainTabNavigator (which is a StackNavigator)
             // Define the path pattern relative to the parent navigator ('MainTabs')
             // The path will be parsed, and the token extracted in processInviteLink.
             // No need to define a specific screen name here for the path itself.
             path: 'vacations/accept-invite/:token',
          },
          // Define other potential deep link targets within MainTabs if needed
        },
      },
      // Define paths for Auth stack if needed, e.g., password reset
      // Auth: {
      //   screens: {
      //     PasswordResetConfirm: 'password/reset/confirm/:uid/:token',
      //   }
      // }
    },
  },
  // Function to handle the parsed URL
  async getInitialURL() {
    // Handle link opened when app is closed
    const url = await Linking.getInitialURL();
    console.log('Initial URL:', url);
    return url;
  },
  subscribe(listener) {
    // Handle link opened when app is open/background
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('Received URL:', url);
      listener(url);
    });

    return () => {
      // Clean up the listener
      subscription.remove();
    };
  },
};
// --- End Linking Configuration ---


// Inner component rendered within PaperProvider and NavigationContainer
// Pass navigationRef down as a prop, allowing null initially
const AppNavigation = ({ navigationRef }: { navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList> | null> }) => {
  const { isAppLoading, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const paperTheme = usePaperTheme(); // Use the theme provided by PaperProvider
  // navigationRef is now passed as a prop

  // Function to process the invite token from a URL
  const processInviteLink = async (url: string | null) => {
    if (!url) return;

    console.log('Processing URL:', url);
    const match = url.match(/vacations\/accept-invite\/([a-fA-F0-9-]+)/);
    const token = match?.[1];

    if (token) {
      console.log('Extracted Token:', token);
      // Ensure user is authenticated before dispatching
      if (isAuthenticated) {
        console.log('User authenticated, dispatching acceptVacationInviteByToken...');
        dispatch(clearInviteError()); // Clear previous errors
        const resultAction = await dispatch(acceptVacationInviteByToken(token));

        if (acceptVacationInviteByToken.fulfilled.match(resultAction)) {
          console.log('Invite accepted successfully via deep link.');
          Alert.alert('Invite Accepted', 'You have successfully joined the vacation!');
          // Navigate to the vacation detail screen
          const vacationId = typeof resultAction.payload.vacation === 'number'
            ? resultAction.payload.vacation
            : resultAction.payload.vacation.id;
          // Use navigationRef to navigate after ensuring the navigator is ready
          // Correct the navigation path based on RootStackParamList
          if (navigationRef.current?.isReady()) {
             // Ensure the types match exactly for nested navigation
             navigationRef.current?.navigate<'MainTabs'>('MainTabs', { // Specify Root stack screen name
                screen: 'Vacations', // Specify Tab screen name
                params: { // Specify params for Vacations stack
                    screen: 'VacationDetail', // Specify screen within Vacations stack
                    params: { vacationId }, // Specify params for VacationDetail
                }
             });
          } else {
              console.warn('Navigator not ready for deep link navigation yet.');
              // Optionally, store the navigation target and attempt later
          }
        } else {
          console.log('Failed to accept invite via deep link:', resultAction.payload);
          Alert.alert('Invite Error', `Failed to accept invite: ${resultAction.payload || 'Unknown error'}`);
        }
      } else {
        console.log('User not authenticated for deep link processing.');
        // Optionally, store the token and process after login, or show a message
        Alert.alert('Login Required', 'Please log in to accept the vacation invitation.');
        // Navigation to Auth stack is handled automatically by AppNavigator based on isAuthenticated state.
        // No explicit navigation needed here.
        // if (navigationRef.current?.isReady()) {
        //      navigationRef.current?.navigate<'Auth'>('Auth');
        // }
      }
    } else {
        console.log('URL did not match invite pattern:', url);
    }
  };


  useEffect(() => {
    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: '97421844016-anbbufpg5ok5b9k2s75pqtlt2mem9tr6.apps.googleusercontent.com',
      offlineAccess: false,
    });
    // Check auth token on initial load
    dispatch(checkAuthToken());

    // Configure Google Sign-In (only needs to be done once)
    // Moved configuration outside useEffect or ensure it runs only once

    // Handle initial URL if app was launched by deep link
    Linking.getInitialURL().then(url => processInviteLink(url)).catch(err => console.error('Error getting initial URL:', err));

    // Listen for subsequent deep links while app is open
    const subscription = Linking.addEventListener('url', ({ url }) => processInviteLink(url));

    return () => subscription.remove(); // Cleanup listener

  }, [dispatch, isAuthenticated]); // Add isAuthenticated dependency to re-evaluate if needed after login

  if (isAppLoading) {
    // Loading indicator uses theme from PaperProvider context
    return (
      <View style={[styles.loadingContainer, { backgroundColor: paperTheme.colors.background }]}>
        <ActivityIndicator size="large" color={paperTheme.colors.primary} />
      </View>
    );
  }

  // AppNavigator will inherit the theme from NavigationContainer
  return <AppNavigator />;
};


// Component that sets up Providers and determines theme
const RootApp = () => {
  const colorScheme = useColorScheme();
  // Select the correct full Paper theme for PaperProvider
  const paperTheme = colorScheme === 'dark' ? CombinedPaperDarkTheme : CombinedPaperLightTheme;
  // Select the correct Navigation theme for NavigationContainer
  const navigationTheme = colorScheme === 'dark' ? NavigationDarkThemeForContainer : NavigationLightThemeForContainer;
  // Create the ref here, allowing null initially
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList> | null>(null);

  // Configure Google Sign-In once when RootApp mounts
  useEffect(() => {
      GoogleSignin.configure({
        webClientId: '97421844016-anbbufpg5ok5b9k2s75pqtlt2mem9tr6.apps.googleusercontent.com',
        offlineAccess: false,
      });
  }, []);


  return (
    // PaperProvider provides the full theme to components using useTheme() from paper
    <PaperProvider theme={paperTheme}>
      {/* NavigationContainer provides the theme strictly conforming to NavigationTheme */}
      {/* Pass linking config and ref */}
      <NavigationContainer<RootStackParamList> theme={navigationTheme} linking={linking} ref={navigationRef} fallback={<ActivityIndicator style={styles.loadingContainer} />}>
         <StatusBar
            barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
            backgroundColor={paperTheme.colors.background} // Use Paper theme background for status bar
          />
        {/* Pass navigationRef down to AppNavigation */}
        <AppNavigation navigationRef={navigationRef} />
      </NavigationContainer>
    </PaperProvider>
  );
};

// Main App component
function App(): React.JSX.Element {
  return (
    <ReduxProvider store={store}>
      <RootApp />
    </ReduxProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
