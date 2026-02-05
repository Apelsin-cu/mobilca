import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import ScanScreen from './src/screens/HomeScreen';
import FridgeScreen from './src/screens/FridgeScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap;

              if (route.name === 'Scan') {
                iconName = focused ? 'scan' : 'scan-outline';
              } else if (route.name === 'Fridge') {
                iconName = focused ? 'cube' : 'cube-outline';
              } else {
                iconName = 'help';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#E07A5F',
            tabBarInactiveTintColor: '#999',
            tabBarStyle: {
              backgroundColor: '#fff',
              borderTopColor: '#EEE',
              paddingTop: 8,
              paddingBottom: 8,
              height: 70,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
              marginTop: 4,
            },
            headerShown: false,
          })}
        >
          <Tab.Screen 
            name="Scan" 
            component={ScanScreen} 
            options={{ tabBarLabel: 'Сканер' }}
          />
          <Tab.Screen 
            name="Fridge" 
            component={FridgeScreen} 
            options={{ tabBarLabel: 'Холодильник' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}

