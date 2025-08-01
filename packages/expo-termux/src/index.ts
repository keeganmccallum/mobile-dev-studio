// Core interfaces and types
export interface TermuxSession {
  id: string;
  pid: number;
  isRunning: boolean;
  command: string;
  cwd: string;
  title?: string;
}

export interface TermuxBootstrapInfo {
  installed: boolean;
  prefixPath: string;
  version?: string;
  size?: number;
}

export interface TermuxSessionOptions {
  command?: string;
  cwd?: string;
  environment?: Record<string, string>;
}

// Export all components and managers
export { default as TermuxTerminalView } from './TermuxTerminalView';
export { default as XTermWebTerminal } from './XTermWebTerminal';
export { default as TermuxDemo } from './TermuxDemo';
export { TermuxManager, termuxManager } from './TermuxManager';
export { RuntimeValidator } from './RuntimeValidator';
export { BridgeDebugger } from './BridgeDebugger';

// Export component interfaces
export type { TermuxTerminalViewProps, TermuxTerminalRef } from './TermuxTerminalView';
export type { XTermWebTerminalProps, XTermWebTerminalRef } from './XTermWebTerminal';

// Legacy TermuxCore class for backward compatibility
import { NativeModulesProxy } from 'expo-modules-core';
import { termuxManager } from './TermuxManager';

export class TermuxCore {
  private static get module() {
    try {
      // CRITICAL: Must match the Name() in ExpoTermuxModule.kt
      return NativeModulesProxy?.ExpoTermux;
    } catch (error) {
      console.warn('Failed to access ExpoTermux native module:', error);
      return null;
    }
  }
  
  private static isNativeModuleAvailable(): boolean {
    try {
      const mod = this.module;
      return !!mod && typeof mod === 'object';
    } catch (error) {
      console.warn('TermuxCore native module not available:', error);
      return false;
    }
  }

  static async getBootstrapInfo(): Promise<TermuxBootstrapInfo> {
    if (!this.isNativeModuleAvailable()) {
      return { installed: false, prefixPath: '' };
    }
    try {
      const module = this.module;
      return module ? await module.getBootstrapInfo() : { installed: false, prefixPath: '' };
    } catch (error) {
      return { installed: false, prefixPath: '' };
    }
  }

  static async installBootstrap(): Promise<boolean> {
    if (!this.isNativeModuleAvailable()) {
      console.warn('TermuxCore native module not available, cannot install bootstrap');
      return false;
    }
    try {
      const module = this.module;
      return module ? await module.installBootstrap() : false;
    } catch (error) {
      console.error('Failed to install bootstrap:', error);
      return false;
    }
  }

  // Delegate to TermuxManager for session management
  static async createSession(
    command: string,
    args: string[],
    cwd: string,
    env: Record<string, string>
  ): Promise<{ id: string; pid: number; fileDescriptor: number; isRunning: boolean }> {
    const sessionId = await termuxManager.createSession({
      command,
      cwd,
      environment: env
    });
    
    const session = termuxManager.getSession(sessionId);
    if (!session) {
      throw new Error('Failed to create session');
    }
    
    return {
      id: session.id,
      pid: session.pid,
      fileDescriptor: 0, // Mock for compatibility
      isRunning: session.isRunning
    };
  }

  static async writeToSession(sessionId: string, data: string): Promise<void> {
    return await termuxManager.writeToSession(sessionId, data);
  }

  static async killSession(sessionId: string): Promise<boolean> {
    return await termuxManager.killSession(sessionId);
  }

  static onSessionOutput(sessionId: string, callback: (data: string) => void): () => void {
    return termuxManager.onSessionOutput((id, lines) => {
      if (id === sessionId) {
        callback(lines.join('\n'));
      }
    });
  }

  static onSessionExit(sessionId: string, callback: (exitCode: number) => void): () => void {
    return termuxManager.onSessionExit((id, exitCode) => {
      if (id === sessionId) {
        callback(exitCode);
      }
    });
  }
}

// Default export for backward compatibility
export default TermuxCore;