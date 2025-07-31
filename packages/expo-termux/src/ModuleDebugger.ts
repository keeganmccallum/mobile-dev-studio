import { NativeModules, NativeEventEmitter } from 'react-native';
import { NativeModulesProxy } from 'expo-modules-core';

/**
 * Comprehensive native module debugging utility
 * Provides detailed diagnostics about module registration and availability
 */
export class ModuleDebugger {
  static debugNativeModules(): {
    available: string[];
    termuxCoreFound: boolean;
    termuxCoreLocation: 'NativeModules' | 'NativeModulesProxy' | 'none';
    termuxCoreValue: any;
    allModuleKeys: string[];
    proxyKeys: string[];
    diagnostics: string[];
  } {
    const diagnostics: string[] = [];
    const available: string[] = [];
    
    // Check NativeModules
    const nativeModuleKeys = Object.keys(NativeModules || {});
    diagnostics.push(`NativeModules keys (${nativeModuleKeys.length}): ${nativeModuleKeys.join(', ')}`);
    
    // Check NativeModulesProxy
    const proxyKeys = Object.keys(NativeModulesProxy || {});
    diagnostics.push(`NativeModulesProxy keys (${proxyKeys.length}): ${proxyKeys.join(', ')}`);
    
    // Look for TermuxCore specifically
    const termuxInNative = NativeModules?.TermuxCore;
    const termuxInProxy = NativeModulesProxy?.TermuxCore;
    
    let termuxCoreFound = false;
    let termuxCoreLocation: 'NativeModules' | 'NativeModulesProxy' | 'none' = 'none';
    let termuxCoreValue: any = null;
    
    if (termuxInNative) {
      termuxCoreFound = true;
      termuxCoreLocation = 'NativeModules';
      termuxCoreValue = termuxInNative;
      diagnostics.push(`✅ TermuxCore found in NativeModules`);
      diagnostics.push(`TermuxCore methods: ${Object.keys(termuxInNative).join(', ')}`);
    }
    
    if (termuxInProxy) {
      termuxCoreFound = true;
      termuxCoreLocation = 'NativeModulesProxy';
      termuxCoreValue = termuxInProxy;
      diagnostics.push(`✅ TermuxCore found in NativeModulesProxy`);
      diagnostics.push(`TermuxCore methods: ${Object.keys(termuxInProxy).join(', ')}`);
    }
    
    if (!termuxCoreFound) {
      diagnostics.push(`❌ TermuxCore NOT FOUND in either location`);
      
      // Look for similar names
      const similarNames = [...nativeModuleKeys, ...proxyKeys].filter(key => 
        key.toLowerCase().includes('termux') || 
        key.toLowerCase().includes('core') ||
        key.includes('Termux') ||
        key.includes('Core')
      );
      
      if (similarNames.length > 0) {
        diagnostics.push(`🔍 Similar module names found: ${similarNames.join(', ')}`);
      }
      
      // Check for expo modules specifically
      const expoModules = [...nativeModuleKeys, ...proxyKeys].filter(key => 
        key.toLowerCase().includes('expo')
      );
      diagnostics.push(`📱 Expo modules found: ${expoModules.join(', ')}`);
    }
    
    return {
      available: [...nativeModuleKeys, ...proxyKeys],
      termuxCoreFound,
      termuxCoreLocation,
      termuxCoreValue,
      allModuleKeys: nativeModuleKeys,
      proxyKeys,
      diagnostics
    };
  }
  
  static async testModuleInitialization(): Promise<{
    canCreateEventEmitter: boolean;
    hasExpectedMethods: boolean;
    canCallMethod: boolean;
    methodResults: Record<string, any>;
    errors: string[];
  }> {
    const errors: string[] = [];
    let canCreateEventEmitter = false;
    let hasExpectedMethods = false;
    let canCallMethod = false;
    const methodResults: Record<string, any> = {};
    
    try {
      const debug = this.debugNativeModules();
      
      if (!debug.termuxCoreFound) {
        errors.push('TermuxCore module not found');
        return { canCreateEventEmitter, hasExpectedMethods, canCallMethod, methodResults, errors };
      }
      
      const termuxCore = debug.termuxCoreValue;
      
      // Test EventEmitter creation
      try {
        const emitter = new NativeEventEmitter(termuxCore);
        canCreateEventEmitter = true;
      } catch (e) {
        errors.push(`EventEmitter creation failed: ${e}`);
      }
      
      // Check for expected methods
      const expectedMethods = ['getBootstrapInfo', 'createSession', 'writeToSession', 'killSession'];
      const availableMethods = Object.keys(termuxCore);
      const foundMethods = expectedMethods.filter(method => availableMethods.includes(method));
      
      hasExpectedMethods = foundMethods.length === expectedMethods.length;
      if (!hasExpectedMethods) {
        const missingMethods = expectedMethods.filter(method => !availableMethods.includes(method));
        errors.push(`Missing methods: ${missingMethods.join(', ')}`);
      }
      
      // Test a simple method call
      if (termuxCore.getBootstrapInfo) {
        try {
          const result = await termuxCore.getBootstrapInfo();
          methodResults.getBootstrapInfo = result;
          canCallMethod = true;
        } catch (e) {
          errors.push(`getBootstrapInfo failed: ${e}`);
        }
      }
      
    } catch (e) {
      errors.push(`Module initialization test failed: ${e}`);
    }
    
    return { canCreateEventEmitter, hasExpectedMethods, canCallMethod, methodResults, errors };
  }
  
  static logFullDiagnostics(): void {
    console.log('='.repeat(60));
    console.log('🔍 TERMUX NATIVE MODULE DIAGNOSTICS');
    console.log('='.repeat(60));
    
    const debug = this.debugNativeModules();
    debug.diagnostics.forEach(msg => console.log(msg));
    
    console.log('\n' + '-'.repeat(40));
    console.log('📊 SUMMARY');
    console.log('-'.repeat(40));
    console.log(`TermuxCore Found: ${debug.termuxCoreFound ? '✅' : '❌'}`);
    console.log(`Location: ${debug.termuxCoreLocation}`);
    console.log(`Total Native Modules: ${debug.allModuleKeys.length}`);
    console.log(`Total Proxy Modules: ${debug.proxyKeys.length}`);
    
    // Run async test
    this.testModuleInitialization().then(testResults => {
      console.log('\n' + '-'.repeat(40));
      console.log('🧪 MODULE FUNCTIONALITY TEST');
      console.log('-'.repeat(40));
      console.log(`Can Create EventEmitter: ${testResults.canCreateEventEmitter ? '✅' : '❌'}`);
      console.log(`Has Expected Methods: ${testResults.hasExpectedMethods ? '✅' : '❌'}`);
      console.log(`Can Call Methods: ${testResults.canCallMethod ? '✅' : '❌'}`);
      
      if (testResults.errors.length > 0) {
        console.log('\n❌ ERRORS:');
        testResults.errors.forEach(error => console.log(`  - ${error}`));
      }
      
      if (Object.keys(testResults.methodResults).length > 0) {
        console.log('\n📋 METHOD RESULTS:');
        Object.entries(testResults.methodResults).forEach(([method, result]) => {
          console.log(`  ${method}:`, result);
        });
      }
      
      console.log('='.repeat(60));
    });
  }
}