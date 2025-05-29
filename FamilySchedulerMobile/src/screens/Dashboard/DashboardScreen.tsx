import React, { useEffect, useState } from 'react'; // Removed useCallback
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Text, Button, List, Divider, ActivityIndicator as PaperActivityIndicator, FAB, Searchbar } from 'react-native-paper';
import { logout } from '../../store/slices/authSlice';
// Import necessary actions and selectors from eventsSlice
import {
    fetchUpcomingEvents,
    fetchEvents, // For search
    Event,
    // No specific upcoming selector needed now
    selectEvents,         // Use this for both upcoming and search results
    selectEventsLoading,
    selectEventsError
} from '../../store/slices/eventsSlice';
import { fetchPendingTasks } from '../../store/slices/tasksSlice';
import { fetchRecentNotifications } from '../../store/slices/notificationsSlice';
import { AppDispatch } from '../../store';
import { RootState } from '../../store/rootReducer';
import { DashboardStackParamList } from '../../navigation/DashboardStackNavigator';

type DashboardScreenNavigationProp = StackNavigationProp<
  DashboardStackParamList,
  'DashboardHome'
>;

interface Props {}

const DashboardScreen: React.FC<Props> = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { user } = useSelector((state: RootState) => state.auth);

  // Selectors for Events (Upcoming or Search Results)
  const events = useSelector(selectEvents); // Holds either upcoming or search results
  const eventsLoading = useSelector(selectEventsLoading);
  const eventsError = useSelector(selectEventsError);

  // Selectors for other sections
  const tasksState = useSelector((state: RootState) => state.tasks);
  const notificationsState = useSelector((state: RootState) => state.notifications);

  // State for search
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Track initial dashboard load

  // Fetch initial dashboard data OR search results
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      setIsInitialLoad(false); // No longer initial load if searching
      dispatch(fetchEvents({ searchQuery: trimmedQuery }));
    } else {
      // Fetch initial dashboard data only if not searching
      setIsInitialLoad(true);
      dispatch(fetchUpcomingEvents()); // Fetch upcoming specifically
      dispatch(fetchPendingTasks());
      dispatch(fetchRecentNotifications());
    }
    // Dependency on searchQuery triggers refetch on change/clear
  }, [dispatch, searchQuery]);


  const handleLogout = () => {
    dispatch(logout());
  };

  // --- Render Helper Functions ---

  const renderEventItem = ({ item }: { item: Event }) => (
     <List.Item
          key={`event-${item.id}`}
          title={item.title}
          description={`Starts: ${new Date(item.start_time).toLocaleString()}`} // Reverted wrapping
          descriptionNumberOfLines={2}
          left={props => <List.Icon {...props} icon="calendar-blank-outline" />}
          onPress={() => navigation.navigate('EventDetail', { event: item })}
      />
  );

  // Renders the list of events (either upcoming or search results)
  const renderEventsList = () => {
    // Use ternaries for conditional rendering
    return eventsLoading && events.length === 0 ? (
      <PaperActivityIndicator animating={true} style={styles.loadingIndicator} />
    ) : eventsError ? (
      <Text style={styles.errorText}>
        {searchQuery.trim() ? `Error searching: ${eventsError}` : `Error loading events: ${eventsError}`}
      </Text>
    ) : !events || events.length === 0 ? (
      <Text style={styles.emptyText}>
        {searchQuery.trim() ? `No events found matching "${searchQuery}".` : 'No upcoming events.'}
      </Text>
    ) : searchQuery.trim() ? ( // If searching, use FlatList
      // Corrected: No return statement needed inside the ternary expression itself
      <FlatList
        data={events}
        renderItem={renderEventItem}
        keyExtractor={(item) => `search-event-${item.id}`}
        style={styles.searchResultsList}
      />
    ) : ( // If not searching (showing upcoming), map directly
      events.map(item => renderEventItem({ item }))
    );
  };

  const renderTasksSection = () => {
    // Use ternaries for conditional rendering
    return tasksState.isLoading && isInitialLoad ? (
      <PaperActivityIndicator animating={true} style={styles.loadingIndicator} />
    ) : tasksState.error ? (
      <Text style={styles.errorText}>Error loading tasks: {tasksState.error}</Text>
    ) : !tasksState.items || tasksState.items.length === 0 ? (
      <Text style={styles.emptyText}>No pending tasks.</Text>
    ) : ( // If data exists, map items
      tasksState.items.map(item => (
        <List.Item
            key={`task-${item.id}`}
            title={item.title}
            description={item.due_date ? `Due: ${new Date(item.due_date).toLocaleDateString()}` : 'No due date'}
            left={props => <List.Icon {...props} icon="checkbox-marked-circle-outline" />}
            // TODO: onPress navigate to Task Detail
        />
      ))
    );
  };

   const renderNotificationsSection = () => {
    // Use ternaries for conditional rendering
    return notificationsState.isLoading && isInitialLoad ? (
      <PaperActivityIndicator animating={true} style={styles.loadingIndicator} />
    ) : notificationsState.error ? (
      <Text style={styles.errorText}>Error loading notifications: {notificationsState.error}</Text>
    ) : !notificationsState.items || notificationsState.items.length === 0 ? (
      <Text style={styles.emptyText}>No new notifications.</Text>
    ) : ( // If data exists, map items
      notificationsState.items.map(item => {
        console.log("ITEMS")
        console.log(item)
        let formattedTimestamp = 'Timestamp unavailable'; // Corrected typo
        // Use created_at for the received time
        if (item.created_at) {
        const date = new Date(item.created_at);
        if (!isNaN(date.getTime())) {
          formattedTimestamp = `Received: ${date.toLocaleString()}`;
        }
      }
      // Prioritize message, then description, then timestamp for the description
      const displayDescription = item.message || item.description || formattedTimestamp;

      return (
       <List.Item
            key={`notification-${item.id}`}
            title={item.title ?? item.verb ?? 'Notification'} // Use title, fallback to verb, then generic
            description={<Text>{displayDescription}</Text>} // Display message/description/timestamp
            descriptionNumberOfLines={2} // Allow wrapping
            left={props => <List.Icon {...props} icon={item.unread ? "bell-ring" : "bell-outline"} />}
            style={item.unread ? styles.unreadNotification : null}
            // TODO: onPress navigate or mark as read
        />
    ); // Remove semicolon here
  })
);
};

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Welcome, {user?.firstName || 'User'}!
      </Text>

      <Searchbar
         placeholder="Search Events"
         onChangeText={setSearchQuery}
         value={searchQuery}
         style={styles.searchbar}
       />

       {/* Conditionally render search results OR the main dashboard sections */}
       {/*  Wrap dashboard sections in ScrollView */}
       <ScrollView>
       {searchQuery.trim() ? (
            renderEventsList() // Render FlatList for search results
       ) : (
       <>
            <List.Section>

                    {eventsLoading && events?.length === 0 ? (
                      <>
                      <PaperActivityIndicator animating={true} style={styles.loadingIndicator} />
                      <Text>Loading...</Text>
                      </>
                    ) : eventsError ? (
                      <Text style={styles.errorText}>{`Error loading events: ${eventsError}`}</Text>
                    ) : !events || events.length === 0 ? (
                      <Text style={styles.emptyText}>{'No upcoming events.'}</Text>
                    ) : (
                      events.map(item => renderEventItem({ item })) // Map directly here
                    )}
                </List.Section>

                <Divider style={styles.divider} />

                <List.Section>
                    <List.Subheader style={styles.subheader}>Pending Tasks</List.Subheader>
                    {renderTasksSection()}
                </List.Section>

                <Divider style={styles.divider} />

                <List.Section>
                    <List.Subheader style={styles.subheader}>Recent Notifications</List.Subheader>
                    {renderNotificationsSection()}
                </List.Section>
                </>
         )} 
      </ScrollView>

      {/* FAB might need conditional logic or adjusted positioning */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => console.log('FAB pressed - TODO: Navigate to Add Event/Task')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
   searchbar: {
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 5,
  },
  title: {
    marginTop: 15,
    marginBottom: 15,
    textAlign: 'center',
  },
   subheader: {
    fontSize: 16,
    paddingHorizontal: 10, // Add padding to subheaders
  },
  loadingIndicator: {
      marginTop: 20,
      marginBottom: 20,
  },
  errorText: {
  },
  emptyText: {
      margin: 20,
      textAlign: 'center',
      color: 'grey',
  },
  unreadNotification: {
      backgroundColor: '#eef',
  },
  divider: {
      marginVertical: 15,
      marginHorizontal: 10, // Add horizontal margin
  },
  logoutButtonContainer: {
    padding: 20,
    marginTop: 20, // Ensure space above logout
    marginBottom: 60, // Ensure space below logout, above FAB
    width: '100%',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  searchResultsList: { // Style for the search results FlatList if needed
    flex: 1, // Allow FlatList to take available space
  }
});

export default DashboardScreen;
