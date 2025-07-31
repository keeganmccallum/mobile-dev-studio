import { NativeModules, NativeEventEmitter } from 'react-native';
import { NativeModulesProxy } from 'expo-modules-core';

export interface TermuxSession {
  id: string;
  pid: number;
  isRunning: boolean;
  command: string;
  cwd: string;
  title?: string;
}

export interface TermuxSessionOptions {
  command?: string;
  cwd?: string;
  environment?: Record<string, string>;
}

export class TermuxManager {
  private sessions = new Map<string, TermuxSession>();
  private eventEmitter: NativeEventEmitter | null = null;
  private static instance: TermuxManager | null = null;
  private outputCallbacks: Array<(sessionId: string, lines: string[]) => void> = [];
  private exitCallbacks: Array<(sessionId: string, exitCode: number) => void> = [];

  private getTermuxCore() {
    // CRITICAL: Must match the Name() in ExpoTermuxModule.kt
    return NativeModulesProxy?.ExpoTermux || NativeModules.ExpoTermux || null;
  }

  constructor() {
    // Initialize event emitter for session events
    const TermuxCore = this.getTermuxCore();
    if (TermuxCore) {
      // Cast to any to handle type differences between NativeModule and ProxyNativeModule
      this.eventEmitter = new NativeEventEmitter(TermuxCore as any);
      this.setupEventListeners();
      console.log('[TermuxManager] Native module found and initialized');
    } else {
      console.warn('[TermuxManager] Native module not available - using fallback');
    }
  }

  static getInstance(): TermuxManager {
    if (!TermuxManager.instance) {
      TermuxManager.instance = new TermuxManager();
    }
    return TermuxManager.instance;
  }

  private setupEventListeners() {
    if (!this.eventEmitter) return;

    this.eventEmitter.addListener('onSessionOutput', (event: any) => {
      // Handle session output and forward to listeners
      console.log('Session output:', event);
      this.outputCallbacks.forEach(callback => {
        try {
          const lines = event.data ? event.data.split('\n').filter((line: string) => line.length > 0) : [];
          callback(event.sessionId, lines);
        } catch (error) {
          console.error('Error in output callback:', error);
        }
      });
    });

    this.eventEmitter.addListener('onSessionExit', (event: any) => {
      // Handle session exit
      const session = this.sessions.get(event.sessionId);
      if (session) {
        session.isRunning = false;
        console.log(`Session ${event.sessionId} exited with code ${event.exitCode}`);
      }
      
      // Forward to listeners
      this.exitCallbacks.forEach(callback => {
        try {
          callback(event.sessionId, event.exitCode || 0);
        } catch (error) {
          console.error('Error in exit callback:', error);
        }
      });
    });

    this.eventEmitter.addListener('onTitleChanged', (event: any) => {
      // Handle title change
      const session = this.sessions.get(event.sessionId);
      if (session) {
        session.title = event.title;
        console.log(`Session ${event.sessionId} title changed to: ${event.title}`);
      }
    });
  }

  async createSession(options: TermuxSessionOptions = {}): Promise<string> {
    try {
      if (!this.getTermuxCore()) {
        throw new Error('TermuxCore native module not available');
      }

      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const defaultOptions = {
        command: '/data/data/com.termux/files/usr/bin/bash',
        cwd: '/data/data/com.termux/files/home',
        environment: {
          PATH: '/data/data/com.termux/files/usr/bin:/data/data/com.termux/files/usr/bin/applets',
          HOME: '/data/data/com.termux/files/home',
          PREFIX: '/data/data/com.termux/files/usr',
          TMPDIR: '/data/data/com.termux/files/usr/tmp',
          SHELL: '/data/data/com.termux/files/usr/bin/bash',
          TERM: 'xterm-256color',
          LANG: 'en_US.UTF-8',
          ...options.environment
        }
      };

      // Call native module to create session
      const command = options.command || defaultOptions.command;
      const cwd = options.cwd || defaultOptions.cwd;
      const env = defaultOptions.environment;
      
      const result = await this.getTermuxCore()!.createSession(
        sessionId,
        command,
        [], // args
        cwd,
        env,
        24, // rows
        80  // cols
      );

      const session: TermuxSession = {
        id: sessionId,
        pid: result.pid,
        isRunning: result.isRunning,
        command: command,
        cwd: cwd,
        title: 'Terminal'
      };

      this.sessions.set(sessionId, session);
      
      console.log(`Created terminal session: ${sessionId} (PID: ${result.pid})`);
      return sessionId;
      
    } catch (error) {
      console.error('Failed to create terminal session:', error);
      throw error;
    }
  }

  async writeToSession(sessionId: string, data: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (!session.isRunning) {
      throw new Error(`Session ${sessionId} is not running`);
    }

    try {
      if (!this.getTermuxCore()) {
        throw new Error('TermuxCore native module not available');
      }
      
      console.log(`Writing to session ${sessionId}:`, data);
      await this.getTermuxCore()!.writeToSession(sessionId, data);
      
    } catch (error) {
      console.error(`Failed to write to session ${sessionId}:`, error);
      throw error;
    }
  }

  async killSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    try {
      if (!this.getTermuxCore()) {
        throw new Error('TermuxCore native module not available');
      }
      
      const result = await this.getTermuxCore()!.killSession(sessionId);
      
      if (result) {
        session.isRunning = false;
        console.log(`Killed session: ${sessionId}`);
      }
      
      return result;
      
    } catch (error) {
      console.error(`Failed to kill session ${sessionId}:`, error);
      return false;
    }
  }

  getSession(sessionId: string): TermuxSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): TermuxSession[] {
    return Array.from(this.sessions.values());
  }

  getActiveSessions(): TermuxSession[] {
    return this.getAllSessions().filter(session => session.isRunning);
  }

  async executeCommand(
    command: string, 
    options: TermuxSessionOptions = {}
  ): Promise<{ sessionId: string; output: string; stdout: string }> {
    const sessionId = await this.createSession(options);
    
    try {
      await this.writeToSession(sessionId, command + '\n');
      
      // Wait for command completion and collect output
      return new Promise((resolve, reject) => {
        let output = '';
        const timeout = setTimeout(() => {
          this.killSession(sessionId);
          reject(new Error('Command execution timeout'));
        }, 10000);

        const outputListener = this.onSessionOutput((sid, lines) => {
          if (sid === sessionId) {
            output += lines.join('\n') + '\n';
          }
        });

        const exitListener = this.onSessionExit((sid, exitCode) => {
          if (sid === sessionId) {
            clearTimeout(timeout);
            outputListener();
            exitListener();
            
            resolve({
              sessionId,
              output,
              stdout: output
            });
          }
        });
      });
      
    } catch (error) {
      await this.killSession(sessionId);
      throw error;
    }
  }

  // Event subscription methods
  onSessionOutput(callback: (sessionId: string, lines: string[]) => void): () => void {
    this.outputCallbacks.push(callback);
    
    return () => {
      const index = this.outputCallbacks.indexOf(callback);
      if (index > -1) {
        this.outputCallbacks.splice(index, 1);
      }
    };
  }

  onSessionExit(callback: (sessionId: string, exitCode: number) => void): () => void {
    this.exitCallbacks.push(callback);
    
    return () => {
      const index = this.exitCallbacks.indexOf(callback);
      if (index > -1) {
        this.exitCallbacks.splice(index, 1);
      }
    };
  }

  onTitleChanged(callback: (sessionId: string, title: string) => void): () => void {
    if (!this.eventEmitter) {
      return () => {};
    }

    const subscription = this.eventEmitter.addListener('onTitleChanged', (event) => {
      callback(event.sessionId, event.title);
    });

    return () => subscription.remove();
  }
}

// Export singleton instance
export const termuxManager = TermuxManager.getInstance();
export default TermuxManager;