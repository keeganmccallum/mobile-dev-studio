import { NativeModules, NativeEventEmitter } from 'react-native';
import { NativeModulesProxy } from 'expo-modules-core';

/**
 * Bridge-specific debugging to understand runtime module registration
 */
export class BridgeDebugger {
  static debugBridgeRegistration(): void {
    console.log('🔍 REACT NATIVE BRIDGE DEBUG');
    console.log('='.repeat(40));
    
    // 1. Check what's actually registered in the bridge
    console.log('📱 NativeModules keys:', Object.keys(NativeModules || {}).sort());
    console.log('🔧 NativeModulesProxy keys:', Object.keys(NativeModulesProxy || {}).sort());
    
    // 2. Look for any Termux-related modules
    const allKeys = [...Object.keys(NativeModules || {}), ...Object.keys(NativeModulesProxy || {})];
    const termuxKeys = allKeys.filter(key => 
      key.toLowerCase().includes('termux') || 
      key.toLowerCase().includes('core') ||
      key.includes('Termux') ||
      key.includes('Core')
    );
    console.log('🔍 Termux-related keys found:', termuxKeys);
    
    // 3. Check different access patterns
    const accessPatterns = [
      { name: 'NativeModules.TermuxCore', value: NativeModules?.TermuxCore },
      { name: 'NativeModulesProxy.TermuxCore', value: NativeModulesProxy?.TermuxCore },
      { name: 'NativeModules.ExpoTermuxCore', value: NativeModules?.ExpoTermuxCore },
      { name: 'NativeModulesProxy.ExpoTermuxCore', value: NativeModulesProxy?.ExpoTermuxCore },
      { name: 'NativeModules.expo_modules_termuxcore_TermuxCoreModule', value: NativeModules?.expo_modules_termuxcore_TermuxCoreModule },
    ];
    
    console.log('🧪 Testing access patterns:');
    accessPatterns.forEach(pattern => {
      if (pattern.value) {
        console.log(`✅ ${pattern.name}:`, typeof pattern.value, Object.keys(pattern.value));
      } else {
        console.log(`❌ ${pattern.name}: undefined`);
      }
    });
    
    // 4. Check Expo modules registry specifically
    try {
      // @ts-ignore - accessing internal Expo registry
      const ExpoModulesCore = require('expo-modules-core');
      console.log('📋 Expo modules core available:', !!ExpoModulesCore);
      
      // Check if there's a registry we can inspect
      if (ExpoModulesCore.NativeModulesProxy) {
        console.log('🏪 NativeModulesProxy from core:', Object.keys(ExpoModulesCore.NativeModulesProxy).sort());
      }
    } catch (e) {
      console.log('❌ Could not access Expo modules core:', e.message);
    }
    
    // 5. Try to find the module by brute force
    console.log('🔍 Brute force search for TermuxCore methods...');
    const allModules = { ...NativeModules, ...NativeModulesProxy };
    
    Object.entries(allModules).forEach(([key, module]) => {
      if (module && typeof module === 'object') {
        const methods = Object.keys(module);
        if (methods.some(method => method.includes('Bootstrap') || method.includes('Session'))) {
          console.log(`🎯 POTENTIAL MATCH - ${key}:`, methods);
        }
        // Also check for any module with "getBootstrapInfo" specifically
        if (methods.includes('getBootstrapInfo')) {
          console.log(`🚀 FOUND getBootstrapInfo in ${key}:`, methods);
        }
      }
    });
    
    // 6. Try different naming conventions that Expo might use
    const possibleNames = [
      'TermuxCore',
      'ExpoTermuxCore', 
      'expo_modules_termuxcore_TermuxCoreModule',
      'ExpoModulesTermuxcoreTermuxCoreModule',
      'TermuxCoreModule',
      '@keeganmccallum/expo-termux',
      'expo-termux',
      'termux-core'
    ];
    
    console.log('🧪 Testing possible module names:');
    possibleNames.forEach(name => {
      const inNative = NativeModules[name];
      const inProxy = NativeModulesProxy[name];
      if (inNative) {
        console.log(`✅ Found in NativeModules['${name}']:`, Object.keys(inNative));
      }
      if (inProxy) {
        console.log(`✅ Found in NativeModulesProxy['${name}']:`, Object.keys(inProxy));
      }
    });
    
    console.log('='.repeat(40));
  }
  
  static testBridgeConnectivity(): void {
    console.log('🧪 BRIDGE CONNECTIVITY TEST');
    console.log('='.repeat(30));
    
    try {
      // Test if we can create native event emitters at all
      const testModules = ['DeviceEventEmitter', 'RCTDeviceEventEmitter'];
      testModules.forEach(moduleName => {
        try {
          if (NativeModules[moduleName]) {
            const emitter = new NativeEventEmitter(NativeModules[moduleName]);
            console.log(`✅ Can create emitter for ${moduleName}`);
          }
        } catch (e) {
          console.log(`❌ Failed to create emitter for ${moduleName}:`, e.message);
        }
      });
      
      // Test basic React Native functionality
      console.log('📱 Platform module available:', !!NativeModules.PlatformConstants);
      console.log('🔧 DeviceInfo available:', !!NativeModules.RNDeviceInfo);
      
    } catch (e) {
      console.log('💥 Bridge connectivity test failed:', e);
    }
    
    console.log('='.repeat(30));
  }
  
  static logModuleLoadAttempt(): void {
    console.log('🚀 ATTEMPTING TO LOAD TERMUX MODULE');
    console.log('='.repeat(35));
    
    const attempts = [
      () => NativeModules.TermuxCore,
      () => NativeModulesProxy.TermuxCore,
      () => require('react-native').NativeModules.TermuxCore,
      () => {
        const { NativeModulesProxy } = require('expo-modules-core');
        return NativeModulesProxy.TermuxCore;
      }
    ];
    
    attempts.forEach((attempt, index) => {
      try {
        const result = attempt();
        if (result) {
          console.log(`✅ Attempt ${index + 1} SUCCESS:`, Object.keys(result));
          console.log(`   Module type:`, typeof result);
          console.log(`   Constructor:`, result.constructor?.name);
        } else {
          console.log(`❌ Attempt ${index + 1}: undefined`);
        }
      } catch (e) {
        console.log(`💥 Attempt ${index + 1} CRASHED:`, e.message);
      }
    });
    
    console.log('='.repeat(35));
  }
}