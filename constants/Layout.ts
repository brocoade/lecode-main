import { Dimensions } from 'react-native';

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

export const Layout = {
  window: {
    width,
    height,
  },
  isSmallDevice: width < 375,
  
  // Marges et paddings standards
  padding: {
    small: 8,
    medium: 16,
    large: 24,
  },
  margin: {
    small: 8,
    medium: 16,
    large: 24,
  },
  
  // Rayons de bordure
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
  },
  
  // Tailles de texte
  fontSize: {
    small: 12,
    medium: 16,
    large: 20,
    xlarge: 24,
    xxlarge: 32,
  },
  
  // Hauteurs standards
  height: {
    header: 60,
    tabBar: 60,
    button: 48,
    input: 48,
  },
  
  // Ombres
  shadow: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
  },
}; 