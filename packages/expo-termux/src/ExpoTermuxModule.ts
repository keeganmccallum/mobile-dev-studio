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
  
  // Real Termux session management
  createSession(command?: string, cwd?: string, environment?: Record<string, any>): Promise<string>;
  getSession(sessionId: string): TermuxSessionInfo | null;
  writeToSession(sessionId: string, data: string): Promise<void>;
  readFromSession(sessionId: string): string;
  killSession(sessionId: string): Promise<void>;
}

// This call loads the native module object from the JSI
export default requireNativeModule<ExpoTermuxModule>('ExpoTermux');