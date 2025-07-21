declare module 'termux-core' {
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

  export interface TermuxTerminalViewProps {
    sessionId?: string;
    onSessionCreated?: (sessionId: string) => void;
    onOutput?: (data: string) => void;
    style?: any;
  }

  export interface TermuxTerminalRef {
    writeToSession: (data: string) => Promise<void>;
    clear: () => void;
    focus: () => void;
  }

  export class TermuxCore {
    static getBootstrapInfo(): Promise<TermuxBootstrapInfo>;
    static installBootstrap(): Promise<boolean>;
    static createSession(
      command: string,
      args: string[],
      cwd: string,
      env: Record<string, string>
    ): Promise<{ id: string; pid: number; fileDescriptor: number; isRunning: boolean }>;
    static writeToSession(sessionId: string, data: string): Promise<void>;
    static killSession(sessionId: string): Promise<boolean>;
    static onSessionOutput(sessionId: string, callback: (data: string) => void): () => void;
    static onSessionExit(sessionId: string, callback: (exitCode: number) => void): () => void;
  }

  export const TermuxTerminalView: React.ComponentType<TermuxTerminalViewProps>;
  export const termuxManager: any;
  export default TermuxCore;
}