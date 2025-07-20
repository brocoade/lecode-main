import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ErrorType, ErrorMessage as ErrorMessageType } from '@/constants/ErrorMessages';

interface ErrorMessageProps {
  error?: ErrorMessageType | null;
  message?: string;
  title?: string;
  type?: ErrorType;
  visible?: boolean;
  onActionPress?: () => void;
  onDismiss?: () => void;
  style?: ViewStyle;
  showIcon?: boolean;
  dismissible?: boolean;
  compact?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  message,
  title,
  type = ErrorType.GENERAL,
  visible = true,
  onActionPress,
  onDismiss,
  style,
  showIcon = true,
  dismissible = false,
  compact = false
}) => {
  // Si pas d'erreur et pas de message, ne rien afficher
  if (!visible || (!error && !message)) {
    return null;
  }

  // Utiliser les props de l'erreur ou les props directes
  const errorTitle = error?.title || title;
  const errorMessage = error?.message || message;
  const errorType = error?.type || type;
  const isActionable = error?.actionable && onActionPress;
  const actionText = error?.actionText;

  // Obtenir l'icône et les couleurs selon le type d'erreur
  const getErrorConfig = () => {
    switch (errorType) {
      case ErrorType.VALIDATION:
        return {
          icon: 'alert-circle-outline' as const,
          backgroundColor: '#FFF3CD',
          borderColor: '#FFEAA7',
          iconColor: '#856404',
          titleColor: '#856404',
          messageColor: '#6C5700'
        };
      case ErrorType.AUTHENTICATION:
        return {
          icon: 'lock-closed-outline' as const,
          backgroundColor: '#F8D7DA',
          borderColor: '#F5C6CB',
          iconColor: '#721C24',
          titleColor: '#721C24',
          messageColor: '#5A1A1A'
        };
      case ErrorType.NETWORK:
        return {
          icon: 'wifi-outline' as const,
          backgroundColor: '#D1ECF1',
          borderColor: '#BEE5EB',
          iconColor: '#0C5460',
          titleColor: '#0C5460',
          messageColor: '#0A4A54'
        };
      case ErrorType.PERMISSION:
        return {
          icon: 'ban-outline' as const,
          backgroundColor: '#F8D7DA',
          borderColor: '#F5C6CB',
          iconColor: '#721C24',
          titleColor: '#721C24',
          messageColor: '#5A1A1A'
        };
      case ErrorType.HEARTS:
        return {
          icon: 'heart-dislike-outline' as const,
          backgroundColor: '#FCE4EC',
          borderColor: '#F8BBD9',
          iconColor: '#AD1457',
          titleColor: '#AD1457',
          messageColor: '#880E4F'
        };
      case ErrorType.QUIZ:
        return {
          icon: 'help-circle-outline' as const,
          backgroundColor: '#E1F5FE',
          borderColor: '#B3E5FC',
          iconColor: '#01579B',
          titleColor: '#01579B',
          messageColor: '#0277BD'
        };
      default:
        return {
          icon: 'alert-circle-outline' as const,
          backgroundColor: '#F8D7DA',
          borderColor: '#F5C6CB',
          iconColor: '#721C24',
          titleColor: '#721C24',
          messageColor: '#5A1A1A'
        };
    }
  };

  const config = getErrorConfig();

  const containerStyle: ViewStyle = {
    ...styles.container,
    backgroundColor: config.backgroundColor,
    borderColor: config.borderColor,
    ...(compact && styles.compactContainer),
    ...style
  };

  const titleStyle: TextStyle = {
    ...styles.title,
    color: config.titleColor,
    ...(compact && styles.compactTitle)
  };

  const messageStyle: TextStyle = {
    ...styles.message,
    color: config.messageColor,
    ...(compact && styles.compactMessage)
  };

  return (
    <View style={containerStyle}>
      <View style={styles.content}>
        {showIcon && (
          <View style={styles.iconContainer}>
            <Ionicons 
              name={config.icon} 
              size={compact ? 20 : 24} 
              color={config.iconColor} 
            />
          </View>
        )}
        
        <View style={styles.textContainer}>
          {errorTitle && !compact && (
            <Text style={titleStyle}>{errorTitle}</Text>
          )}
          {errorMessage && (
            <Text style={messageStyle}>{errorMessage}</Text>
          )}
          
          {isActionable && actionText && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onActionPress}
            >
              <Text style={[styles.actionText, { color: config.iconColor }]}>
                {actionText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {dismissible && onDismiss && (
          <TouchableOpacity 
            style={styles.dismissButton}
            onPress={onDismiss}
          >
            <Ionicons 
              name="close" 
              size={20} 
              color={config.iconColor} 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
    marginBottom: 4,
  },
  compactTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  compactMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  dismissButton: {
    marginLeft: 8,
    padding: 4,
  },
});

export default ErrorMessage;
