import React, { useEffect, useState } from 'react'; // Import useState
import { View, ScrollView, StyleSheet, Alert } from 'react-native'; // Import Alert
import { Appbar, Text, Card, List, ActivityIndicator, Button, HelperText, FAB, Portal, Provider as PaperProvider } from 'react-native-paper'; // Import FAB, Portal, PaperProvider
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store';
// RootState import removed as it's unused
import { FamilyStackParamList } from '../../navigation/FamilyStackNavigator';
import {
  fetchFamilyDetail,
  fetchFamilyMembers,
  fetchFamilyChildren,
  selectCurrentFamilyDetail,
  selectCurrentFamilyMembers,
  selectCurrentFamilyChildren,
  selectFamilyDetailLoading,
  selectFamilyMembersLoading,
  selectFamilyChildrenLoading,
  selectFamilyDetailError,
  selectFamilyMembersError,
  selectFamilyChildrenError,
  deleteFamily, // Import delete thunk
  selectDeleteFamilyLoading, // Import delete loading selector
  selectDeleteFamilyError, // Import delete error selector
  clearDeleteFamilyError, // Import clear delete error action
  clearCurrentFamily, // To clear state when leaving the screen
  fetchFamilyGroups, // Import fetchFamilyGroups
} from '../../store/slices/familySlice';

type FamilyDetailScreenRouteProp = RouteProp<FamilyStackParamList, 'FamilyDetail'>;
type FamilyDetailScreenNavigationProp = StackNavigationProp<FamilyStackParamList, 'FamilyDetail'>;

type Props = {
  route: FamilyDetailScreenRouteProp;
  navigation: FamilyDetailScreenNavigationProp;
};

const FamilyDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { familyId } = route.params;
  const dispatch = useDispatch<AppDispatch>();

  const family = useSelector(selectCurrentFamilyDetail);
  const members = useSelector(selectCurrentFamilyMembers);
  const children = useSelector(selectCurrentFamilyChildren);
  const loadingDetail = useSelector(selectFamilyDetailLoading);
  const loadingMembers = useSelector(selectFamilyMembersLoading);
  const loadingChildren = useSelector(selectFamilyChildrenLoading);
  const errorDetail = useSelector(selectFamilyDetailError);
  const errorMembers = useSelector(selectFamilyMembersError);
  const errorChildren = useSelector(selectFamilyChildrenError);
  const loadingDelete = useSelector(selectDeleteFamilyLoading);
  const errorDelete = useSelector(selectDeleteFamilyError);

  // State for FAB group
  const [fabOpen, setFabOpen] = useState(false);


  useEffect(() => {
    if (familyId) {
      dispatch(fetchFamilyDetail(familyId));
      dispatch(fetchFamilyMembers(familyId));
      dispatch(fetchFamilyChildren(familyId));
    }
    // Clear the current family data and delete error when the component unmounts
    return () => {
      dispatch(clearCurrentFamily());
      dispatch(clearDeleteFamilyError());
    };
  }, [dispatch, familyId]);

  const handleRetry = () => {
    if (familyId) {
        if (errorDetail) dispatch(fetchFamilyDetail(familyId));
        if (errorMembers) dispatch(fetchFamilyMembers(familyId));
        if (errorChildren) dispatch(fetchFamilyChildren(familyId));
    }
  };

  const handleDeletePress = () => {
    if (!family) return;

    Alert.alert(
      'Delete Family',
      `Are you sure you want to delete the family "${family.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (familyId) {
              const deleteResultAction = await dispatch(deleteFamily(familyId));
              if (deleteFamily.fulfilled.match(deleteResultAction)) {
                // Re-fetch the list for the previous screen
                dispatch(fetchFamilyGroups());
                navigation.goBack();
              }
              // Error is handled by the selector below
            }
          },
        },
      ]
    );
  };

  const isLoading = loadingDetail || loadingMembers || loadingChildren || loadingDelete;
  const hasError = errorDetail || errorMembers || errorChildren || errorDelete;

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={family ? family.name : 'Family Details'} />
        {/* Keep delete in Appbar for now, as it's a destructive action */}
        {family && !isLoading && (
             <Appbar.Action icon="delete" onPress={handleDeletePress} disabled={loadingDelete} />
        )}
      </Appbar.Header>
      {/* Wrap content in PaperProvider for Portal */}
      <PaperProvider>
        <Portal>
           {/* FAB Group - only show if family loaded and not loading */}
           {family && !isLoading && (
            <FAB.Group
              open={fabOpen}
              visible={true} // Keep visible, actions control interaction
              icon={fabOpen ? 'close' : 'plus'}
              actions={[
                {
                  icon: 'pencil',
                  label: 'Edit Family',
                  onPress: () => navigation.navigate('FamilyForm', { familyId }),
                  // small: false, // Removed invalid prop
                },
                {
                  icon: 'account-plus',
                  label: 'Invite Member',
                  onPress: () => navigation.navigate('InviteForm', { familyId }),
                  // small: false, // Removed invalid prop
                },
                {
                  icon: 'account-child', // Or 'baby-carriage'
                  label: 'Add Child',
                  // Corrected navigation route name
                  onPress: () => navigation.navigate('AddChild', { familyId }),
                  // small: false, // Removed invalid prop
                },
                 {
                  icon: 'account-group',
                  label: 'Manage Members',
                  onPress: () => navigation.navigate('MemberManagement', { familyId }),
                  // small: false, // Removed invalid prop
                },
                 {
                  icon: 'human-child', // Or similar
                  label: 'Manage Children',
                  onPress: () => navigation.navigate('ChildManagement', { familyId }),
                  // small: false, // Removed invalid prop
                },
              ]}
              onStateChange={({ open }) => setFabOpen(open)}
              onPress={() => {
                if (fabOpen) {
                  // do something if the speed dial is open
                }
              }}
              style={styles.fabGroup} // Add style for positioning if needed
            />
           )}
        </Portal>
        <ScrollView contentContainerStyle={styles.content}>
        {isLoading && <ActivityIndicator animating={true} size="large" style={styles.centered} />}

        {/* Display Delete Error Separately */}
         {errorDelete && !loadingDelete && (
             <HelperText type="error" visible={!!errorDelete} style={styles.errorText}>
                 Failed to delete family: {errorDelete}
             </HelperText>
         )}

        {hasError && !isLoading && !errorDelete && ( // Don't show general error if delete error is shown
          <View style={styles.centered}>
            <Text style={styles.errorText}>
              {String(errorDetail || errorMembers || errorChildren || 'An error occurred loading details')}
            </Text>
            <Button mode="contained" onPress={handleRetry}>Retry</Button>
          </View>
        )}

        {!isLoading && !hasError && family && (
          <>
            <Card style={styles.card}>
              <Card.Title title="Family Info" />
              <Card.Content>
                <Text>Name: {family.name}</Text>
                <Text>Referral Code: {family.referral_code}</Text>
                {/* Add other family details here */}
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Title title="Members" />
              <Card.Content>
                {members.length === 0 ? (
                  <Text>No members found.</Text>
                ) : (
                  members.map((member) => (
                    <List.Item
                      key={member.id}
                      title={`${member.user.first_name} ${member.user.last_name} (${member.user.username})`}
                      description={`Role: ${member.role} ${member.is_admin ? '(Admin)' : ''}`}
                      left={props => <List.Icon {...props} icon="account" />}
                      // onPress={() => handleMemberPress(member.id)} // Add later
                    />
                  ))
                )}
                {/* Remove Manage Members and Invite Member buttons */}
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Title title="Children" />
              <Card.Content>
                {children.length === 0 ? (
                  <Text>No children found.</Text>
                ) : (
                  children.map((child) => (
                    <List.Item
                      key={child.id}
                      title={`${child.first_name} ${child.last_name}`}
                      description={`Age: ${child.age ?? 'N/A'}`}
                      left={props => <List.Icon {...props} icon="account-child" />}
                      // onPress={() => handleChildPress(child.id)} // Add later
                    />
                  ))
                 )}
                 {/* Remove Manage Children button */}
              </Card.Content>
            </Card>
          </>
        )}
      </ScrollView>
     </PaperProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
      marginTop: 10,
  },
  fabGroup: { // Style for FAB Group if needed, often handled by default positioning
    // position: 'absolute', // Default is usually bottom right
    // margin: 16,
    // right: 0,
    // bottom: 0,
  },
});

export default FamilyDetailScreen;
