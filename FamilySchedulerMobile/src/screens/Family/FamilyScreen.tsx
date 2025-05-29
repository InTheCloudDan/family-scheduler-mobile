import React, { useEffect, useState, useCallback } from 'react'; // Add useState, useCallback
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native'; // Add RefreshControl
import { Text, Appbar, ActivityIndicator, List, Divider, Button, FAB } from 'react-native-paper'; // Import FAB
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store'; // AppDispatch is exported from store/index.ts
import {
  fetchFamilyGroups,
  selectAllFamilyGroups,
  selectFamilyListLoading,
  selectFamilyListError,
  clearFamilyListError,
} from '../../store/slices/familySlice'; // Adjust path if needed
import { FamilyStackParamList } from '../../navigation/FamilyStackNavigator'; // Adjust path if needed

type FamilyScreenNavigationProp = StackNavigationProp<
  FamilyStackParamList,
  'FamilyList'
>;

type Props = {
  navigation: FamilyScreenNavigationProp;
};

// Define the separator component outside the main component to avoid re-creation on render
const FamilyListItemSeparator = () => <Divider />;


const FamilyScreen: React.FC<Props> = ({ navigation }) => { // Use navigation prop
  const dispatch = useDispatch<AppDispatch>();
  const families = useSelector(selectAllFamilyGroups);
  const loading = useSelector(selectFamilyListLoading);
  const error = useSelector(selectFamilyListError);
  const [isRefreshing, setIsRefreshing] = useState(false); // State for refresh control

  const loadFamilies = useCallback(() => { // Renamed for clarity
    dispatch(fetchFamilyGroups());
  }, [dispatch]);

  useEffect(() => {
    // Fetch families when the component mounts
    loadFamilies();
    // Clear error when component unmounts or on re-focus (optional)
    return () => {
      dispatch(clearFamilyListError());
     };
   }, [loadFamilies, dispatch]); // Use loadFamilies

  // // Effect to navigate directly to detail if only one family exists
  // useEffect(() => {
  //   // Check only after loading is complete and there's no error
  //   if (!loading && !error && families && families.length === 1) {
  //     // Use replace to prevent going back to the list screen
  //     navigation.replace('FamilyDetail', { familyId: families[0].id });
  //   }
  //   // Dependencies: navigate when families array updates, loading finishes, or error state changes
  // }, [families, loading, error, navigation]);

   const onRefresh = useCallback(async () => { // Add onRefresh handler
     setIsRefreshing(true);
    try {
      await dispatch(fetchFamilyGroups()).unwrap();
    } catch (e) {
      console.error("Failed to refresh families:", e);
      // Optionally show a snackbar or toast message
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch]);


  const handleRetry = () => {
    loadFamilies(); // Use loadFamilies
  };

  const handleNavigateToDetail = (familyId: number) => {
    navigation.navigate('FamilyDetail', { familyId }); // Uncomment and use navigation
    // console.log(`Navigate to detail for family ID: ${familyId}`);
  };

  const handleNavigateToCreate = () => {
    navigation.navigate('FamilyForm', {}); // Pass empty object for params when creating
    // console.log('Navigate to create family form');
  };

  const renderFamilyItem = ({ item }: { item: { id: number; name: string } }) => (
    <List.Item
      title={item.name}
      description={`ID: ${item.id}`} // Or other relevant info
      left={props => <List.Icon {...props} icon="account-group" />}
      onPress={() => handleNavigateToDetail(item.id)}
    />
  );

  const renderContent = () => {
    // Show loading indicator only on initial load, not during refresh
    if (loading && !isRefreshing) {
      return <ActivityIndicator animating={true} size="large" style={styles.centered} />;
    }

    if (error && !loading) { // Show error only if not loading
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Error loading families: {error}</Text>
          <Button mode="contained" onPress={handleRetry}>Retry</Button>
        </View>
      );
    }

    // Show empty state only if not loading and families array is truly empty
    if (!loading && (!families || families.length === 0)) {
      return (
        <View style={styles.centered}>
          <Text>No families found.</Text>
          <Button mode="contained" onPress={handleNavigateToCreate} style={{ marginTop: 10 }}>
            Create Family
          </Button>
          {/* Optionally add RefreshControl here too for empty state */}
          {/* <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} /> */}
        </View>
      );
    }

    // Render FlatList if loading during refresh or if data exists
    return (
      <FlatList
        data={families}
        renderItem={renderFamilyItem}
        keyExtractor={(item) => item.id.toString()}
        ItemSeparatorComponent={FamilyListItemSeparator}
        refreshControl={ // Add RefreshControl prop
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        // Optionally add ListEmptyComponent for the case where loading finishes and list is empty
        ListEmptyComponent={
          !loading ? (
            <View style={styles.centered}>
              <Text>No families found.</Text>
              <Button mode="contained" onPress={handleNavigateToCreate} style={{ marginTop: 10 }}>
                Create Family
              </Button>
            </View>
          ) : null
        }
      />
    );
  };


  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="My Families" />
        {/* Remove Appbar.Action */}
      </Appbar.Header>
      {renderContent()}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleNavigateToCreate}
        disabled={loading} // Disable FAB while loading
      />
    </View>
  );
};

// Define the styles
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
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  fab: { // Add FAB styles
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default FamilyScreen;
