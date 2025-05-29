import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux'; // useSelector added back
import { useNavigation } from '@react-navigation/native';
import { AppDispatch } from '../../store';
// import { RootState } from '../../store/rootReducer'; // RootState removed as useSelector infers state type
// Import the necessary thunk and selector
import { addIcsCalendar, selectIsLoadingAddIcs, selectAddIcsError } from '../../store/slices/calendarSlice';

interface Props {}

const AddIcsCalendarScreen: React.FC<Props> = () => {
    const [calendarName, setCalendarName] = useState('');
    const [icsUrl, setIcsUrl] = useState('');
    const dispatch = useDispatch<AppDispatch>();
    const navigation = useNavigation();

    // Selectors for loading and error state
    const isLoading = useSelector(selectIsLoadingAddIcs);
    const error = useSelector(selectAddIcsError);

    const handleAddCalendar = async () => {
        if (!calendarName.trim() || !icsUrl.trim()) {
            Alert.alert('Error', 'Please enter both a calendar name and a valid URL.');
            return;
        }

        // Basic URL validation (can be improved)
        if (!icsUrl.startsWith('http://') && !icsUrl.startsWith('https://')) {
             Alert.alert('Error', 'Please enter a valid URL starting with http:// or https://');
             return;
        }
         if (!icsUrl.toLowerCase().endsWith('.ics')) {
             Alert.alert('Warning', 'URL does not end with .ics. Please ensure it points to a valid iCalendar file.');
             // Allow submission but warn the user
         }


        console.log('Dispatching addIcsCalendar with:', { account_name: calendarName, ical_url: icsUrl });

        // Dispatch the actual thunk
        const resultAction = await dispatch(addIcsCalendar({ account_name: calendarName, ical_url: icsUrl }));

        if (addIcsCalendar.fulfilled.match(resultAction)) {
            Alert.alert('Success', 'Calendar added successfully!');
            // TODO: Optionally dispatch fetchFilterOptions again? Or rely on user refresh?
            // dispatch(fetchFilterOptions()); // Example: Re-fetch options
            navigation.goBack();
        } else {
            // Error is handled by the selector, show alert with specific error
            const errorMessage = typeof resultAction.payload === 'string'
                ? resultAction.payload
                : 'Failed to add calendar. Please check the URL and try again.';
            Alert.alert('Error Adding Calendar', errorMessage);
        }
    };

    return (
        <View style={styles.container}>
            <Text variant="headlineSmall" style={styles.title}>Add Calendar via URL (.ics)</Text>

            <TextInput
                label="Calendar Name"
                value={calendarName}
                onChangeText={setCalendarName}
                mode="outlined"
                style={styles.input}
                disabled={isLoading}
            />

            <TextInput
                label="Calendar URL (.ics)"
                value={icsUrl}
                onChangeText={setIcsUrl}
                mode="outlined"
                style={styles.input}
                keyboardType="url"
                autoCapitalize="none"
                disabled={isLoading}
            />

            {isLoading && <ActivityIndicator animating={true} style={styles.loading} />}

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button
                mode="contained"
                onPress={handleAddCalendar}
                style={styles.button}
                disabled={isLoading}
            >
                {isLoading ? 'Adding...' : 'Add Calendar'}
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        marginBottom: 15,
    },
    button: {
        marginTop: 10,
    },
    loading: {
        marginTop: 20,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
});

export default AddIcsCalendarScreen;
