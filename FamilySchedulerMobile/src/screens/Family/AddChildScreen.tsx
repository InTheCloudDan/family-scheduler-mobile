import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native'; // Removed Platform import
import { Appbar, TextInput, Button, HelperText, ActivityIndicator, Text } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store';
import { FamilyStackParamList } from '../../navigation/FamilyStackNavigator';
import {
  addChild,
  fetchFamilyChildren, // Import the thunk
  selectAddChildLoading,
  selectAddChildError,
  clearAddChildError,
} from '../../store/slices/familySlice';

// Define route and navigation props
type AddChildScreenRouteProp = RouteProp<FamilyStackParamList, 'AddChild'>;
type AddChildScreenNavigationProp = StackNavigationProp<FamilyStackParamList, 'AddChild'>;

type Props = {
  route: AddChildScreenRouteProp;
  navigation: AddChildScreenNavigationProp;
};

// Define available genders with labels and backend codes
const GENDER_OPTIONS = [
  { label: 'Male', value: 'M' },
  { label: 'Female', value: 'F' },
  { label: 'Prefer not to say', value: 'P' }, // Assuming 'P' for backend, adjust if needed
];

const AddChildScreen: React.FC<Props> = ({ route, navigation }) => {
  const { familyId } = route.params;
  const dispatch = useDispatch<AppDispatch>();

  const loading = useSelector(selectAddChildLoading);
  const error = useSelector(selectAddChildError);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  // Initialize with the backend code of the first option
  const [selectedGender, setSelectedGender] = useState<string>(GENDER_OPTIONS[0].value);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    // Clear API error when component unmounts
    return () => {
      dispatch(clearAddChildError());
    };
  }, [dispatch]);

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirmDate = (date: Date) => {
    setBirthDate(date);
    hideDatePicker();
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setFormError('First and last names cannot be empty.');
      return;
    }

    const payload = {
        familyId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate: birthDate ? birthDate.toISOString().split('T')[0] : undefined, // Format as YYYY-MM-DD
        gender: selectedGender, // Already holds the backend code ('M', 'F', 'P')
    };

    console.log('Submitting child data:', payload); // Add logging

    const resultAction = await dispatch(addChild(payload));

    if (addChild.fulfilled.match(resultAction)) {
      // Re-fetch the children list for the current family to update the state
      dispatch(fetchFamilyChildren(familyId));
      navigation.goBack(); // Go back after successful creation and dispatching fetch
    }
    // Error is handled by the selector and displayed via HelperText
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Add Child" subtitle={`Family ID: ${familyId}`} />
      </Appbar.Header>

      <View style={styles.content}>
        {loading && <ActivityIndicator animating={true} size="large" style={styles.centered} />}

        {!loading && (
          <>
            <TextInput
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              mode="outlined"
              style={styles.input}
              error={!!formError}
            />
            <TextInput
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              mode="outlined"
              style={styles.input}
              error={!!formError}
            />

            <Button onPress={showDatePicker} mode="outlined" style={styles.input}>
              {birthDate ? `Birth Date: ${birthDate.toLocaleDateString()}` : 'Select Birth Date'}
            </Button>
            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirmDate}
                onCancel={hideDatePicker}
                maximumDate={new Date()} // Cannot be born in the future
            />

            <Text style={styles.label}>Gender</Text>
            <View style={styles.pickerContainer}>
                 <Picker
                    selectedValue={selectedGender}
                    onValueChange={(itemValue) => setSelectedGender(itemValue)}
                     style={styles.picker}
                  >
                     {GENDER_OPTIONS.map((option) => (
                         <Picker.Item key={option.value} label={option.label} value={option.value} />
                     ))}
                  </Picker>
            </View>

            {formError && <HelperText type="error" visible={!!formError}>{formError}</HelperText>}
            {error && <HelperText type="error" visible={!!error}>Error adding child: {error}</HelperText>}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Add Child
            </Button>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  label: {
      fontSize: 12, // Adjust as needed
      color: 'grey', // Adjust as needed
      marginBottom: 4,
      marginLeft: 8, // Align with TextInput label
  },
   pickerContainer: {
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 4,
    marginBottom: 16,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  button: {
    marginTop: 16,
  },
   centered: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
});

export default AddChildScreen;
