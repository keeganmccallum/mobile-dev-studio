import { NativeModulesProxy } from 'expo-modules-core';

// Fallback implementation for when native modules aren't available
const FallbackTermuxCore = {
  async getBootstrapInfo() {
    console.log('[TermuxCore] Using fallback implementation - native modules not available');
    return {
      installed: false,
      prefixPath: '/data/data/com.termux/files/usr',
      version: 'fallback-v1.0.0',
      size: 0
    };
  },
  
  async installBootstrap(): Promise<boolean> {
    console.log('[TermuxCore] Mock bootstrap installation - would install native Termux environment');
    return true;  // Simulate successful installation
  },
  
  async createSession(
    command: string,
    args: string[],
    cwd: string,
    env: Record<string, string>,
    rows: number,
    cols: number
  ) {
    console.log('[TermuxCore] Mock session creation:', { command, args, cwd, rows, cols });
    return {
      id: `mock-session-${Date.now()}`,
      pid: Math.floor(Math.random() * 10000),
      fileDescriptor: 1,
      isRunning: true
    };
  },
  
  async writeToSession(sessionId: string, data: string): Promise<void> {
    console.log(`[TermuxCore] Mock write to session ${sessionId}:`, data);
  },
  
  async killSession(sessionId: string): Promise<boolean> {
    console.log(`[TermuxCore] Mock kill session ${sessionId}`);
    return true;
  }
};

// Try to use native module, fall back to mock implementation
let TermuxCoreModule;
try {
  TermuxCoreModule = NativeModulesProxy.TermuxCore;
  if (!TermuxCoreModule) {
    throw new Error('Native module not available');
  }
} catch (error) {
  console.warn('[TermuxCore] Native module not available, using fallback implementation');
  TermuxCoreModule = FallbackTermuxCore;
}

export default TermuxCoreModule as {
  getBootstrapInfo(): Promise<{
    installed: boolean;
    prefixPath: string;
    version?: string;
    size?: number;
  }>;
  installBootstrap(): Promise<boolean>;
  createSession(
    command: string,
    args: string[],
    cwd: string,
    env: Record<string, string>,
    rows: number,
    cols: number
  ): Promise<{
    id: string;
    pid: number;
    fileDescriptor: number;
    isRunning: boolean;
  }>;
  writeToSession(sessionId: string, data: string): Promise<void>;
  killSession(sessionId: string): Promise<boolean>;
};