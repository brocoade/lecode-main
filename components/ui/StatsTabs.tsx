import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Tab {
  id: string;
  title: string;
  icon: string;
  badge?: number;
}

interface StatsTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabPress: (tabId: string) => void;
}

export default function StatsTabs({
  tabs,
  activeTab,
  onTabPress
}: StatsTabsProps) {
  const animatedValues = useRef(
    tabs.reduce((acc, tab) => {
      acc[tab.id] = new Animated.Value(tab.id === activeTab ? 1 : 0);
      return acc;
    }, {} as Record<string, Animated.Value>)
  ).current;

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation de l'indicateur de tab active
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    Animated.spring(slideAnim, {
      toValue: activeIndex,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Animation des tabs
    tabs.forEach((tab, index) => {
      Animated.timing(animatedValues[tab.id], {
        toValue: tab.id === activeTab ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
  }, [activeTab, tabs]);

  const tabWidth = 100; // Largeur approximative de chaque tab

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {/* Indicateur de tab active */}
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              transform: [{
                translateX: slideAnim.interpolate({
                  inputRange: [0, tabs.length - 1],
                  outputRange: [0, (tabs.length - 1) * tabWidth],
                  extrapolate: 'clamp',
                })
              }]
            }
          ]}
        />

        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;
          
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, { width: tabWidth }]}
              onPress={() => onTabPress(tab.id)}
              activeOpacity={0.7}
            >
              <Animated.View
                style={[
                  styles.tabContent,
                  {
                    opacity: animatedValues[tab.id].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 1],
                    }),
                    transform: [{
                      scale: animatedValues[tab.id].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.95, 1],
                      })
                    }]
                  }
                ]}
              >
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name={tab.icon as any}
                    size={20}
                    color={isActive ? '#2196F3' : '#666'}
                  />
                  {tab.badge && tab.badge > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {tab.badge > 99 ? '99+' : tab.badge.toString()}
                      </Text>
                    </View>
                  )}
                </View>
                <Animated.Text
                  style={[
                    styles.tabTitle,
                    {
                      color: animatedValues[tab.id].interpolate({
                        inputRange: [0, 1],
                        outputRange: ['#666', '#2196F3'],
                      }),
                      fontWeight: isActive ? '600' : '400'
                    }
                  ]}
                >
                  {tab.title}
                </Animated.Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    position: 'relative',
  },
  tabsContainer: {
    paddingHorizontal: 16,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    width: 100,
    height: 3,
    backgroundColor: '#2196F3',
    borderRadius: 2,
  },
  tab: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#FF5722',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  tabTitle: {
    fontSize: 12,
    textAlign: 'center',
  },
});
