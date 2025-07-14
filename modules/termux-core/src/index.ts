import { NativeModulesProxy } from 'expo-modules-core';

export interface TermuxSession {
  id: string;
  pid: number;
  fileDescriptor: number;
  isRunning: boolean;
}

export interface TermuxBootstrapInfo {
  installed: boolean;
  prefixPath: string;
  version?: string;
  size?: number;
}

// Simple static class for native module access
export class TermuxCore {
  private static module = NativeModulesProxy.TermuxCore;

  static async getBootstrapInfo(): Promise<TermuxBootstrapInfo> {
    try {
      return await this.module.getBootstrapInfo();
    } catch (error) {
      return { installed: false, prefixPath: '' };
    }
  }

  static async installBootstrap(): Promise<boolean> {
    try {
      return await this.module.installBootstrap();
    } catch (error) {
      console.error('Failed to install bootstrap:', error);
      return false;
    }
  }

  static async createSession(
    command: string,
    args: string[],
    cwd: string,
    env: Record<string, string>
  ): Promise<TermuxSession> {
    return await this.module.createSession(command, args, cwd, env, 24, 80);
  }

  static async writeToSession(sessionId: string, data: string): Promise<void> {
    return await this.module.writeToSession(sessionId, data);
  }

  static async killSession(sessionId: string): Promise<boolean> {
    return await this.module.killSession(sessionId);
  }

  // Simple callback-based event handlers
  static onSessionOutput(sessionId: string, callback: (data: string) => void): void {
    // This would be implemented via native events in a real implementation
    // For now, we'll implement basic polling or use a different approach
  }

  static onSessionExit(sessionId: string, callback: (exitCode: number) => void): void {
    // This would be implemented via native events in a real implementation  
  }
}

export { default as TermuxTerminalView } from './TermuxTerminalView';
export default TermuxCore;