import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Added useCallback
import { View, StyleSheet, FlatList } from 'react-native'; // Add FlatList
import { Calendar, DateData } from 'react-native-calendars';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation
// import { StackNavigationProp } from '@react-navigation/stack'; // Removed unused import
import { AppDispatch } from '../../store';
import { RootState } from '../../store/rootReducer';
import { fetchEventsByMonth } from '../../store/slices/eventsSlice'; // TODO: Update this to fetch with filters
import { ActivityIndicator as PaperActivityIndicator, List, Text, Divider, FAB, Portal } from 'react-native-paper'; // Add FAB, List, Text, Divider, Portal
import type { Event as EventType } from '../../store/slices/eventsSlice';
import CalendarFilterModal from './CalendarFilterModal'; // Import the filter modal
import { CalendarFilters } from '../../store/slices/calendarSlice'; // Import filter types
// Assuming a navigation stack exists that includes an 'EventForm' screen
// import { SomeStackParamList } from '../../navigation/SomeStackNavigator'; // Adjust import as needed

// Define a compatible type for markedDates locally if not exported
interface CustomMarkedDates {
  [key: string]: {
    marked?: boolean;
    dotColor?: string;
    selected?: boolean;
    selectedColor?: string;
    // Add other marking properties if needed
  };
}

interface Props {}

// Define navigation prop type if needed, replace 'any' with actual ParamList
// type CalendarScreenNavigationProp = StackNavigationProp<SomeStackParamList, 'Calendar'>;

const CalendarScreen: React.FC<Props> = () => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [currentMonth, setCurrentMonth] = useState<string>(today.substring(0, 7));
  const [isFilterModalVisible, setFilterModalVisible] = useState(false); // State for filter modal

  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>(); // Use 'any' or specific type
  const { items: monthEvents, isLoading } = useSelector((state: RootState) => state.events);

  // Fetch events when the currentMonth or filters change (TODO: Update fetch logic)
  useEffect(() => {
    // TODO: Pass filters from calendarSlice state to fetchEventsByMonth or a new thunk
    dispatch(fetchEventsByMonth({ monthString: currentMonth }));
  }, [dispatch, currentMonth]); // TODO: Add filters dependency when implemented

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleMonthChange = (month: DateData) => {
     const newMonthString = month.dateString.substring(0, 7);
     setCurrentMonth(newMonthString);
  };

  // Calculate marked dates and filter events for selected day
  const { markedDates, eventsForSelectedDay } = useMemo(() => {
    const marks: CustomMarkedDates = {};
    const filteredEvents: EventType[] = [];

    monthEvents.forEach((event: EventType) => {
      const eventDate = event.start_time.split('T')[0];
      // Add marking for the event date
      marks[eventDate] = {
        ...marks[eventDate],
        marked: true,
        dotColor: 'blue',
      };
      // Check if the event is on the selected date
      if (eventDate === selectedDate) {
        filteredEvents.push(event);
      }
    });

    // Ensure the selected date is also marked
    if (selectedDate) {
        marks[selectedDate] = {
            ...marks[selectedDate],
            selected: true,
            selectedColor: 'tomato',
        };
    }
    // Sort filtered events by start time
    filteredEvents.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    return { markedDates: marks, eventsForSelectedDay: filteredEvents };
  }, [monthEvents, selectedDate]);

  const handleNavigateToAddEvent = () => {
    // Navigate to EventForm, passing the selected date if needed
    // Adjust 'EventForm' and params based on your actual navigation setup
    navigation.navigate('EventForm', { date: selectedDate });
  };

  const openFilterModal = () => setFilterModalVisible(true);
  const closeFilterModal = () => setFilterModalVisible(false);

  const handleApplyFilters = useCallback((filters: CalendarFilters) => {
      console.log("Applying filters:", filters); // Placeholder
      // TODO: Trigger event re-fetch with new filters
      // This might involve dispatching fetchEventsByMonth again,
      // ensuring the thunk reads the latest filters from the calendarSlice state.
      // Or, create a new thunk specifically for filtered fetching.
      dispatch(fetchEventsByMonth({ monthString: currentMonth })); // Re-fetch for now
      closeFilterModal();
  }, [dispatch, currentMonth]); // Add dependencies as needed

  return (
    <Portal.Host> {/* Portal.Host needed for Modal */}
      <View style={styles.container}>
        <Calendar
          current={selectedDate}
        onDayPress={handleDayPress}
        monthFormat={'yyyy MMMM'}
        onMonthChange={handleMonthChange}
        hideExtraDays={true}
        firstDay={1}
        enableSwipeMonths={true}
        markedDates={markedDates}
        style={styles.calendar}
        theme={{ /* Theme options */ }}
      />
      {/* Optional: Show global loading indicator while fetching month events */}
      {isLoading && <PaperActivityIndicator animating={true} style={styles.loadingOverlay} />}

      {/* Agenda/List view for selected day's events */}
      <View style={styles.agendaContainer}>
        <Text style={styles.agendaTitle}>Events for {selectedDate}</Text>
        <Divider style={styles.divider} />
        {isLoading ? (
          // Show loading indicator only if it's for the initial load,
          // otherwise rely on the overlay or lack of data
          <View /> // Or a smaller indicator if preferred
        ) : (
          <FlatList
            data={eventsForSelectedDay}
            keyExtractor={(item) => `agenda-${item.id}`}
            renderItem={({ item }) => (
              <List.Item
                title={item.title}
                description={`${new Date(item.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${new Date(item.end_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
                left={props => <List.Icon {...props} icon="circle-small" />}
                // TODO: onPress navigate to Event Detail
              />
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No events for this day.</Text>}
          />
        )}
      </View>
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleNavigateToAddEvent}
        label="Add Event"
      />
      <FAB
        style={[styles.fab, { bottom: 80 }]} // Adjust position to avoid overlap
        icon="filter-variant"
        onPress={openFilterModal}
        label="Filter"
      />
      <CalendarFilterModal
        visible={isFilterModalVisible}
        onDismiss={closeFilterModal}
        onApplyFilters={handleApplyFilters}
      />
    </View>
   </Portal.Host>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendar: {
      // Styling for the calendar component
  },
  loadingOverlay: {
      position: 'absolute',
      top: 50,
      left: 0,
      right: 0,
      zIndex: 10,
  },
  agendaContainer: {
      flex: 1,
      paddingHorizontal: 10,
      paddingTop: 10,
  },
  agendaTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 5,
  },
  divider: {
      marginBottom: 5,
  },
  emptyText: {
      marginTop: 20,
      textAlign: 'center',
      color: 'grey',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default CalendarScreen;
