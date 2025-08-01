import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { CrashLogger } from './src/utils/CrashLogger';
import { RuntimeValidator, BridgeDebugger } from '@keeganmccallum/expo-termux';

import TerminalScreen from './src/screens/TerminalScreen';
import EditorScreen from './src/screens/EditorScreen';
import PreviewScreen from './src/screens/PreviewScreen';
import TermuxDemoScreen from './src/screens/TermuxDemoScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  useEffect(() => {
    CrashLogger.logAppStart();
    
    // CRITICAL: Debug React Native bridge registration
    BridgeDebugger.logModuleLoadAttempt();
    BridgeDebugger.debugBridgeRegistration();
    BridgeDebugger.testBridgeConnectivity();
    
    // CRITICAL: Validate native modules immediately on startup
    RuntimeValidator.validateOnStartup();
    
    try {
      CrashLogger.logModuleLoad('@react-navigation/native');
      CrashLogger.logModuleLoad('@expo/vector-icons');
      CrashLogger.logModuleLoad('expo-status-bar');
      
      // Test TermuxCore functionality after a brief delay
      setTimeout(async () => {
        const isWorking = await RuntimeValidator.testBasicFunctionality();
        CrashLogger.logInfo(`TermuxCore functionality test: ${isWorking ? 'PASSED' : 'FAILED'}`);
      }, 1000);
      
    } catch (error) {
      CrashLogger.logError(error, 'Module loading');
    }
  }, []);

  const handleNavigationReady = () => {
    CrashLogger.logNavigationReady();
  };

  const handleNavigationStateChange = (state: any) => {
    try {
      const currentRoute = state?.routes?.[state?.index];
      if (currentRoute) {
        CrashLogger.logScreenMount(currentRoute.name);
      }
    } catch (error) {
      CrashLogger.logError(error, 'Navigation state change');
    }
  };

  return (
    <NavigationContainer 
      onReady={handleNavigationReady}
      onStateChange={handleNavigationStateChange}
    >
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