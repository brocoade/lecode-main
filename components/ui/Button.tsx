import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  ...rest
}) => {
  // Déterminer les styles en fonction des props
  const getButtonStyle = () => {
    let buttonStyle: ViewStyle = { ...styles.button };
    
    // Appliquer le style de variante
    switch (variant) {
      case 'primary':
        buttonStyle = { ...buttonStyle, ...styles.primaryButton };
        break;
      case 'secondary':
        buttonStyle = { ...buttonStyle, ...styles.secondaryButton };
        break;
      case 'outline':
        buttonStyle = { ...buttonStyle, ...styles.outlineButton };
        break;
    }
    
    // Appliquer le style de taille
    switch (size) {
      case 'small':
        buttonStyle = { ...buttonStyle, ...styles.smallButton };
        break;
      case 'medium':
        buttonStyle = { ...buttonStyle, ...styles.mediumButton };
        break;
      case 'large':
        buttonStyle = { ...buttonStyle, ...styles.largeButton };
        break;
    }
    
    // Appliquer le style désactivé si nécessaire
    if (disabled || isLoading) {
      buttonStyle = { ...buttonStyle, ...styles.disabledButton };
    }
    
    return buttonStyle;
  };
  
  const getTextStyle = () => {
    let textStyleObj: TextStyle = { ...styles.buttonText };
    
    // Appliquer le style de texte en fonction de la variante
    switch (variant) {
      case 'primary':
        textStyleObj = { ...textStyleObj, ...styles.primaryText };
        break;
      case 'secondary':
        textStyleObj = { ...textStyleObj, ...styles.secondaryText };
        break;
      case 'outline':
        textStyleObj = { ...textStyleObj, ...styles.outlineText };
        break;
    }
    
    // Appliquer le style de texte en fonction de la taille
    switch (size) {
      case 'small':
        textStyleObj = { ...textStyleObj, ...styles.smallText };
        break;
      case 'large':
        textStyleObj = { ...textStyleObj, ...styles.largeText };
        break;
    }
    
    // Appliquer le style désactivé si nécessaire
    if (disabled) {
      textStyleObj = { ...textStyleObj, ...styles.disabledText };
    }
    
    return textStyleObj;
  };
  
  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator 
          color={variant === 'outline' ? Colors.primary : Colors.white} 
          size="small" 
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: Layout.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Styles de variante
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.primaryLight,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  
  // Styles de taille
  smallButton: {
    paddingVertical: Layout.padding.small,
    paddingHorizontal: Layout.padding.medium,
    height: 36,
  },
  mediumButton: {
    paddingVertical: Layout.padding.medium,
    paddingHorizontal: Layout.padding.large,
    height: Layout.height.button,
  },
  largeButton: {
    paddingVertical: Layout.padding.large,
    paddingHorizontal: Layout.padding.large * 1.5,
    height: 56,
  },
  
  // Style désactivé
  disabledButton: {
    opacity: 0.6,
  },
  
  // Styles de texte
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: Colors.white,
  },
  secondaryText: {
    color: Colors.white,
  },
  outlineText: {
    color: Colors.primary,
  },
  smallText: {
    fontSize: Layout.fontSize.small,
  },
  largeText: {
    fontSize: Layout.fontSize.large,
  },
  disabledText: {
    opacity: 0.8,
  },
}); 