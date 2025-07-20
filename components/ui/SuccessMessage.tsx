import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SuccessMessageProps {
  message: string;
  title?: string;
  visible?: boolean;
  onDismiss?: () => void;
  style?: ViewStyle;
  showIcon?: boolean;
  dismissible?: boolean;
  compact?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  title,
  visible = true,
  onDismiss,
  style,
  showIcon = true,
  dismissible = false,
  compact = false,
  autoHide = false,
  autoHideDelay = 3000
}) => {
  // Auto-hide functionality
  React.useEffect(() => {
    if (autoHide && visible && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoHideDelay);
      
      return () => clearTimeout(timer);
    }
  }, [autoHide, visible, onDismiss, autoHideDelay]);

  // Si pas visible ou pas de message, ne rien afficher
  if (!visible || !message) {
    return null;
  }

  const containerStyle: ViewStyle = {
    ...styles.container,
    ...(compact && styles.compactContainer),
    ...style
  };

  const titleStyle: TextStyle = {
    ...styles.title,
    ...(compact && styles.compactTitle)
  };

  const messageStyle: TextStyle = {
    ...styles.message,
    ...(compact && styles.compactMessage)
  };

  return (
    <View style={containerStyle}>
      <View style={styles.content}>
        {showIcon && (
          <View style={styles.iconContainer}>
            <Ionicons 
              name="checkmark-circle" 
              size={compact ? 20 : 24} 
              color="#155724" 
            />
          </View>
        )}
        
        <View style={styles.textContainer}>
          {title && !compact && (
            <Text style={titleStyle}>{title}</Text>
          )}
          <Text style={messageStyle}>{message}</Text>
        </View>
        
        {dismissible && onDismiss && (
          <TouchableOpacity 
            style={styles.dismissButton}
            onPress={onDismiss}
          >
            <Ionicons 
              name="close" 
              size={20} 
              color="#155724" 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#D4EDDA',
    borderColor: '#C3E6CB',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  compactContainer: {
    padding: 8,
    marginVertical: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#155724',
    marginBottom: 4,
  },
  compactTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#155724',
  },
  compactMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  dismissButton: {
    marginLeft: 8,
    padding: 4,
  },
});

export default SuccessMessage;
