import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import TerminalScreen from './src/screens/TerminalScreen';
import PreviewScreen from './src/screens/PreviewScreen';
import EditorScreen from './src/screens/EditorScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap;

              if (route.name === 'Terminal') {
                iconName = focused ? 'terminal' : 'terminal-outline';
              } else if (route.name === 'Preview') {
                iconName = focused ? 'phone-portrait' : 'phone-portrait-outline';
              } else if (route.name === 'Editor') {
                iconName = focused ? 'code-slash' : 'code-slash-outline';
              } else {
                iconName = 'help-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#0969da',
            tabBarInactiveTintColor: '#7d8590',
            tabBarStyle: {
              backgroundColor: '#161b22',
              borderTopColor: '#21262d',
              borderTopWidth: 1,
              paddingBottom: 4,
              paddingTop: 4,
              height: 60,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
            },
            headerShown: false,
            tabBarHideOnKeyboard: true,
          })}
        >
          <Tab.Screen 
            name="Terminal" 
            component={TerminalScreen}
            options={{
              tabBarLabel: 'Terminal',
              tabBarBadge: undefined, // Could show server status
            }}
          />
          <Tab.Screen 
            name="Preview" 
            component={PreviewScreen}
            options={{
              tabBarLabel: 'Preview',
              tabBarBadge: undefined, // Could show test results
            }}
          />
          <Tab.Screen 
            name="Editor" 
            component={EditorScreen}
            options={{
              tabBarLabel: 'Editor',
              tabBarBadge: undefined, // Could show unsaved changes
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="light" backgroundColor="#0d1117" />
    </SafeAreaProvider>
  );
}