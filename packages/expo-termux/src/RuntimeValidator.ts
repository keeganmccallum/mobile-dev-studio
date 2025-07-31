import { NativeModules, NativeEventEmitter } from 'react-native';
import { NativeModulesProxy } from 'expo-modules-core';

/**
 * Runtime validation that logs immediately on app startup
 * This helps identify native module issues in APK validation logs
 */
export class RuntimeValidator {
  static validateOnStartup(): void {
    console.log('🔍 TERMUX RUNTIME VALIDATION - STARTUP CHECK');
    console.log('='.repeat(50));
    
    const startTime = Date.now();
    
    try {
      // Check NativeModules
      const nativeModuleKeys = Object.keys(NativeModules || {});
      console.log(`📱 NativeModules available (${nativeModuleKeys.length}):`, nativeModuleKeys.slice(0, 10).join(', '), nativeModuleKeys.length > 10 ? '...' : '');
      
      // Check NativeModulesProxy
      const proxyKeys = Object.keys(NativeModulesProxy || {});
      console.log(`🔧 NativeModulesProxy available (${proxyKeys.length}):`, proxyKeys.slice(0, 10).join(', '), proxyKeys.length > 10 ? '...' : '');
      
      // Specifically check for TermuxCore
      const termuxInNative = NativeModules?.TermuxCore;
      const termuxInProxy = NativeModulesProxy?.TermuxCore;
      
      if (termuxInNative) {
        console.log('✅ TermuxCore found in NativeModules');
        console.log('📋 Available methods:', Object.keys(termuxInNative).join(', '));
        
        // Test EventEmitter creation
        try {
          const emitter = new NativeEventEmitter(termuxInNative);
          console.log('✅ EventEmitter created successfully');
        } catch (e) {
          console.log('❌ EventEmitter creation failed:', e);
        }
        
      } else if (termuxInProxy) {
        console.log('✅ TermuxCore found in NativeModulesProxy');
        console.log('📋 Available methods:', Object.keys(termuxInProxy).join(', '));
        
        // Test EventEmitter creation
        try {
          const emitter = new NativeEventEmitter(termuxInProxy as any);
          console.log('✅ EventEmitter created successfully');
        } catch (e) {
          console.log('❌ EventEmitter creation failed:', e);
        }
        
      } else {
        console.log('❌ TermuxCore NOT FOUND in either NativeModules or NativeModulesProxy');
        
        // Look for similar names
        const allKeys = [...nativeModuleKeys, ...proxyKeys];
        const similarNames = allKeys.filter(key => 
          key.toLowerCase().includes('termux') || 
          key.toLowerCase().includes('core') ||
          key.includes('Termux') ||
          key.includes('Core')
        );
        
        if (similarNames.length > 0) {
          console.log('🔍 Similar module names found:', similarNames.join(', '));
        }
        
        // List Expo modules specifically
        const expoModules = allKeys.filter(key => key.toLowerCase().includes('expo'));
        console.log('📱 Expo modules found:', expoModules.join(', '));
        
        // This is the critical error that APK validation should catch
        console.log('🚨 CRITICAL: Native module linking failed - TermuxCore not available');
      }
      
      const duration = Date.now() - startTime;
      console.log(`⏱️ Validation completed in ${duration}ms`);
      console.log('='.repeat(50));
      
    } catch (error) {
      console.log('💥 Runtime validation crashed:', error);
      console.log('='.repeat(50));
    }
  }
  
  static async testBasicFunctionality(): Promise<boolean> {
    console.log('🧪 Testing basic TermuxCore functionality...');
    
    try {
      const termuxCore = NativeModulesProxy?.TermuxCore || NativeModules?.TermuxCore;
      
      if (!termuxCore) {
        console.log('❌ Cannot test - TermuxCore not available');
        return false;
      }
      
      // Test a simple method call
      if (termuxCore.getBootstrapInfo) {
        try {
          const result = await termuxCore.getBootstrapInfo();
          console.log('✅ getBootstrapInfo() successful:', result);
          return true;
        } catch (e) {
          console.log('❌ getBootstrapInfo() failed:', e);
          return false;
        }
      } else {
        console.log('❌ getBootstrapInfo method not found');
        return false;
      }
      
    } catch (error) {
      console.log('💥 Functionality test crashed:', error);
      return false;
    }
  }
}