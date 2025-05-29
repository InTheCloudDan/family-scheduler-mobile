import React, { useState, useEffect } from 'react'; // Import useState
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Appbar, List, Divider, Text, ActivityIndicator, Button, Modal, Portal, RadioButton } from 'react-native-paper'; // Add Modal, Portal, RadioButton
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { RootState } from '../../store/rootReducer'; // Import RootState
import { FamilyStackParamList } from '../../navigation/FamilyStackNavigator';
import { FamilyMembership } from '../../store/slices/familySlice'; // Import type if needed
import {
  selectCurrentFamilyMembers,
  selectFamilyMembersLoading, // Use loading state from detail fetch for now
  selectFamilyMembersError, // Use error state from detail fetch for now
  removeMembership, // Import remove thunk
  updateMembership, // Import update thunk
  selectDeleteMembershipLoading, // Import loading selector
  selectUpdateMembershipLoading, // Import update loading selector
  clearDeleteMembershipError, // Import clear error action
  clearUpdateMembershipError, // Import clear update error action
  fetchFamilyMembers, // Import fetchFamilyMembers
} from '../../store/slices/familySlice';
// Import the user selector from authSlice if available, or define it here
// Assuming authSlice exports selectUser or similar, otherwise use inline selector
// import { selectUser } from '../../store/slices/authSlice';

type MemberManagementScreenRouteProp = RouteProp<FamilyStackParamList, 'MemberManagement'>;
type MemberManagementScreenNavigationProp = StackNavigationProp<FamilyStackParamList, 'MemberManagement'>;

type Props = {
  route: MemberManagementScreenRouteProp;
  navigation: MemberManagementScreenNavigationProp;
};

const MemberManagementScreen: React.FC<Props> = ({ route, navigation }) => {
  const { familyId } = route.params; // Get familyId passed from navigation
  const dispatch = useDispatch<AppDispatch>(); // Use dispatch

  const members = useSelector(selectCurrentFamilyMembers);
  const loading = useSelector(selectFamilyMembersLoading); // Loading for the list itself
  const error = useSelector(selectFamilyMembersError);
  const deleteLoading = useSelector(selectDeleteMembershipLoading);
  const updateLoading = useSelector(selectUpdateMembershipLoading); // Get update loading state
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id); // Get current user ID

  // State for Role Change Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMembership | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');

  // Define available roles (match the type in FamilyMembership interface)
  const ROLES: Array<FamilyMembership['role']> = ['PARENT', 'CHILD', 'GUARDIAN', 'RELATIVE', 'OTHER'];

  useEffect(() => {
    // Clear errors when component unmounts
    return () => {
      dispatch(clearDeleteMembershipError());
      dispatch(clearUpdateMembershipError());
    };
  }, [dispatch]);

  const showModal = (member: FamilyMembership) => {
    setSelectedMember(member);
    setSelectedRole(member.role); // Pre-select current role
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
    setSelectedMember(null);
    setSelectedRole('');
  };

  const handleRoleChange = async () => {
    if (!selectedMember || !selectedRole || selectedRole === selectedMember.role) {
      hideModal();
      return; // No change or invalid state
    }

    const resultAction = await dispatch(updateMembership({
      membershipId: selectedMember.id,
      role: selectedRole,
    }));

    if (updateMembership.fulfilled.match(resultAction)) {
      // Optionally show success message
      console.log('Role updated successfully');
      // Re-fetch members to reflect change (or rely on reducer update)
      // dispatch(fetchFamilyMembers(familyId)); // Already handled by reducer
    } else if (updateMembership.rejected.match(resultAction)) {
      Alert.alert('Error', `Failed to update role: ${resultAction.payload}`);
    }
    hideModal(); // Close modal regardless of success/failure
  };


  const handleRemoveMember = (membershipId: number, memberUserId: number, memberName: string) => {
    if (currentUserId === memberUserId) {
      Alert.alert('Cannot Remove Self', 'You cannot remove yourself from the family.');
      return;
    }

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from this family?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            // Check is now done before showing the alert
            const resultAction = await dispatch(removeMembership(membershipId));
            if (removeMembership.fulfilled.match(resultAction)) {
                // Re-fetch members list on success
                 dispatch(fetchFamilyMembers(familyId));
                 console.log("Member removed successfully, refreshing list...");
             } else if (removeMembership.rejected.match(resultAction)) {
                 // Error is handled by the selector below (or show alert)
                 console.error("Failed to remove member:", resultAction.payload);
                 Alert.alert("Error", `Failed to remove member: ${resultAction.payload}`);
             }
          },
        },
      ]
    );
  };

  const renderMemberItem = ({ item }: { item: FamilyMembership }) => (
    <List.Item
      title={`${item.user.first_name} ${item.user.last_name} (${item.user.username})`}
      description={`Role: ${item.role} ${item.is_admin ? '(Admin)' : ''}`}
      left={props => <List.Icon {...props} icon="account-cog" />} // Icon indicating management
      right={_props => ( // Prefix unused props
        <View style={styles.actions}>
          {/* Role Change Button */}
          <Button
            onPress={() => showModal(item)}
            disabled={deleteLoading || updateLoading || currentUserId === item.user.id} // Disable if deleting, updating, or self
            loading={updateLoading && selectedMember?.id === item.id} // Show loading on specific button
          >
            Role
          </Button>
          {/* Disable remove button if it's the current user */}
          <Button
             onPress={() => handleRemoveMember(item.id, item.user.id, item.user.username)}
             color="red" // Style appropriately
             disabled={deleteLoading || updateLoading || currentUserId === item.user.id} // Disable if deleting, updating, or self
             loading={deleteLoading} // Show loading indicator on button?
          >
             Remove
          </Button>
        </View>
      )}
    />
  );

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator animating={true} size="large" style={styles.centered} />;
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Error loading members: {error}</Text>
          {/* Optionally add a retry button if fetching is done here */}
        </View>
      );
    }

     if (!members || members.length === 0) {
      return (
        <View style={styles.centered}>
          <Text>No members found for this family.</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={members}
        renderItem={renderMemberItem}
        keyExtractor={(item) => item.id.toString()}
        ItemSeparatorComponent={() => <Divider />}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Manage Members" subtitle={`Family ID: ${familyId}`} />
      </Appbar.Header>

      {renderContent()}

      {/* Role Change Modal */}
      <Portal>
        <Modal visible={modalVisible} onDismiss={hideModal} contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalTitle}>Change Role for {selectedMember?.user.username}</Text>
          <RadioButton.Group onValueChange={newValue => setSelectedRole(newValue)} value={selectedRole}>
            {ROLES.map(role => (
              <View key={role} style={styles.radioButtonContainer}>
                <RadioButton value={role} />
                <Text>{role}</Text>
              </View>
            ))}
          </RadioButton.Group>
          <View style={styles.modalActions}>
            <Button onPress={hideModal} disabled={updateLoading}>Cancel</Button>
            <Button
              onPress={handleRoleChange}
              disabled={updateLoading || selectedRole === selectedMember?.role}
              loading={updateLoading}
            >
              Save Role
            </Button>
          </View>
        </Modal>
      </Portal>
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
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20, // Add margin around the modal
    borderRadius: 8, // Optional: Add border radius
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  actions: {
      flexDirection: 'row',
      alignItems: 'center',
  }
});

export default MemberManagementScreen;
