import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Image, Animated, Text } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface TabItem {
  name: string;
  route: string;
  icon: any;
  label: string;
}

const tabs: TabItem[] = [
  {
    name: 'learn',
    route: '/learn',
    icon: require('../../assets/images/etude.png'),
    label: 'Apprendre'
  },
  {
    name: 'quiz',
    route: '/quiz',
    icon: require('../../assets/images/quiz.png'),
    label: 'Quiz'
  },
  {
    name: 'stats',
    route: '/stats',
    icon: require('../../assets/images/statistiques.png'),
    label: 'Stats'
  },
  {
    name: 'profile',
    route: '/profile',
    icon: require('../../assets/images/homme-removebg-preview.png'),
    label: 'Profil'
  },
  {
    name: 'settings',
    route: '/settings',
    icon: require('../../assets/images/parametres.png'),
    label: 'Paramètres'
  }
];

const BottomTabBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [currentTab, setCurrentTab] = useState('');
  
  // Animations
  const scaleAnims = useRef<Animated.Value[]>(
    tabs.map(() => new Animated.Value(1))
  ).current;
  
  const opacityAnims = useRef<Animated.Value[]>(
    tabs.map(() => new Animated.Value(0.7))
  ).current;

  // Déterminer la route active
  const getActiveRoute = (path: string) => {
    const route = tabs.find(tab => path.includes(tab.name));
    return route ? route.name : 'learn';
  };

  const activeRoute = getActiveRoute(pathname);
  
  // Initialisation des valeurs d'animation pour l'onglet actif au montage
  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.name === activeRoute);
    
    // Mettre à jour les valeurs d'animation sans animations
    tabs.forEach((_, index) => {
      opacityAnims[index].setValue(index === activeIndex ? 1 : 0.7);
    });
    
    setCurrentTab(activeRoute);
  }, []);

  const handleTabPress = (route: string, index: number) => {
    // Navigation instantanée sans animations ni attente
    if (route !== pathname) {
      // Uniquement naviguer si on n'est pas déjà sur cette route
      router.push(route);
      
      // Mettre à jour immédiatement l'onglet actif visuellement
      tabs.forEach((_, i) => {
        // Réinitialiser tous les onglets
        opacityAnims[i].setValue(i === index ? 1 : 0.7);
        scaleAnims[i].setValue(1);
      });
      
      // Appliquer légère animation visuelle pour feedback
      scaleAnims[index].setValue(1.1);
      
      // Mettre à jour l'état local pour éviter des rendus inutiles
      setCurrentTab(tabs[index].name);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: 0 }]}>
      <View style={styles.navbarContainer}>
        <View style={styles.contentContainer}>
          {tabs.map((tab, index) => {
            const isActive = tab.name === activeRoute;
            
            return (
              <TouchableOpacity
                key={index}
                style={styles.tabItem}
                onPress={() => handleTabPress(tab.route, index)}
                activeOpacity={0.7}
              >
                <Animated.View 
                  style={[
                    styles.iconWrapper, 
                    isActive && styles.activeIconWrapper,
                    {
                      transform: [{ scale: scaleAnims[index] }]
                    }
                  ]}
                >
                  <Image 
                    source={tab.icon}
                    style={[
                      styles.iconImage,
                      { opacity: isActive ? 1 : 0.7 }
                    ]}
                    resizeMode="contain"
                  />
                </Animated.View>
                <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  navbarContainer: {
    width: '100%',
    height: 70,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 7,
  },
  activeIconWrapper: {
    backgroundColor: 'rgba(76, 102, 239, 0.1)',
    shadowColor: '#4C66EF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
  tabLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  activeTabLabel: {
    color: '#4C66EF',
    fontWeight: 'bold',
  }
});

export default BottomTabBar; 