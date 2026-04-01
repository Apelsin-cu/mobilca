import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './src/screens/HomeScreen';
import FridgeScreen from './src/screens/FridgeScreen';
import RecipesScreen from './src/screens/RecipesScreen';
import AuthService from './src/services/AuthService';

const Tab = createBottomTabNavigator();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await AuthService.ensureAnonymousSession();
      } catch (error) {
        console.error('Failed to initialize anonymous session:', error);
      } finally {
        setIsReady(true);
      }
    };

    bootstrap();
  }, []);

  if (!isReady) {
    return (
      <>
        <StatusBar style="dark" />
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color="#5FAF8F" />
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';

              if (route.name === 'Проверка') {
                iconName = focused ? 'scan' : 'scan-outline';
              } else if (route.name === 'Холодильник') {
                iconName = focused ? 'cube' : 'cube-outline';
              } else if (route.name === 'Рецепты') {
                iconName = focused ? 'restaurant' : 'restaurant-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#17191C',
            tabBarInactiveTintColor: '#7C8795',
            tabBarStyle: {
              height: 74,
              paddingTop: 8,
              paddingBottom: 10,
            },
            headerShown: false,
          })}
        >
          <Tab.Screen name="Проверка" component={HomeScreen} />
          <Tab.Screen name="Холодильник" component={FridgeScreen} />
          <Tab.Screen name="Рецепты" component={RecipesScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
});
