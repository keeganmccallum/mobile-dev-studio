import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import TerminalScreen from './src/screens/TerminalScreen';
import EditorScreen from './src/screens/EditorScreen';
import PreviewScreen from './src/screens/PreviewScreen';
import TermuxDemoScreen from './src/screens/TermuxDemoScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Terminal') {
              iconName = focused ? 'terminal' : 'terminal-outline';
            } else if (route.name === 'Editor') {
              iconName = focused ? 'code-slash' : 'code-slash-outline';
            } else if (route.name === 'Preview') {
              iconName = focused ? 'eye' : 'eye-outline';
            } else if (route.name === 'Termux Demo') {
              iconName = focused ? 'phone-portrait' : 'phone-portrait-outline';
            } else {
              iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: '#f8f9fa',
          },
          headerTintColor: '#333',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen 
          name="Terminal" 
          component={TerminalScreen}
          options={{ title: 'Terminal' }}
        />
        <Tab.Screen 
          name="Editor" 
          component={EditorScreen}
          options={{ title: 'Code Editor' }}
        />
        <Tab.Screen 
          name="Preview" 
          component={PreviewScreen}
          options={{ title: 'Preview' }}
        />
        <Tab.Screen 
          name="Termux Demo" 
          component={TermuxDemoScreen}
          options={{ title: 'Termux Features' }}
        />
      </Tab.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}