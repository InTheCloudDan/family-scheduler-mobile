import React, { useState, useEffect, useCallback } from 'react';
// Import FlatList and remove ScrollView
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Appbar, TextInput, Button, HelperText, ActivityIndicator } from 'react-native-paper'; // Import ActivityIndicator
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Picker } from '@react-native-picker/picker';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store'; // Keep AppDispatch import
// import { RootState } from '../../store/rootReducer'; // Removed unused RootState import
// Import specific list selectors for loading and error
import { fetchFamilyGroups, selectAllFamilyGroups, selectFamilyListLoading, selectFamilyListError } from '../../store/slices/familySlice'; // Keep these specific selectors
import { VacationsStackParamList } from '../../navigation/VacationsStackNavigator';
import {
  createVacation,
  updateVacation,
  fetchVacationDetail,
  fetchVacations, // To refresh list after save
  selectSelectedVacation,
  selectVacationsLoadingDetail,
  selectVacationsLoadingCreate,
  selectVacationsLoadingUpdate,
  selectCreateVacationError,
  selectUpdateVacationError,
  clearSelectedVacation,
  clearCreateVacationError,
  clearUpdateVacationError,
} from '../../store/slices/vacationsSlice'; // Import vacation actions/selectors

// IMPORTANT: Replace with your actual API key - DO NOT COMMIT THIS KEY
const GOOGLE_PLACES_API_KEY = 'AIzaSyB7k_Ls7YkC9GW72CN4ZZNLUq43tAZPEH8';

type VacationFormScreenRouteProp = RouteProp<VacationsStackParamList, 'VacationForm'>;
type VacationFormScreenNavigationProp = StackNavigationProp<VacationsStackParamList, 'VacationForm'>;

type Props = {
  route: VacationFormScreenRouteProp;
  navigation: VacationFormScreenNavigationProp;
};

const VacationFormScreen = ({ route, navigation }: Props) => {
  const { vacationId } = route.params ?? {};
  const isEditing = !!vacationId;

  // Form state
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [locationKey, setLocationKey] = useState('loc-0');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [region, setRegion] = useState(''); // Keep as string for now, API might accept name or ID
  const [selectedFamilyGroupId, setSelectedFamilyGroupId] = useState<number | undefined>(undefined); // Use number | undefined
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isStartDatePickerVisible, setStartDatePickerVisibility] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false);
  // const [loadingFormData, setLoadingFormData] = useState(false); // Replaced by Redux loading states
  const [predefinedPlacesState] = useState([]);

  // Redux state for family groups
  const dispatch = useDispatch<AppDispatch>();
  const familyGroups = useSelector(selectAllFamilyGroups);
  const familyListLoading = useSelector(selectFamilyListLoading);
  const familyListError = useSelector(selectFamilyListError);

  // Redux state for vacation form
  const selectedVacation = useSelector(selectSelectedVacation);
  const loadingDetail = useSelector(selectVacationsLoadingDetail);
  const loadingCreate = useSelector(selectVacationsLoadingCreate);
  const loadingUpdate = useSelector(selectVacationsLoadingUpdate);
  const errorCreate = useSelector(selectCreateVacationError);
  const errorUpdate = useSelector(selectUpdateVacationError);

  const isLoading = loadingDetail || loadingCreate || loadingUpdate; // Combined loading state

  // Fetch family groups and vacation details (if editing)
  useEffect(() => {
    dispatch(fetchFamilyGroups());
    if (isEditing && vacationId) {
      dispatch(fetchVacationDetail(vacationId));
    }
    // Clear selected vacation and errors on unmount
    return () => {
      dispatch(clearSelectedVacation());
      dispatch(clearCreateVacationError());
      dispatch(clearUpdateVacationError());
    };
  }, [isEditing, vacationId, dispatch]);

  // Populate form when selectedVacation data arrives (for editing)
  useEffect(() => {
    if (isEditing && selectedVacation && selectedVacation.id === vacationId) {
      setName(selectedVacation.name);
      setLocation(selectedVacation.location);
      setLocationKey(`loc-${selectedVacation.id}`); // Update key to force re-render if needed
      setDescription(selectedVacation.description || '');
      setStartDate(selectedVacation.start_date ? new Date(selectedVacation.start_date + 'T00:00:00') : undefined);
      setEndDate(selectedVacation.end_date ? new Date(selectedVacation.end_date + 'T00:00:00') : undefined);
      setRegion(selectedVacation.region_details?.name || String(selectedVacation.region || '')); // Use region name or ID string
      // Assuming API returns family_groups array on detail, take the first one for now
      // TODO: Handle multiple family groups if the form supports it later
      // setSelectedFamilyGroupId(selectedVacation.family_groups?.[0]?.id);
      // For now, assume family_groups is not part of detail or needs separate fetch
      // If editing, we might need to know which family group was initially selected.
      // This example assumes we don't pre-select the family group when editing.
      setSelectedFamilyGroupId(undefined); // Or fetch/set based on actual detail data
    }
  }, [isEditing, selectedVacation, vacationId]);


  // handleSave logic - wrapped in useCallback
  const handleSave = useCallback(async () => { // Make async
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!location.trim()) newErrors.location = 'Location is required';
    if (!startDate) newErrors.startDate = 'Start date is required';
    if (!endDate) newErrors.endDate = 'End date is required';
    if (startDate && endDate && endDate < startDate) {
        newErrors.endDate = 'End date cannot be before start date';
    }
    if (!selectedFamilyGroupId) newErrors.familyGroup = 'Family group is required';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const payload = {
        name: name.trim(),
        location: location.trim(),
        description: description.trim(),
        start_date: startDate!.toISOString().split('T')[0], // Assert non-null as checked above
        end_date: endDate!.toISOString().split('T')[0], // Assert non-null as checked above
        region: region.trim() || undefined, // Send region if provided
        family_groups: [Number(selectedFamilyGroupId)], // API expects array of IDs
      };

      let resultAction;
      if (isEditing && vacationId) {
        resultAction = await dispatch(updateVacation({ id: vacationId, ...payload }));
      } else {
        resultAction = await dispatch(createVacation(payload));
      }

      if (createVacation.fulfilled.match(resultAction) || updateVacation.fulfilled.match(resultAction)) {
        dispatch(fetchVacations()); // Refresh the list
        navigation.goBack();
      }
      // Errors are handled by selectors below
    }
  }, [name, location, startDate, endDate, selectedFamilyGroupId, region, description, navigation, dispatch, isEditing, vacationId]);

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={isEditing ? 'Edit Vacation' : 'Add Vacation'} />
        <Appbar.Action icon="content-save" onPress={handleSave} />
      </Appbar.Header>
      {/* Use FlatList instead of ScrollView */}
      <FlatList
        style={styles.list}
        data={[null]} // Dummy data for FlatList
        renderItem={() => null} // No items to render directly
        keyExtractor={(item, index) => index.toString()}
        keyboardShouldPersistTaps="handled"
        // Render form directly in ListHeaderComponent
        ListHeaderComponent={
          <View style={styles.content}>
            {/* Display Loading Indicator */}
            {isLoading && <ActivityIndicator animating={true} size="large" style={styles.loadingOverlay} />}

            {/* Display Create/Update Errors */}
            {(errorCreate || errorUpdate) && (
              <HelperText type="error" visible={true} style={styles.apiErrorText}>
                {errorCreate || errorUpdate}
              </HelperText>
            )}

            <TextInput
              label="Vacation Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              error={!!errors.name}
            />
            {errors.name && <HelperText type="error">{errors.name}</HelperText>}

            {/* Google Places Autocomplete */}
            {/* Only render when not initially loading detail */}
            {!loadingDetail && (
              <GooglePlacesAutocomplete
                  key={locationKey} // Use key to potentially force re-render on edit
                  placeholder='Search for Location'
                  onPress={(data, _details = null) => {
                    console.log('Place selected:', data.description);
                    setLocation(data.description);
                    setErrors(prev => ({ ...prev, location: '' }));
                  }}
                  query={{
                      key: GOOGLE_PLACES_API_KEY,
                      language: 'en',
                  }}
                  fetchDetails={true}
                  predefinedPlaces={predefinedPlacesState}
                  styles={{
                      textInputContainer: styles.textInputContainer,
                      textInput: styles.textInput,
                      listView: styles.listView,
                      row: {},
                      separator: {},
                      description: {},
                      loader: {},
                      predefinedPlacesDescription: {},
                  }}
                  textInputProps={{
                      InputComp: TextInput,
                      mode: 'outlined',
                      label: 'Location',
                      error: !!errors.location,
                      onChangeText: (text) => {
                          setLocation(text);
                          if (errors.location && text.trim()) {
                               setErrors(prev => ({ ...prev, location: '' }));
                          }
                      },
                      value: location,
                      onFocus: () => {},
                      onBlur: () => {},
                  }}
                  keyboardShouldPersistTaps="handled"
                  // Add initial value for editing if needed, requires careful handling of state/key
                  // initialValue={isEditing ? location : undefined}
              />
            )}
             {errors.location && <HelperText type="error" style={styles.errorText}>{errors.location}</HelperText>}


            {/* Start Date Picker */}
            <TouchableOpacity onPress={() => setStartDatePickerVisibility(true)} style={styles.dateTouchable}>
                <TextInput
                    label="Start Date"
                    value={startDate ? startDate.toLocaleDateString() : ''}
                    mode="outlined"
                    style={styles.input}
                    editable={false}
                    error={!!errors.startDate}
                    right={<TextInput.Icon icon="calendar" onPress={() => setStartDatePickerVisibility(true)} />}
                />
            </TouchableOpacity>
            {errors.startDate && <HelperText type="error" style={styles.errorText}>{errors.startDate}</HelperText>}
            <DateTimePickerModal
                isVisible={isStartDatePickerVisible}
                mode="date"
                onConfirm={(date) => {
                    setStartDate(date);
                    setStartDatePickerVisibility(false);
                    if (endDate && date && endDate >= date) {
                        setErrors(prev => ({ ...prev, endDate: '' }));
                    }
                }}
                onCancel={() => setStartDatePickerVisibility(false)}
                date={startDate || new Date()}
            />

            {/* End Date Picker */}
             <TouchableOpacity onPress={() => setEndDatePickerVisibility(true)} style={styles.dateTouchable}>
                <TextInput
                    label="End Date"
                    value={endDate ? endDate.toLocaleDateString() : ''}
                    mode="outlined"
                    style={styles.input}
                    editable={false}
                    error={!!errors.endDate}
                    right={<TextInput.Icon icon="calendar" onPress={() => setEndDatePickerVisibility(true)} />}
                />
            </TouchableOpacity>
            {errors.endDate && <HelperText type="error" style={styles.errorText}>{errors.endDate}</HelperText>}
             <DateTimePickerModal
                isVisible={isEndDatePickerVisible}
                mode="date"
                onConfirm={(date) => {
                    setEndDate(date);
                    setEndDatePickerVisibility(false);
                    if (startDate && date && date >= startDate) {
                        setErrors(prev => ({ ...prev, endDate: '' }));
                    }
                }}
                onCancel={() => setEndDatePickerVisibility(false)}
                date={endDate || startDate || new Date()}
                minimumDate={startDate}
            />

            <TextInput
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={4}
            />

            {/* Region Text Input (API limitation) */}
            <TextInput
              label="Region (Enter Name or ID)"
              value={region}
              onChangeText={setRegion}
              mode="outlined"
              style={styles.input}
            />

            {/* Family Group Picker */}
            {/* Use specific list loading state */}
            <HelperText type="info" visible={familyListLoading}>Loading family groups...</HelperText>
            {/* Display the specific list error */}
            <HelperText type="error" visible={!!familyListError}>
                Error loading groups: {familyListError}
            </HelperText>
            <View style={[styles.pickerContainer, errors.familyGroup ? styles.pickerError : {}]}>
                 {/* Use specific list loading state */}
                {familyListLoading ? (
                     <HelperText type="info">Loading...</HelperText>
                ) : familyListError ? ( // Check specific list error
                     <HelperText type="error">Could not load groups</HelperText>
                ) : (
                     <Picker
                        selectedValue={selectedFamilyGroupId}
                        onValueChange={(itemValue) => {
                            setSelectedFamilyGroupId(itemValue ?? undefined);
                             if (itemValue) {
                                 setErrors(prev => ({ ...prev, familyGroup: '' }));
                             }
                        }}
                        mode="dropdown"
                        style={styles.picker}
                         /* Use specific list loading state */
                        enabled={!familyListLoading && familyGroups.length > 0}
                    >
                        <Picker.Item label="Select Family Group..." value={undefined} style={styles.pickerPlaceholder} />
                        {familyGroups.map((group) => (
                            <Picker.Item key={group.id} label={group.name} value={group.id} />
                        ))}
                    </Picker>
                )}
            </View>
            {errors.familyGroup && <HelperText type="error" style={styles.errorText}>{errors.familyGroup}</HelperText>}


            {/* TODO: Add fields for Members, Properties, Lists */}

            <Button
                mode="contained"
                onPress={handleSave}
                style={styles.button}
                disabled={isLoading || familyListLoading} // Disable if any loading is true
                loading={loadingCreate || loadingUpdate} // Show loading specific to save action
            >
              {isEditing ? 'Update Vacation' : 'Create Vacation'}
            </Button>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    // Style to overlay the form while loading detail
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 10, // Ensure it's above other elements
  },
  list: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  input: {
     marginBottom: 12,
  },
  textInputContainer: {
    marginBottom: 12,
  },
   textInput: {
    height: 55,
  },
  listView: {
      borderWidth: 1,
      borderColor: '#ddd',
      backgroundColor: 'white',
      marginTop: 2,
      marginBottom: 12,
      // position: 'absolute', top: 60, left: 0, right: 0, zIndex: 1000, // Consider if overlap occurs
  },
  dateTouchable: {
      marginBottom: 12,
  },
  errorText: {
      marginTop: -8,
      marginBottom: 8,
  },
  apiErrorText: {
    marginBottom: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 4,
    marginBottom: 12,
    minHeight: 55,
    justifyContent: 'center',
  },
  pickerError: {
      borderColor: 'red',
  },
  picker: {
      // height: 55,
  },
  pickerPlaceholder: {
      color: 'grey',
  },
  button: {
    marginTop: 16,
  },
});

export default VacationFormScreen;
