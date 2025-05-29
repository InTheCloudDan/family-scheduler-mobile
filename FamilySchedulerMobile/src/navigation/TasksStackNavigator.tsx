import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TasksScreen from '../screens/Tasks/TasksScreen';
import TaskDetailScreen from '../screens/Tasks/TaskDetailScreen';
import { Task } from '../store/slices/tasksSlice'; // Import Task type

// Define the parameter list for the stack navigator
export type TasksStackParamList = {
  TaskList: undefined; // No params for the main list screen
  TaskDetail: { task: Task }; // Pass the full task object for now
  // Add TaskForm screen later if needed
};

const Stack = createStackNavigator<TasksStackParamList>();

const TasksStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TaskList" component={TasksScreen} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
      {/* Add TaskForm screen here later */}
    </Stack.Navigator>
  );
};

export default TasksStackNavigator;
