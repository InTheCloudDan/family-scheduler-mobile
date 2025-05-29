import React, { useEffect } from 'react'; // Add useEffect
import { View, StyleSheet, FlatList } from 'react-native'; // Add FlatList
import { Text, List, Searchbar, ActivityIndicator as PaperActivityIndicator } from 'react-native-paper'; // Import Paper components
import { useDispatch, useSelector } from 'react-redux'; // Import hooks
import { AppDispatch } from '../../store'; // Import AppDispatch
import { RootState } from '../../store/rootReducer'; // Import RootState correctly
import { fetchEvents } from '../../store/slices/eventsSlice'; // Import fetch action
import type { Event as EventType } from '../../store/slices/eventsSlice'; // Import type

// Import navigation props if needed later
// import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
// import { MainTabParamList } from '../../navigation/MainTabNavigator';

// type EventsScreenProps = BottomTabScreenProps<MainTabParamList, 'Events'>;

// interface Props extends EventsScreenProps {}

interface Props {}

const EventsScreen: React.FC<Props> = (/* { navigation } */) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const dispatch = useDispatch<AppDispatch>();
  const { items: events, isLoading, error } = useSelector((state: RootState) => state.events);

  useEffect(() => {
    // Fetch initial list of events
    // TODO: Implement debounce for search query later
    dispatch(fetchEvents({ searchQuery }));
  }, [dispatch, searchQuery]); // Refetch when search query changes

  const renderItem = ({ item }: { item: EventType }) => (
     <List.Item
          key={item.id}
          title={item.title}
          description={`Starts: ${new Date(item.start_time).toLocaleString()}`}
          left={props => <List.Icon {...props} icon="calendar-blank-outline" />}
          // TODO: onPress navigate to Event Detail
      />
  );

  return (
    <View style={styles.container}>
      <Searchbar
         placeholder="Search Events"
         onChangeText={setSearchQuery} // Update search query state
         value={searchQuery}
         style={styles.searchbar}
         // TODO: Add onIconPress or onSubmitEditing for explicit search trigger if needed
       />
       {isLoading && events.length === 0 ? ( // Show loading only on initial load
          <>
            <PaperActivityIndicator animating={true} style={styles.loadingIndicator} />
            <Text>Loading...</Text>
          </>
       ) : error ? (
            <Text style={styles.errorText}>Error: {error}</Text>
       ) : (
            <FlatList
                data={events}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={<Text style={styles.emptyText}>No events found.</Text>}
                // TODO: Add pagination logic (onEndReached)
                // TODO: Add pull-to-refresh
            />
       )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5,
  },
  searchbar: {
    margin: 10,
  },
  loadingIndicator: {
      marginTop: 50,
  },
  errorText: {
      margin: 20,
      textAlign: 'center',
      color: 'red',
  },
  emptyText: {
      margin: 20,
      textAlign: 'center',
      color: 'grey',
  },
});

export default EventsScreen;
