import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native'; // Import Alert
import { Appbar, TextInput, Button, HelperText, ActivityIndicator, Text, Avatar } from 'react-native-paper'; // Import Avatar
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker'; // Import image picker
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store';
import { FamilyStackParamList } from '../../navigation/FamilyStackNavigator';
import {
  updateChild, // Import update thunk
  fetchFamilyChildren, // Keep fetch thunk for refresh
  selectUpdateChildLoading, // Import update loading selector
  selectUpdateChildError, // Import update error selector
  clearUpdateChildError, // Import clear update error action
  // Child type is implicitly used via route.params.child
} from '../../store/slices/familySlice';

// Define route and navigation props
type EditChildScreenRouteProp = RouteProp<FamilyStackParamList, 'EditChild'>;
type EditChildScreenNavigationProp = StackNavigationProp<FamilyStackParamList, 'EditChild'>;

type Props = {
  route: EditChildScreenRouteProp;
  navigation: EditChildScreenNavigationProp;
};

// Define available genders with labels and backend codes
const GENDER_OPTIONS = [
  { label: 'Male', value: 'M' },
  { label: 'Female', value: 'F' },
  { label: 'Prefer not to say', value: 'P' }, // Assuming 'P' for backend, adjust if needed
];

const EditChildScreen: React.FC<Props> = ({ route, navigation }) => {
  const { familyId, child } = route.params; // Get familyId and child object
  const dispatch = useDispatch<AppDispatch>();

  const loading = useSelector(selectUpdateChildLoading); // Use update loading selector
  const error = useSelector(selectUpdateChildError); // Use update error selector

  // Initialize state with existing child data
  const [firstName, setFirstName] = useState(child.first_name);
  const [lastName, setLastName] = useState(child.last_name);
  // Parse birth_date string into Date object if it exists
  const [birthDate, setBirthDate] = useState<Date | undefined>(
    child.birth_date ? new Date(child.birth_date + 'T00:00:00') : undefined // Add time to avoid timezone issues
  );
  // Find the gender code, default to first option if not found (shouldn't happen ideally)
  const [selectedGender, setSelectedGender] = useState<string>(
    GENDER_OPTIONS.find(g => g.value === child.gender)?.value ?? GENDER_OPTIONS[0].value
  );
  const [profilePictureUri, setProfilePictureUri] = useState<string | null>(child.profile_picture || null); // State for image URI
  const [selectedImage, setSelectedImage] = useState<Asset | null>(null); // State for selected image asset
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    // Clear API error when component unmounts
    return () => {
      dispatch(clearUpdateChildError()); // Clear update error
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

  const handleChoosePhoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', 'Could not select image. Please check permissions.');
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        if (asset.uri) {
          setProfilePictureUri(asset.uri); // Update display URI
          setSelectedImage(asset); // Store the selected asset for upload
        }
      }
    });
  };


  const handleSubmit = async () => {
    setFormError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setFormError('First and last names cannot be empty.');
      return;
    }

    // Construct payload only with changed fields if desired, or send all
    // For simplicity, sending all potentially updatable fields
    const payload = {
        id: child.id, // Include child ID for update
        familyId, // Include familyId for context/refresh
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate: birthDate ? birthDate.toISOString().split('T')[0] : null, // Format as YYYY-MM-DD or null
        gender: selectedGender,
        // profile_picture will be handled via FormData if selectedImage exists
    };

    let dataToSend: any = payload; // Default to JSON payload

    // If a new image was selected, use FormData
    if (selectedImage && selectedImage.uri && selectedImage.fileName && selectedImage.type) {
        const formData = new FormData();
        formData.append('first_name', payload.firstName);
        formData.append('last_name', payload.lastName);
        if (payload.birthDate) {
            formData.append('birth_date', payload.birthDate);
        }
        formData.append('gender', payload.gender);
        formData.append('profile_picture', {
            uri: selectedImage.uri,
            name: selectedImage.fileName,
            type: selectedImage.type,
        });
        dataToSend = { id: child.id, familyId: familyId, formData: formData }; // Pass FormData and IDs separately
        console.log('Submitting updated child data with image via FormData');
    } else {
        console.log('Submitting updated child data (no image change):', payload);
    }


    const resultAction = await dispatch(updateChild(dataToSend)); // Dispatch updateChild with potentially FormData

    if (updateChild.fulfilled.match(resultAction)) {
      // Re-fetch the children list for the current family to update the state
      dispatch(fetchFamilyChildren(familyId));
      navigation.goBack(); // Go back after successful update
    }
    // Error is handled by the selector and displayed via HelperText
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Edit Child" subtitle={`Editing ${child.first_name}`} />
      </Appbar.Header>

      <View style={styles.content}>
        {loading && <ActivityIndicator animating={true} size="large" style={styles.centered} />}

        {!loading && (
          <>
            {/* Profile Picture */}
            <View style={styles.avatarContainer}>
              {profilePictureUri ? (
                <Avatar.Image
                  size={100}
                  source={{ uri: profilePictureUri }}
                  style={styles.avatar}
                />
              ) : (
                <Avatar.Icon size={100} icon="account" style={styles.avatar} /> // Use Avatar.Icon
              )}
              <Button onPress={handleChoosePhoto} mode="outlined" style={styles.changePictureButton}>
                Change Picture
              </Button>
            </View>

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
                date={birthDate || new Date()} // Set initial date for picker
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
            {error && <HelperText type="error" visible={!!error}>Error updating child: {error}</HelperText>}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Update Child
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
   avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    marginBottom: 10,
  },
  changePictureButton: {
    // Style as needed
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

export default EditChildScreen;
