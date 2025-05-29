import React, { useEffect, useState, useCallback } from 'react'; // Import useState, useCallback
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native'; // Import RefreshControl
import { Text, Appbar, ActivityIndicator, Card, Title, Paragraph, FAB } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import { StackNavigationProp } from '@react-navigation/stack'; // Import StackNavigationProp
import { AppDispatch } from '../../store'; // Import AppDispatch
import {
  fetchVacations,
  selectAllVacations,
  selectVacationsLoadingList, // Corrected selector name
  selectVacationsError,
} from '../../store/slices/vacationsSlice';
import { RootState } from '../../store/rootReducer'; // Import RootState
import { VacationsStackParamList } from '../../navigation/VacationsStackNavigator'; // Import ParamList

// Define navigation prop type for this screen within the VacationsStack
type VacationsScreenNavigationProp = StackNavigationProp<VacationsStackParamList, 'VacationsList'>;

const VacationsScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<VacationsScreenNavigationProp>(); // Get navigation object
  const vacations = useSelector(selectAllVacations);
  const loading = useSelector(selectVacationsLoadingList);
  const error = useSelector(selectVacationsError);
  const [isRefreshing, setIsRefreshing] = useState(false); // State for refresh control

  const loadVacations = useCallback(() => {
    dispatch(fetchVacations());
  }, [dispatch]);

  useEffect(() => {
    loadVacations(); // Initial load
  }, [loadVacations]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchVacations()).unwrap(); // Use unwrap to handle promise completion
    } catch (e) {
      console.error("Failed to refresh vacations:", e);
      // Optionally show a snackbar or toast message
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch]);


  const handleNavigateToDetail = (vacationId: number) => {
    navigation.navigate('VacationDetail', { vacationId });
  };

  const handleNavigateToAddForm = () => {
    navigation.navigate('VacationForm', {}); // No vacationId means 'add' mode
  };

  const renderVacationItem = ({ item }: { item: RootState['vacations']['vacations'][0] }) => ( // Use RootState to type item
    <TouchableOpacity onPress={() => handleNavigateToDetail(item.id)}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>{item.name}</Title>
        <Paragraph>
          {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
        </Paragraph>
          {item.description && <Paragraph>{item.description}</Paragraph>}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator animating={true} size="large" style={styles.centered} />;
    }
    if (error) {
      return <Text style={styles.centered}>Error: {error}</Text>;
    }
    if (vacations.length === 0) {
        return <Text style={styles.centered}>No vacations planned yet.</Text>;
    }
    return (
      <FlatList
        data={vacations}
        renderItem={renderVacationItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={ // Add RefreshControl
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Vacations" />
        {/* Add refresh button? */}
      </Appbar.Header>
      {renderContent()}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleNavigateToAddForm} // Navigate to form screen
      />
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
    padding: 16,
  },
  listContent: {
      padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default VacationsScreen;
