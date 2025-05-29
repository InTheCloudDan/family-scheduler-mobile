import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, Card, Title, Paragraph, Divider } from 'react-native-paper'; // Removed Text
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
// Import TasksStackParamList once it's created
// import { TasksStackParamList } from '../../navigation/TasksStackNavigator';
import { Task } from '../../store/slices/tasksSlice'; // Import Task type

// Define route and navigation props using placeholder 'any' for now
// Replace 'any' with TasksStackParamList once defined
type TaskDetailScreenRouteProp = RouteProp<any, 'TaskDetail'>;
type TaskDetailScreenNavigationProp = StackNavigationProp<any, 'TaskDetail'>;

type Props = {
  route: TaskDetailScreenRouteProp;
  navigation: TaskDetailScreenNavigationProp;
};

const TaskDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  // Assume the task object or ID is passed via route params
  // For now, let's assume the full task object is passed for simplicity
  const { task } = route.params as { task: Task }; // Type assertion

  // TODO: If only ID is passed, fetch task details from API/Redux here using useEffect

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Task Details" />
        {/* TODO: Add Edit/Delete actions */}
      </Appbar.Header>

      <Card style={styles.card}>
        <Card.Content>
          <Title>{task.title}</Title>
          <Divider style={styles.divider} />
          <Paragraph>Status: {task.completed ? 'Completed' : 'Pending'}</Paragraph>
          {task.due_date && (
            <Paragraph>Due Date: {new Date(task.due_date).toLocaleDateString()}</Paragraph>
          )}
          {/* TODO: Display Assignee Name (requires fetching user details) */}
          {task.assignee && (
            <Paragraph>Assigned To: User ID {task.assignee}</Paragraph>
          )}
          {/* TODO: Display Linked Event (requires fetching event details) */}
          {task.event && (
            <Paragraph>Related Event: Event ID {task.event}</Paragraph>
          )}
          {task.description && (
            <>
              <Divider style={styles.divider} />
              <Paragraph style={styles.description}>{task.description}</Paragraph>
            </>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
  },
  divider: {
    marginVertical: 8,
  },
  description: {
    marginTop: 8,
  },
});

export default TaskDetailScreen;
