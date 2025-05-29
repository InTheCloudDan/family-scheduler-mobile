import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme, Icon } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface EmptyStateViewProps {
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap; // Optional icon name from MaterialCommunityIcons
  message: string;
  buttonLabel?: string;
  onButtonPress?: () => void;
}

const EmptyStateView: React.FC<EmptyStateViewProps> = ({
  iconName,
  message,
  buttonLabel,
  onButtonPress,
}) => {
  const theme = useTheme();
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32, // Generous padding
      backgroundColor: theme.colors.background,
    },
    icon: {
      marginBottom: 16,
    },
    message: {
      textAlign: 'center',
      marginBottom: 24,
      color: theme.colors.onSurfaceVariant, // Use secondary text color for less emphasis
    },
    button: {
      minWidth: '60%', // Make button reasonably wide
    },
  });

  return (
    <View style={styles.container}>
      {iconName && (
        <Icon
          source={iconName}
          size={64} // Larger icon size
          color={theme.colors.onSurfaceDisabled} // Use a muted color
          style={styles.icon}
        />
      )}
      <Text variant="titleMedium" style={styles.message}>
        {message}
      </Text>
      {buttonLabel && onButtonPress && (
        <Button
          mode="contained"
          onPress={onButtonPress}
          style={styles.button}
          labelStyle={{ paddingVertical: 4 }} // Add some vertical padding to button text
          icon="plus-circle-outline" // Default icon, can be customized if needed
        >
          {buttonLabel}
        </Button>
      )}
    </View>
  );
};

export default EmptyStateView;
