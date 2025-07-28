import { Platform } from 'react-native';

export class CrashLogger {
  private static logs: string[] = [];
  private static maxLogs = 100;

  static log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    // Add to internal buffer
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    console.log(logEntry);

    // Platform-specific persistence
    if (Platform.OS === 'android') {
      this.persistLogAndroid(logEntry);
    }
  }

  private static persistLogAndroid(logEntry: string) {
    try {
      // Try to write to a file system location that persists across crashes
      // This will help us debug immediate crashes
      const logData = JSON.stringify({
        timestamp: Date.now(),
        entry: logEntry,
        session: 'app-startup'
      });
      
      // Use native module if available, otherwise just console
      console.warn('CRASH_LOG:', logData);
    } catch (error) {
      console.error('Failed to persist log:', error);
    }
  }

  static logAppStart() {
    this.log('🚀 App starting up', 'info');
    this.log(`Platform: ${Platform.OS} ${Platform.Version}`, 'info');
    this.log(`React Native Architecture: ${Platform.constants?.reactNativeVersion ? 'New' : 'Old'}`, 'info');
  }

  static logModuleLoad(moduleName: string) {
    this.log(`📦 Loading module: ${moduleName}`, 'info');
  }

  static logModuleError(moduleName: string, error: any) {
    this.log(`❌ Module failed: ${moduleName} - ${error?.message || error}`, 'error');
  }

  static logNavigationReady() {
    this.log('🧭 Navigation container ready', 'info');
  }

  static logScreenMount(screenName: string) {
    this.log(`📱 Screen mounted: ${screenName}`, 'info');
  }

  static logError(error: any, context?: string) {
    const message = context 
      ? `❌ Error in ${context}: ${error?.message || error}`
      : `❌ Error: ${error?.message || error}`;
    
    this.log(message, 'error');
    
    if (error?.stack) {
      this.log(`Stack trace: ${error.stack}`, 'error');
    }
  }

  static getLogs(): string[] {
    return [...this.logs];
  }

  static clearLogs() {
    this.logs = [];
  }
}

// Global error handlers
if (typeof ErrorUtils !== 'undefined') {
  const originalHandler = ErrorUtils.getGlobalHandler();
  
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    CrashLogger.logError(error, isFatal ? 'FATAL' : 'NON_FATAL');
    
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

// Unhandled promise rejections
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('unhandledrejection', (event) => {
    CrashLogger.logError(event.reason, 'UNHANDLED_PROMISE');
  });
}