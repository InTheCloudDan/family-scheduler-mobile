import React, { useEffect } from 'react'; // Import useEffect
import { View, FlatList, StyleSheet, Alert } from 'react-native'; // Import Alert
import { Appbar, List, Divider, Text, ActivityIndicator, Button } from 'react-native-paper';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { FamilyStackParamList } from '../../navigation/FamilyStackNavigator';
import {
  Child, // Import Child type
  selectCurrentFamilyChildren,
  selectFamilyChildrenLoading, // Use loading state from detail fetch for now
  selectFamilyChildrenError, // Use error state from detail fetch for now
  deleteChild, // Import delete thunk
  selectDeleteChildLoading, // Import delete loading selector
  clearDeleteChildError, // Import clear delete error action
} from '../../store/slices/familySlice';

type ChildManagementScreenRouteProp = RouteProp<FamilyStackParamList, 'ChildManagement'>;
type ChildManagementScreenNavigationProp = StackNavigationProp<FamilyStackParamList, 'ChildManagement'>;

type Props = {
  route: ChildManagementScreenRouteProp;
  navigation: ChildManagementScreenNavigationProp;
};

const ChildManagementScreen: React.FC<Props> = ({ route, navigation }) => {
  const { familyId } = route.params; // Get familyId passed from navigation
  const dispatch = useDispatch<AppDispatch>(); // Use dispatch

  const children = useSelector(selectCurrentFamilyChildren);
  const loading = useSelector(selectFamilyChildrenLoading);
  const error = useSelector(selectFamilyChildrenError);
  const deleteLoading = useSelector(selectDeleteChildLoading); // Get delete loading state

  useEffect(() => {
    // Clear delete error when component unmounts
    return () => {
      dispatch(clearDeleteChildError());
    };
  }, [dispatch]);

  const handleEditChild = (child: Child) => {
    navigation.navigate('EditChild', { familyId, child });
  };

  const handleDeleteChild = (childId: number, childName: string) => {
    Alert.alert(
      'Delete Child',
      `Are you sure you want to delete ${childName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const resultAction = await dispatch(deleteChild(childId));
            if (deleteChild.rejected.match(resultAction)) {
              // Show error alert if deletion fails
              Alert.alert('Error', `Failed to delete child: ${resultAction.payload}`);
            }
            // No need to re-fetch, the reducer removes the child from state
          },
        },
      ]
    );
  };

  const renderChildItem = ({ item }: { item: Child }) => ( // Use Child type
    <List.Item
      title={`${item.first_name} ${item.last_name}`}
      description={`Age: ${item.age ?? 'N/A'}`}
      left={_props => <List.Icon {..._props} icon="account-child-outline" />} // Icon indicating child
      right={_props => (
        <View style={styles.actions}>
          {/* Edit Button */}
          <Button
            onPress={() => handleEditChild(item)}
            disabled={deleteLoading} // Disable while deleting another
          >
            Edit
          </Button>
          {/* Delete Button */}
          <Button
             onPress={() => handleDeleteChild(item.id, item.first_name)}
             color="red" // Style appropriately
             disabled={deleteLoading} // Disable while deleting
             loading={deleteLoading} // Show loading indicator
          >
            Delete
          </Button>
        </View>
      )}
      // onPress={() => console.log('Navigate to child detail?')} // Optional: Navigate to a child detail screen?
    />
  );

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator animating={true} size="large" style={styles.centered} />;
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Error loading children: {error}</Text>
          {/* Optionally add a retry button if fetching is done here */}
        </View>
      );
    }

     // No need for "No children found" here as the Add button is primary
    // if (!children || children.length === 0) { ... }

    return (
      <FlatList
        data={children}
        renderItem={renderChildItem}
        keyExtractor={(item) => item.id.toString()}
        ItemSeparatorComponent={() => <Divider />}
        ListEmptyComponent={() => (
            <View style={styles.centered}>
                <Text>No children added yet.</Text>
            </View>
        )}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Manage Children" subtitle={`Family ID: ${familyId}`} />
        <Appbar.Action icon="plus" onPress={() => navigation.navigate('AddChild', { familyId })} /> {/* Enable navigation */}
      </Appbar.Header>
      {renderContent()}
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
    marginTop: 50, // Adjust if needed so it doesn't overlap header
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

export default ChildManagementScreen;
