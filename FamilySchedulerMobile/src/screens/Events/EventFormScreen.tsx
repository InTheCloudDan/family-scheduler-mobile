import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native'; // Added View back
import { TextInput, Button, Text, useTheme, ActivityIndicator, SegmentedButtons } from 'react-native-paper'; // Added SegmentedButtons
import { useDispatch, useSelector } from 'react-redux'; // Added useSelector back
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'; // Added RouteProp back
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Picker } from '@react-native-picker/picker'; // Import Picker
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete'; // Import Google Places
import { AppDispatch } from '../../store';
// import { RootState } from '../../store/rootReducer'; // Removed RootState import
import { createEvent, updateEvent, fetchEventDetail, Event } from '../../store/slices/eventsSlice'; // Import create/update/fetchDetail thunks and Event type
import { fetchFilterOptions, selectAvailableInternalCalendars, selectIsLoadingFilters } from '../../store/slices/calendarSlice'; // Import calendar slice items
import { CalendarStackParamList } from '../../navigation/CalendarStackNavigator'; // Import ParamList

// Define Visibility type based on CalendarFilters (or backend model)
type EventVisibility = 'PUBLIC' | 'PRIVATE' | 'PERSONAL';

// Define ParamList for type safety
type EventFormScreenRouteProp = RouteProp<CalendarStackParamList, 'EventForm'>;

// Placeholder for Google Places API Key - Replace with your actual key
const GOOGLE_PLACES_API_KEY = 'YOUR_GOOGLE_PLACES_API_KEY_HERE'; // IMPORTANT: Replace this!

const EventFormScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const route = useRoute<EventFormScreenRouteProp>(); // Use defined RouteProp type
  const availableCalendars = useSelector(selectAvailableInternalCalendars);
  const isLoadingCalendars = useSelector(selectIsLoadingFilters);

  const eventId = route.params?.eventId; // Check if editing an existing event
  const initialDate = route.params?.date; // Date passed from CalendarScreen

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(initialDate ? new Date(initialDate + 'T09:00:00') : null); // Default time or null
  const [endTime, setEndTime] = useState<Date | null>(initialDate ? new Date(initialDate + 'T10:00:00') : null); // Default duration or null
  const [isStartDatePickerVisible, setStartDatePickerVisibility] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For loading state during fetch/submit
  const [isFetching, setIsFetching] = useState(false); // For fetching existing event data
  const [calendarId, setCalendarId] = useState<number | null>(null); // State for selected calendar ID
  const [visibility, setVisibility] = useState<EventVisibility>('PRIVATE'); // State for visibility, default to PRIVATE
  const [error, setError] = useState<string | null>(null);

  // Fetch calendars and event details (if editing)
  useEffect(() => {
    // Fetch calendar options for the dropdown
    dispatch(fetchFilterOptions());

    if (eventId) {
      setIsFetching(true);
      dispatch(fetchEventDetail(Number(eventId))) // Ensure eventId is number
        .unwrap()
        .then((event: Event & { visibility?: EventVisibility }) => { // Assume visibility might be on fetched event
          setTitle(event.title);
          setDescription(event.description || '');
          setLocation(event.location || '');
          setStartTime(new Date(event.start_time));
          setEndTime(new Date(event.end_time));
          // Ensure calendar ID is a number if it exists, otherwise null
          const fetchedCalendarId = event.calendar?.id;
          setCalendarId(typeof fetchedCalendarId === 'number' ? fetchedCalendarId : null);
          // Set visibility based on fetched event data, default to PRIVATE
          if (event.visibility && ['PUBLIC', 'PRIVATE', 'PERSONAL'].includes(event.visibility)) {
            setVisibility(event.visibility);
          } else {
            setVisibility('PRIVATE'); // Default if not present or invalid
          }
          setError(null);
        })
        .catch((err) => {
            console.error("Failed to load event details:", err);
            setError('Failed to load event details.');
        })
        .finally(() => setIsFetching(false));
    } else {
        // If creating a new event, maybe pre-select the first available calendar
        if (availableCalendars.length > 0 && !calendarId) {
            // setCalendarId(availableCalendars[0].id); // Disabled for now, let user select explicitly
        }
    }
    // Dependency array includes availableCalendars.length to potentially pre-select when calendars load
  }, [dispatch, eventId, availableCalendars.length, calendarId]); // Added calendarId to dependency array

  const showStartDatePicker = () => setStartDatePickerVisibility(true);
  const hideStartDatePicker = () => setStartDatePickerVisibility(false);
  const handleStartConfirm = (date: Date) => {
    setStartTime(date);
    // Optional: Auto-adjust end time if start time becomes later than end time
    if (endTime && date > endTime) {
        const newEndTime = new Date(date);
        newEndTime.setHours(date.getHours() + 1); // Default to 1 hour duration
        setEndTime(newEndTime);
    }
    hideStartDatePicker();
  };

  const showEndDatePicker = () => setEndDatePickerVisibility(true);
  const hideEndDatePicker = () => setEndDatePickerVisibility(false);
  const handleEndConfirm = (date: Date) => {
    // Optional: Prevent end time from being earlier than start time
    if (startTime && date < startTime) {
        setError("End time cannot be earlier than start time.");
        hideEndDatePicker();
        return;
    }
    setEndTime(date);
    setError(null); // Clear error if setting valid time
    hideEndDatePicker();
  };

  const handleSubmit = async () => {
    if (!title || !startTime || !endTime) {
      setError('Title, start time, and end time are required.');
      return;
    }
    if (endTime <= startTime) {
        setError('End time must be after start time.');
        return;
    }
    if (!calendarId) { // Check if a calendar is selected
        setError('Please select a calendar.');
        return;
    }
    // Visibility is always set, no need for explicit check unless adding more complex validation

    setError(null);
    setIsLoading(true);

    const eventData = {
      title,
      description,
      location,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      calendar: calendarId, // Include selected calendar ID
      visibility: visibility, // Include selected visibility
    };

    try {
      if (eventId) {
        // Ensure eventId is a number before passing
        await dispatch(updateEvent({ id: Number(eventId), ...eventData })).unwrap();
      } else {
        await dispatch(createEvent(eventData)).unwrap();
      }
      navigation.goBack(); // Navigate back on success
    } catch (err: any) {
      setError(err.message || 'Failed to save event.');
      console.error("Save event error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <ActivityIndicator animating={true} style={styles.loading} />;
  }

  return (
    <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled" // Important for GooglePlacesAutocomplete
    >
      <Text style={styles.title}>{eventId ? 'Edit Event' : 'Add New Event'}</Text>

      <TextInput
        label="Title"
        value={title}
        onChangeText={setTitle}
        mode="outlined"
        style={styles.input}
        error={!title && !!error} // Show error if title is empty and submit was attempted
      />

      <TextInput
        label="Description (Optional)"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        style={styles.input}
        multiline
        numberOfLines={3}
      />

      {/* Replace TextInput with GooglePlacesAutocomplete */}
      <GooglePlacesAutocomplete
        placeholder='Location (Optional)'
        onPress={(data, details = null) => {
          // 'details' is provided when fetchDetails = true
          console.log(data, details);
          setLocation(data.description); // Set location state to the selected place description
        }}
        query={{
          key: GOOGLE_PLACES_API_KEY,
          language: 'en',
        }}
        fetchDetails={true} // Fetch more details about the place
        styles={{
          textInputContainer: styles.textInputContainer,
          textInput: styles.textInput,
          listView: styles.listView, // Style the results list
        }}
        // Keep results displayed even after selection?
        // keepResultsAfterBlur={true}
        // Predefined places (e.g., Home, Work) - Optional
        // predefinedPlaces={[ ... ]}
        // Debounce requests
        debounce={200}
        // Add current location button - Optional
        // currentLocation={true}
        // currentLocationLabel="Current location"
      />


      {/* Calendar Picker */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={calendarId}
          onValueChange={(itemValue) => setCalendarId(itemValue)}
          enabled={!isLoadingCalendars && availableCalendars.length > 0}
          prompt="Select Calendar"
          style={styles.picker}
        >
          <Picker.Item label="Select a Calendar..." value={null} enabled={false} style={styles.pickerPlaceholder} />
          {availableCalendars.map((cal) => (
            <Picker.Item key={cal.id} label={cal.name} value={cal.id} />
          ))}
        </Picker>
        {isLoadingCalendars && <ActivityIndicator size="small" style={styles.pickerLoading} />}
      </View>
      {!calendarId && !!error && <Text style={[styles.errorText, { color: theme.colors.error, marginTop: -10, marginBottom: 10 }]}>Calendar selection is required.</Text>}

      {/* Visibility Selector */}
      <View style={styles.visibilityContainer}>
          <Text style={styles.label}>Visibility:</Text>
          <SegmentedButtons
            value={visibility}
            onValueChange={(value) => setVisibility(value as EventVisibility)} // Cast value
            buttons={[
              { value: 'PRIVATE', label: 'Private', icon: 'lock-outline' }, // Default
              { value: 'PUBLIC', label: 'Public', icon: 'earth' },
              { value: 'PERSONAL', label: 'Personal', icon: 'account-outline' },
            ]}
            style={styles.segmentedButtons}
          />
      </View>


      {/* Start Time */}
      <Button icon="calendar" mode="outlined" onPress={showStartDatePicker} style={styles.dateButton}>
        {startTime ? `Starts: ${startTime.toLocaleString()}` : 'Select Start Time'}
      </Button>
      <DateTimePickerModal
        isVisible={isStartDatePickerVisible}
        mode="datetime"
        onConfirm={handleStartConfirm}
        onCancel={hideStartDatePicker}
        date={startTime || new Date()} // Default to now or current start time
      />

      {/* End Time */}
      <Button icon="calendar" mode="outlined" onPress={showEndDatePicker} style={styles.dateButton}>
        {endTime ? `Ends: ${endTime.toLocaleString()}` : 'Select End Time'}
      </Button>
      <DateTimePickerModal
        isVisible={isEndDatePickerVisible}
        mode="datetime"
        onConfirm={handleEndConfirm}
        onCancel={hideEndDatePicker}
        date={endTime || startTime || new Date()} // Default to end, start, or now
        minimumDate={startTime || undefined} // Prevent selecting end time before start time
      />

      {error && <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>}

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.button}
        loading={isLoading}
        disabled={isLoading || isFetching}
      >
        {eventId ? 'Update Event' : 'Create Event'}
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  // Styles for GooglePlacesAutocomplete
  textInputContainer: {
    marginBottom: 16,
    // backgroundColor: 'grey', // Example background
  },
  textInput: {
    height: 48, // Adjust height to match Paper TextInput
    color: '#5d5d5d',
    fontSize: 16,
    borderWidth: 1, // Add border to match Paper style
    borderColor: 'grey', // Match Paper style
    borderRadius: 4, // Match Paper style
    paddingHorizontal: 10, // Add padding
  },
  listView: {
    // Style the results list view if needed
    // Example: position absolute to overlay
    // position: 'absolute',
    // top: 100, // Adjust based on layout
    // left: 10,
    // right: 10,
    // backgroundColor: 'white',
    // zIndex: 1000, // Ensure it's on top
  },
  dateButton: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: 'grey', // Adjust color as needed
    borderRadius: 4, // Match TextInput style
    marginBottom: 16,
    justifyContent: 'center', // Center the picker content vertically
    minHeight: 50, // Ensure minimum height
  },
  picker: {
    // height: 50, // Adjust height if needed
    // width: '100%', // Take full width
  },
  pickerPlaceholder: {
    color: 'grey', // Style placeholder text
  },
  pickerLoading: {
    position: 'absolute',
    right: 10,
  },
  visibilityContainer: {
      marginBottom: 16,
  },
  label: {
      fontSize: 16,
      marginBottom: 8,
      color: 'grey', // Adjust as needed
  },
  segmentedButtons: {
      // Add styling if needed
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  }
});

export default EventFormScreen;
