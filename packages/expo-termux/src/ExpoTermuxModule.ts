import { requireNativeModule, NativeModule } from 'expo-modules-core';

export interface TermuxSessionInfo {
  sessionId: string;
  pid: number;
  isRunning: boolean;
  exitCode: number;
}

export interface TermuxSessionOptions {
  command?: string;
  cwd?: string;
  environment?: Record<string, string>;
}

declare class ExpoTermuxModule extends NativeModule {
  // Test functions
  test(): string;
  testAsync(): Promise<string>;
  
  // Bootstrap management
  getBootstrapInfo(): Promise<any>;
  installBootstrap(): Promise<boolean>;
  
  // Real Termux session management
  createSession(command?: string, cwd?: string, environment?: Record<string, any>): Promise<TermuxSessionInfo>;
  getSession(sessionId: string): TermuxSessionInfo | null;
  writeToSession(sessionId: string, data: string): Promise<void>;
  readFromSession(sessionId: string): string;
  killSession(sessionId: string): Promise<boolean>;
}

// This call loads the native module object from the JSI
export default requireNativeModule<ExpoTermuxModule>('ExpoTermux');