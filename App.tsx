import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {NotificationService} from './src/services/NotificationService';

// Импорт экранов
import HomeScreen from './src/screens/HomeScreen';
import AddProductScreen from './src/screens/AddProductScreen';
import ProductListScreen from './src/screens/ProductListScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Типы для навигации
export type RootStackParamList = {
  MainTabs: undefined;
  ProductDetail: {productId: string};
};

export type MainTabParamList = {
  Home: undefined;
  AddProduct: undefined;
  ProductList: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Основные табы
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'AddProduct') {
            iconName = 'add-circle';
          } else if (route.name === 'ProductList') {
            iconName = 'list';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{title: 'Главная'}}
      />
      <Tab.Screen 
        name="AddProduct" 
        component={AddProductScreen}
        options={{title: 'Добавить'}}
      />
      <Tab.Screen 
        name="ProductList" 
        component={ProductListScreen}
        options={{title: 'Продукты'}}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{title: 'Настройки'}}
      />
    </Tab.Navigator>
  );
}

// Главный компонент приложения
export default function App() {
  useEffect(() => {
    // Инициализируем сервис уведомлений при запуске приложения
    NotificationService.initialize();
    
    // Планируем уведомления
    NotificationService.scheduleNotifications();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen 
          name="ProductDetail" 
          component={ProductDetailScreen}
          options={{headerShown: true, title: 'Детали продукта'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
