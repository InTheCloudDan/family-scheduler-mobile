import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, TextInput, Button, HelperText, ActivityIndicator } from 'react-native-paper';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store';
import { FamilyStackParamList } from '../../navigation/FamilyStackNavigator';
import {
  createFamily,
  fetchFamilyDetail, // Import fetchFamilyDetail
  updateFamily, // Import updateFamily
  selectCreateFamilyLoading,
  selectCreateFamilyError,
  clearCreateFamilyError,
  selectFamilyDetailLoading, // Import detail loading selector
  selectCurrentFamilyDetail, // Import detail selector
  selectUpdateFamilyLoading, // Import update loading selector
  selectUpdateFamilyError, // Import update error selector
  clearUpdateFamilyError, // Import clear update error action
  fetchFamilyGroups, // Import fetchFamilyGroups
} from '../../store/slices/familySlice';

// Define route and navigation props
type FamilyFormScreenRouteProp = RouteProp<FamilyStackParamList, 'FamilyForm'>;
type FamilyFormScreenNavigationProp = StackNavigationProp<FamilyStackParamList, 'FamilyForm'>;

type Props = {
  route: FamilyFormScreenRouteProp;
  navigation: FamilyFormScreenNavigationProp;
};

const FamilyFormScreen: React.FC<Props> = ({ route, navigation }) => {
  // Check if editing or creating
  const familyId = route.params?.familyId; // Optional familyId for editing
  const isEditing = Boolean(familyId);

  const dispatch = useDispatch<AppDispatch>();
  const createLoading = useSelector(selectCreateFamilyLoading);
  const createError = useSelector(selectCreateFamilyError);
  // Add selectors for edit mode
  const updateLoading = useSelector(selectUpdateFamilyLoading);
  const updateError = useSelector(selectUpdateFamilyError);
  const detailLoading = useSelector(selectFamilyDetailLoading);
  const currentFamily = useSelector(selectCurrentFamilyDetail);

  const [familyName, setFamilyName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch family details if in edit mode
  useEffect(() => {
    if (isEditing && familyId) {
      dispatch(fetchFamilyDetail(familyId));
    }
  }, [dispatch, familyId, isEditing]);

  // Populate form when family details load in edit mode
  useEffect(() => {
    if (isEditing && currentFamily && currentFamily.id === familyId) {
      setFamilyName(currentFamily.name);
    }
    // Reset if navigating away or switching modes (handled by clearCurrentFamily)
    if (!isEditing) {
        setFamilyName(''); // Ensure name is clear when creating
    }
  }, [isEditing, currentFamily, familyId]);


  useEffect(() => {
    // Clear API errors when component unmounts
    return () => {
      dispatch(clearCreateFamilyError());
      dispatch(clearUpdateFamilyError()); // Clear update error too
    };
  }, [dispatch]);

  const handleSubmit = async () => {
    setFormError(null); // Clear previous form error
    if (!familyName.trim()) {
      setFormError('Family name cannot be empty.');
      return;
    }

    if (isEditing && familyId) {
      // Update logic
      const updateResultAction = await dispatch(updateFamily({ id: familyId, name: familyName }));
      if (updateFamily.fulfilled.match(updateResultAction)) {
        // Re-fetch details and list after update
        dispatch(fetchFamilyDetail(familyId)); // Refresh details for the current family
        dispatch(fetchFamilyGroups()); // Refresh the list for the previous screen
        navigation.goBack();
      }
      // Error is handled by the selector and displayed via HelperText
    } else {
      // Create logic
      const createResultAction = await dispatch(createFamily({ name: familyName }));
      if (createFamily.fulfilled.match(createResultAction)) {
        // Re-fetch list after creation
        dispatch(fetchFamilyGroups());
        navigation.goBack();
      }
      // Error is handled by the selector and displayed via HelperText
    }
  };

  const isLoading = createLoading || updateLoading || (isEditing && detailLoading); // Combine loading states

  const apiError = isEditing ? updateError : createError;

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={isEditing ? 'Edit Family' : 'Create Family'} />
      </Appbar.Header>

      <View style={styles.content}>
        {isLoading && <ActivityIndicator animating={true} size="large" style={styles.centered} />}

        {!isLoading && (
          <>
            <TextInput
              label="Family Name"
              value={familyName}
              onChangeText={setFamilyName}
              mode="outlined"
              style={styles.input}
              error={!!formError || !!createError} // Show error state
            />
            {formError && <HelperText type="error" visible={!!formError}>{formError}</HelperText>}
            {apiError && <HelperText type="error" visible={!!apiError}>Error: {apiError}</HelperText>}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
            >
              {isEditing ? 'Save Changes' : 'Create Family'}
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
  button: {
    marginTop: 16,
  },
   centered: {
    position: 'absolute', // Position over content while loading
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Optional: semi-transparent background
  },
});

export default FamilyFormScreen;
