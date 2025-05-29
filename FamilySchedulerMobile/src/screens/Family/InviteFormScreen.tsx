import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, TextInput, Button, HelperText, ActivityIndicator } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker'; // Use Picker for role selection
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store';
import { FamilyStackParamList } from '../../navigation/FamilyStackNavigator';
import {
  createInvite,
  selectCreateInviteLoading,
  selectCreateInviteError,
  clearCreateInviteError,
} from '../../store/slices/familySlice';

// Define route and navigation props
type InviteFormScreenRouteProp = RouteProp<FamilyStackParamList, 'InviteForm'>;
type InviteFormScreenNavigationProp = StackNavigationProp<FamilyStackParamList, 'InviteForm'>;

type Props = {
  route: InviteFormScreenRouteProp;
  navigation: InviteFormScreenNavigationProp;
};

// Define available roles (match backend choices)
const ROLES = ['PARENT', 'CHILD', 'GUARDIAN', 'RELATIVE', 'OTHER']; // Adjust if needed

const InviteFormScreen: React.FC<Props> = ({ route, navigation }) => {
  const { familyId } = route.params;
  const dispatch = useDispatch<AppDispatch>();

  const loading = useSelector(selectCreateInviteLoading);
  const error = useSelector(selectCreateInviteError);

  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>(ROLES[0]); // Default to first role
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    // Clear API error when component unmounts
    return () => {
      dispatch(clearCreateInviteError());
    };
  }, [dispatch]);

  const validateEmail = (text: string): boolean => {
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!email.trim()) {
      setFormError('Email cannot be empty.');
      return;
    }
    if (!validateEmail(email)) {
        setFormError('Please enter a valid email address.');
        return;
    }
    if (!selectedRole) {
      setFormError('Please select a role.');
      return;
    }

    const resultAction = await dispatch(createInvite({ familyId, email, role: selectedRole }));

    if (createInvite.fulfilled.match(resultAction)) {
      // TODO: Show success message (e.g., Snackbar)
      console.log('Invite sent successfully!');
      navigation.goBack(); // Go back after successful invite
    }
    // Error is handled by the selector and displayed via HelperText
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Invite Member" subtitle={`Family ID: ${familyId}`} />
      </Appbar.Header>

      <View style={styles.content}>
        {loading && <ActivityIndicator animating={true} size="large" style={styles.centered} />}

        {!loading && (
          <>
            <TextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              error={!!formError || !!error}
            />

            <View style={styles.pickerContainer}>
                 <Picker
                    selectedValue={selectedRole}
                    onValueChange={(itemValue) => setSelectedRole(itemValue)}
                    style={styles.picker}
                 >
                    {ROLES.map((role) => (
                        <Picker.Item key={role} label={role} value={role} />
                    ))}
                 </Picker>
            </View>


            {formError && <HelperText type="error" visible={!!formError}>{formError}</HelperText>}
            {error && <HelperText type="error" visible={!!error}>Error sending invite: {error}</HelperText>}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Send Invitation
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
   pickerContainer: {
    borderWidth: 1,
    borderColor: 'grey', // Adjust color as needed
    borderRadius: 4, // Match TextInput style
    marginBottom: 16,
  },
  picker: {
    height: 50, // Adjust height as needed
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

export default InviteFormScreen;
