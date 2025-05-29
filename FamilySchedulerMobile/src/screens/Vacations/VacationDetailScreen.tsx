import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Share, Alert } from 'react-native'; // Keep Share, Alert
// Clipboard import removed
import { Text, Appbar, Card, Title, Paragraph, ActivityIndicator, List, Modal, Portal, TextInput, Button, Snackbar, Dialog } from 'react-native-paper'; // Removed Icon
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store';
// RootState import removed as it's not directly used here
import {
  fetchVacationDetail,
  selectSelectedVacation,
  selectVacationsLoadingDetail,
  selectVacationsError,
  sendVacationInvite, // Import invite thunk
  selectSendingInvite, // Import invite loading selector
  selectInviteError, // Import invite error selector
  clearInviteError, // Import action to clear error
  VacationInvite, // Import invite type for success payload
} from '../../store/slices/vacationsSlice';
import { VacationsStackParamList } from '../../navigation/VacationsStackNavigator';

type VacationDetailScreenRouteProp = RouteProp<VacationsStackParamList, 'VacationDetail'>;
type VacationDetailScreenNavigationProp = StackNavigationProp<VacationsStackParamList, 'VacationDetail'>;

// No need for separate interface here, use the one from the slice if needed,
// but selectors will provide the typed data.

const VacationDetailScreen = () => {
  // Use useRoute hook to get params
  const route = useRoute<VacationDetailScreenRouteProp>();
  const { vacationId } = route.params;
  const navigation = useNavigation<VacationDetailScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();

  // --- Selectors ---
  const vacation = useSelector(selectSelectedVacation);
  const loading = useSelector(selectVacationsLoadingDetail);
  const error = useSelector(selectVacationsError);
  const sendingInvite = useSelector(selectSendingInvite);
  const inviteError = useSelector(selectInviteError);
  // --- End Selectors ---

  // --- State for Invite Modal ---
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [invitedFamilyName, setInvitedFamilyName] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [inviteSuccessDialogVisible, setInviteSuccessDialogVisible] = useState(false);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState('');
  // --- End State ---

  // Fetch details when the component mounts or vacationId changes
  useEffect(() => {
    if (vacationId) {
      dispatch(fetchVacationDetail(vacationId));
    }
    // Clear invite error on unmount
    return () => {
      dispatch(clearInviteError());
    };
  }, [vacationId, dispatch]);

  // Effect to show snackbar on invite error
  useEffect(() => {
    if (inviteError) {
      setSnackbarMessage(`Error: ${inviteError}`);
      setSnackbarVisible(true);
    }
  }, [inviteError]);

  const handleEdit = () => {
    if (vacation) {
      // Pass the full vacation object if needed by the form, or just the ID
      navigation.navigate('VacationForm', { vacationId: vacation.id });
    }
  };

  const showInviteModal = () => setInviteModalVisible(true);
  const hideInviteModal = () => {
    setInviteModalVisible(false);
    setInvitedFamilyName(''); // Clear input on close
    dispatch(clearInviteError()); // Clear error on close
  };

  const handleSendInvite = async () => {
    if (!invitedFamilyName.trim() || !vacation) return;

    try {
      const resultAction = await dispatch(sendVacationInvite({ vacationId: vacation.id, invitedFamilyName }));
      if (sendVacationInvite.fulfilled.match(resultAction)) {
        const createdInvite = resultAction.payload as VacationInvite;
        setGeneratedInviteUrl(createdInvite.accept_url || ''); // Store the URL
        setInviteSuccessDialogVisible(true); // Show success dialog instead of just snackbar
        hideInviteModal();
      }
      // Error case is handled by the useEffect hook watching inviteError
    } catch (e) {
      // Should be caught by thunk rejection, but just in case
      console.error("Error dispatching sendVacationInvite:", e);
      setSnackbarMessage('An unexpected error occurred.');
      setSnackbarVisible(true);
    }
  };

  const onDismissSnackbar = () => {
    setSnackbarVisible(false);
    dispatch(clearInviteError()); // Clear error when snackbar is dismissed
  };

  const hideSuccessDialog = () => {
    setInviteSuccessDialogVisible(false);
    setGeneratedInviteUrl(''); // Clear URL when dialog is dismissed
  };

  // copyInviteLink function removed

  const shareInviteLink = async () => {
    if (!generatedInviteUrl) return;
    try {
      await Share.share({
        message: `Join our vacation! Use this link: ${generatedInviteUrl}`,
        url: generatedInviteUrl, // Optional, for platforms that use it
        title: `Vacation Invite: ${vacation?.name || ''}` // Optional title
      });
    } catch (error: any) {
      Alert.alert('Share Error', error.message);
    }
  };


  if (loading) {
    return (
      <View style={styles.container}>
        {/* Keep Appbar consistent */}
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Loading Vacation..." />
        </Appbar.Header>
        <ActivityIndicator animating={true} size="large" style={styles.centered} />
      </View>
    );
  }

  if (error) {
     return (
      <View style={styles.container}>
        {/* Keep Appbar consistent */}
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Error" />
        </Appbar.Header>
        <Text style={styles.centered}>Error loading vacation: {error}</Text>
      </View>
    );
  }

  if (!vacation) {
     return (
      <View style={styles.container}>
        {/* Keep Appbar consistent */}
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Vacation Not Found" />
        </Appbar.Header>
        <Text style={styles.centered}>Could not find details for this vacation.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={vacation.name} subtitle={vacation.location} />
          <Appbar.Action icon="account-plus" onPress={showInviteModal} /> {/* Invite Button */}
          <Appbar.Action icon="pencil" onPress={handleEdit} />
          {/* Add Delete button? */}
        </Appbar.Header>
        <ScrollView style={styles.content}>
          {/* Invite Modal */}
          <Portal>
            <Modal visible={inviteModalVisible} onDismiss={hideInviteModal} contentContainerStyle={styles.modalContainer}>
              <Title>Invite Family</Title>
              <TextInput
                label="Family Name"
                value={invitedFamilyName}
                onChangeText={setInvitedFamilyName}
                mode="outlined"
                style={styles.input}
                autoCapitalize="words"
              />
              <View style={styles.modalActions}>
                <Button onPress={hideInviteModal} style={styles.modalButton}>Cancel</Button>
                <Button
                  mode="contained"
                  onPress={handleSendInvite}
                  loading={sendingInvite}
                  disabled={sendingInvite || !invitedFamilyName.trim()}
                  style={styles.modalButton}
                >
                  Send Invite
                </Button>
              </View>
            </Modal>
          </Portal>

          {/* Invite Success Dialog */}
          <Portal>
            <Dialog visible={inviteSuccessDialogVisible} onDismiss={hideSuccessDialog}>
              <Dialog.Icon icon="check-circle-outline" size={48} />
              <Dialog.Title style={styles.dialogTitle}>Invite Sent!</Dialog.Title>
              <Dialog.Content>
                <Paragraph>An invitation has been sent to {invitedFamilyName}.</Paragraph>
                <Paragraph style={styles.urlLabel}>Shareable Link:</Paragraph>
                <Text selectable={true} style={styles.urlText}>{generatedInviteUrl || 'N/A'}</Text>
              </Dialog.Content>
              <Dialog.Actions>
                {/* Copy button removed */}
                <Button onPress={shareInviteLink} icon="share-variant">Share</Button>
                <Button onPress={hideSuccessDialog}>Done</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>

          <Card style={styles.card}>
          <Card.Content>
            <Title>Details</Title>
            <Paragraph>Dates: {new Date(vacation.start_date).toLocaleDateString()} - {new Date(vacation.end_date).toLocaleDateString()}</Paragraph>
            {vacation.region_details && <Paragraph>Region: {vacation.region_details.name}</Paragraph>}
            {vacation.description && <Paragraph>Description: {vacation.description}</Paragraph>}
            {vacation.creator_details && <Paragraph>Created by: {vacation.creator_details.username}</Paragraph>}
          </Card.Content>
        </Card>

        {/* Members Section */}
        {vacation.members && vacation.members.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Members</Title>
              {vacation.members.map(member => (
                <List.Item
                  key={member.id} // Use member link ID as key
                  title={`${member.user_details.first_name} ${member.user_details.last_name} (${member.user_details.username})`}
                  description={`Arrives: ${new Date(member.arrival_date).toLocaleDateString()}, Departs: ${new Date(member.departure_date).toLocaleDateString()}`}
                  left={props => <List.Icon {...props} icon="account" />}
                  // TODO: onPress to view member details?
                />
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Properties Section - Assuming properties are nested in API response */}
        {/* If properties are fetched separately, adjust logic */}
        {/* Example based on potential structure - adjust if needed */}
        {/*
        {vacation.properties && vacation.properties.length > 0 && (
           <Card style={styles.card}>
            <Card.Content>
              <Title>Properties</Title>
               {vacation.properties.map(prop => (
                <List.Item
                  key={prop.id}
                  title={prop.name}
                  description={prop.address}
                  left={props => <List.Icon {...props} icon="home-map-marker" />}
                />
              ))}
            </Card.Content>
          </Card>
        )}
        */}

        {/* Packing Lists Section - Assuming simple list for now */}
        {/* TODO: Fetch actual packing lists if needed */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Packing Lists</Title>
            <List.Item
              title="View Packing List" // Placeholder - Assuming one main list for now
              left={props => <List.Icon {...props} icon="briefcase-check" />}
              onPress={() => navigation.navigate('PackingList', { vacationId: vacation.id })} // Navigate
            />
          </Card.Content>
        </Card>

        {/* Grocery Lists Section - Assuming simple list for now */}
        {/* TODO: Fetch actual grocery lists if needed */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Grocery Lists</Title>
            <List.Item
              title="View Grocery List" // Placeholder - Assuming one main list for now
              left={props => <List.Icon {...props} icon="cart" />}
              onPress={() => navigation.navigate('GroceryList', { vacationId: vacation.id })} // Navigate
            />
          </Card.Content>
        </Card>

        {/* Quest Progress Section */}
        {vacation.quest_progress && vacation.quest_progress.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Planning Progress</Title>
              {vacation.quest_progress.map(quest => (
                <List.Item
                  key={quest.id}
                  title={quest.quest.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} // Format quest name
                  description={quest.completed ? `Completed: ${new Date(quest.completed_at!).toLocaleDateString()}` : 'Pending'}
                  left={props => <List.Icon {...props} icon={quest.completed ? "check-circle" : "checkbox-blank-circle-outline"} />}
                />
              ))}
            </Card.Content>
          </Card>
        )}

      </ScrollView>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={onDismissSnackbar}
        action={{
          label: 'Dismiss',
          onPress: onDismissSnackbar,
        }}>
        {snackbarMessage}
      </Snackbar>
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
  centered: { // Add centered style
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: { // Add card style
      marginBottom: 16,
  },
  modalContainer: { // Styles for the modal
      backgroundColor: 'white',
      padding: 20,
      margin: 20, // Add margin around the modal
      borderRadius: 8, // Optional: for rounded corners
  },
  input: {
      marginBottom: 16,
  },
  modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 10,
  },
  modalButton: {
      marginLeft: 8,
  },
  dialogTitle: { // Center dialog title
      textAlign: 'center',
  },
  urlLabel: {
      marginTop: 10,
      fontWeight: 'bold',
  },
  urlText: {
      marginTop: 4,
      fontStyle: 'italic',
      color: 'grey', // Adjust color as needed
  }
});

export default VacationDetailScreen;
