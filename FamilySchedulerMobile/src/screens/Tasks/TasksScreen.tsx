import React, { useEffect, useState, useCallback } from 'react'; // Add useState, useCallback
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native'; // Add RefreshControl
import { Text, List, Checkbox, ActivityIndicator as PaperActivityIndicator } from 'react-native-paper'; // Import Paper components
import { useDispatch, useSelector } from 'react-redux'; // Import hooks
import { AppDispatch } from '../../store'; // Import AppDispatch
import { RootState } from '../../store/rootReducer'; // Import RootState correctly
import { fetchPendingTasks, updateTaskStatus, clearUpdateTaskError } from '../../store/slices/tasksSlice'; // Import actions
import type { Task as TaskType } from '../../store/slices/tasksSlice'; // Import type
import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import { StackNavigationProp } from '@react-navigation/stack'; // Import StackNavigationProp
import { TasksStackParamList } from '../../navigation/TasksStackNavigator'; // Import stack param list

// Define navigation prop type
type TasksScreenNavigationProp = StackNavigationProp<TasksStackParamList, 'TaskList'>;

interface Props {} // Keep props empty as navigation is accessed via hook

const TasksScreen: React.FC<Props> = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<TasksScreenNavigationProp>(); // Get navigation object
  // Assuming tasksSlice.items holds the relevant tasks for this view (e.g., pending)
  const { items: tasks, isLoading, error, isUpdating, updateError } = useSelector((state: RootState) => state.tasks); // Add update state selectors
  const [isRefreshing, setIsRefreshing] = useState(false); // State for refresh control

  const loadTasks = useCallback(() => { // Renamed for clarity, used in initial load and refresh
    dispatch(fetchPendingTasks());
  }, [dispatch]);

  useEffect(() => {
    // Fetch initial list of tasks
    loadTasks();

    // Clear update error on unmount
    return () => {
        dispatch(clearUpdateTaskError());
    };
  }, [loadTasks, dispatch]); // Use loadTasks in dependency array

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchPendingTasks()).unwrap(); // Use unwrap to handle promise completion
    } catch (e) {
      console.error("Failed to refresh tasks:", e);
      // Optionally show a snackbar or toast message
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch]);


  const handleToggleComplete = (taskId: number, currentStatus: boolean) => {
      // Dispatch updateTaskStatus thunk
      dispatch(updateTaskStatus({ taskId, completed: !currentStatus }));
      // Note: Error handling for update can be added here via Alert or using the updateError state
  };

  const navigateToDetail = (task: TaskType) => {
      navigation.navigate('TaskDetail', { task });
  };

  const renderItem = ({ item }: { item: TaskType }) => (
     <List.Item
          key={item.id}
          title={item.title}
          description={item.due_date ? `Due: ${new Date(item.due_date).toLocaleDateString()}` : 'No due date'}
          left={props => (
              <Checkbox
                  {...props}
                  status={item.completed ? 'checked' : 'unchecked'}
                  onPress={() => handleToggleComplete(item.id, item.completed)}
                  disabled={isUpdating} // Disable checkbox while an update is in progress
              />
          )}
          onPress={() => navigateToDetail(item)} // Navigate on item press
      />
  );

  return (
    <View style={styles.container}>
       {/* TODO: Add filtering options (All, Pending, Completed, Assigned to Me, etc.) */}
       {/* Display update error */}
       {updateError && <Text style={styles.errorText}>Update Error: {updateError}</Text>}
       {isLoading && tasks.length === 0 ? (
            <PaperActivityIndicator animating={true} style={styles.loadingIndicator} />
       ) : error ? (
            <Text style={styles.errorText}>Fetch Error: {error}</Text>
       ) : (
            <FlatList
                data={tasks} // Display tasks from the slice
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={<Text style={styles.emptyText}>No tasks found.</Text>}
                // TODO: Add pagination logic if needed
                refreshControl={ // Add RefreshControl
                  <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
                }
            />
       )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5,
  },
  // title removed as list fills screen
  loadingIndicator: {
      marginTop: 50,
  },
  errorText: {
      margin: 20,
      textAlign: 'center',
      color: 'red',
  },
  emptyText: {
      margin: 20,
      textAlign: 'center',
      color: 'grey',
  },
});

export default TasksScreen;
