import { NativeModules, NativeEventEmitter } from 'react-native';

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

  constructor() {
    // Initialize event emitter for session events
    if (NativeModules.TermuxCore) {
      this.eventEmitter = new NativeEventEmitter(NativeModules.TermuxCore);
      this.setupEventListeners();
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
      // Handle session output
      console.log('Session output:', event);
    });

    this.eventEmitter.addListener('onSessionExit', (event: any) => {
      // Handle session exit
      const session = this.sessions.get(event.sessionId);
      if (session) {
        session.isRunning = false;
        console.log(`Session ${event.sessionId} exited with code ${event.exitCode}`);
      }
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

      // For now, we'll create a mock session since we need the native module to be properly configured
      const session: TermuxSession = {
        id: sessionId,
        pid: Math.floor(Math.random() * 10000) + 1000, // Mock PID
        isRunning: true,
        command: options.command || defaultOptions.command,
        cwd: options.cwd || defaultOptions.cwd,
        title: 'Terminal'
      };

      this.sessions.set(sessionId, session);
      
      console.log(`Created terminal session: ${sessionId}`);
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
      // For now, just log the data since we need proper native integration
      console.log(`Writing to session ${sessionId}:`, data);
      
      // In a real implementation, this would call the native module
      // await NativeModules.TermuxCore.writeToSession(sessionId, data);
      
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
      // In a real implementation, this would call the native module
      // await NativeModules.TermuxCore.killSession(sessionId);
      
      session.isRunning = false;
      console.log(`Killed session: ${sessionId}`);
      return true;
      
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
  ): Promise<{ sessionId: string; output: string }> {
    const sessionId = await this.createSession(options);
    
    try {
      await this.writeToSession(sessionId, command + '\n');
      
      // In a real implementation, we would wait for command completion
      // and return the actual output. For now, return a mock response.
      return {
        sessionId,
        output: `Executed: ${command}\n`
      };
      
    } catch (error) {
      await this.killSession(sessionId);
      throw error;
    }
  }

  // Event subscription methods
  onSessionOutput(callback: (sessionId: string, lines: string[]) => void): () => void {
    if (!this.eventEmitter) {
      return () => {};
    }

    const subscription = this.eventEmitter.addListener('onSessionOutput', (event) => {
      callback(event.sessionId, event.lines);
    });

    return () => subscription.remove();
  }

  onSessionExit(callback: (sessionId: string, exitCode: number) => void): () => void {
    if (!this.eventEmitter) {
      return () => {};
    }

    const subscription = this.eventEmitter.addListener('onSessionExit', (event) => {
      callback(event.sessionId, event.exitCode);
    });

    return () => subscription.remove();
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