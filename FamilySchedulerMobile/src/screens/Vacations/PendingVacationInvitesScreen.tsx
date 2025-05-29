import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Appbar, Card, Title, Paragraph, Button, ActivityIndicator, Snackbar } from 'react-native-paper'; // Removed List
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
// import { StackNavigationProp } from '@react-navigation/stack'; // Removed unused import
import { AppDispatch } from '../../store';
// import { RootState } from '../../store/rootReducer'; // Removed unused import
import {
  fetchPendingVacationInvites,
  respondToVacationInvite,
  selectPendingVacationInvites,
  selectPendingInvitesLoading,
  selectInviteError,
  clearInviteError,
  VacationInvite,
  selectRespondingToInvite,
} from '../../store/slices/vacationsSlice';
// Import appropriate StackParamList if navigating from here
// import { SettingsStackParamList } from '../../navigation/SettingsStackNavigator'; // Example

// Define navigation prop type if needed
// type PendingInvitesNavigationProp = StackNavigationProp<SettingsStackParamList, 'PendingInvites'>; // Example

const PendingVacationInvitesScreen = () => {
  const navigation = useNavigation(); // Use appropriate type if needed: useNavigation<PendingInvitesNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();

  const pendingInvites = useSelector(selectPendingVacationInvites);
  const loading = useSelector(selectPendingInvitesLoading);
  const respondingLoading = useSelector(selectRespondingToInvite); // Loading state for accept/decline
  const error = useSelector(selectInviteError);

  const [snackbarVisible, setSnackbarVisible] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [refreshing, setRefreshing] = React.useState(false);
  const [respondingInviteId, setRespondingInviteId] = React.useState<number | null>(null); // Track which invite is being responded to

  const loadInvites = React.useCallback(() => {
    dispatch(fetchPendingVacationInvites());
  }, [dispatch]);

  useEffect(() => {
    loadInvites();
    // Clear error on unmount
    return () => {
      dispatch(clearInviteError());
    };
  }, [loadInvites, dispatch]);

  // Show snackbar on error
  useEffect(() => {
    if (error) {
      setSnackbarMessage(`Error: ${error}`);
      setSnackbarVisible(true);
      setRespondingInviteId(null); // Clear loading state on error
    }
  }, [error]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadInvites();
    setRefreshing(false); // Ideally, wait for fetch to finish, but this is simpler for now
  }, [loadInvites]);

  const handleResponse = async (inviteId: number, response: 'accept' | 'decline') => {
    setRespondingInviteId(inviteId); // Set loading state for this specific invite
    dispatch(clearInviteError()); // Clear previous errors
    try {
      const resultAction = await dispatch(respondToVacationInvite({ inviteId, response }));
      if (respondToVacationInvite.fulfilled.match(resultAction)) {
        setSnackbarMessage(`Invite ${response === 'accept' ? 'accepted' : 'declined'}.`);
        setSnackbarVisible(true);
        // List updates automatically via reducer removing the item
        // Optionally navigate on accept:
        // if (response === 'accept') {
        //   const vacationId = typeof resultAction.payload.vacation === 'number' ? resultAction.payload.vacation : resultAction.payload.vacation.id;
        //   navigation.navigate('Vacations', { screen: 'VacationDetail', params: { vacationId } }); // Example navigation
        // }
      }
      // Error case handled by useEffect watching error state
    } catch (e) {
      console.error("Error dispatching respondToVacationInvite:", e);
      setSnackbarMessage('An unexpected error occurred.');
      setSnackbarVisible(true);
    } finally {
       setRespondingInviteId(null); // Clear loading state regardless of outcome
    }
  };

  const onDismissSnackbar = () => {
    setSnackbarVisible(false);
    dispatch(clearInviteError());
  };

  const renderInvite = ({ item }: { item: VacationInvite }) => {
    const isResponding = respondingInviteId === item.id && respondingLoading;
    const vacationName = typeof item.vacation === 'object' ? item.vacation.name : `Vacation ID: ${item.vacation}`;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>{vacationName}</Title>
          <Paragraph>Invited by: {item.inviting_user.username} ({item.inviting_family.name})</Paragraph>
          <Paragraph>Invited on: {new Date(item.created_at).toLocaleDateString()}</Paragraph>
        </Card.Content>
        <Card.Actions>
          <Button
            mode="outlined"
            onPress={() => handleResponse(item.id, 'decline')}
            disabled={isResponding}
            loading={isResponding && respondingInviteId === item.id} // Show loading only on this button
            style={styles.button}
          >
            Decline
          </Button>
          <Button
            mode="contained"
            onPress={() => handleResponse(item.id, 'accept')}
            disabled={isResponding}
            loading={isResponding && respondingInviteId === item.id} // Show loading only on this button
            style={styles.button}
          >
            Accept
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Pending Vacation Invites" />
      </Appbar.Header>

      {loading && !refreshing && (
        <ActivityIndicator animating={true} size="large" style={styles.centered} />
      )}

      {!loading && pendingInvites.length === 0 && (
         <View style={styles.centered}>
            <Text>No pending invitations found.</Text>
         </View>
      )}

      {pendingInvites.length > 0 && (
        <FlatList
          data={pendingInvites}
          renderItem={renderInvite}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  button: {
    marginLeft: 8,
  },
});

export default PendingVacationInvitesScreen;
