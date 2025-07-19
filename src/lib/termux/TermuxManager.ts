/**
 * React Native Termux Library
 * Easy-to-use interface for Termux integration
 */

import { NativeModules, NativeEventEmitter } from 'react-native';

const { TermuxCore } = NativeModules;
const termuxEmitter = new NativeEventEmitter(TermuxCore);

export interface TermuxSessionConfig {
  command?: string;
  args?: string[];
  workingDirectory?: string;
  environment?: Record<string, string>;
  rows?: number;
  cols?: number;
}

export interface TermuxSessionInfo {
  id: string;
  pid: number;
  fileDescriptor: number;
  isRunning: boolean;
}

export class TermuxSession {
  public readonly id: string;
  public pid: number = 0;
  public isRunning: boolean = false;
  
  private dataListeners: Set<(data: string) => void> = new Set();
  private exitListeners: Set<(code: number) => void> = new Set();
  private subscription: any = null;

  constructor(id?: string) {
    this.id = id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.subscription = termuxEmitter.addListener('onSessionOutput', (event) => {
      if (event.sessionId === this.id) {
        this.dataListeners.forEach(listener => listener(event.data));
      }
    });

    termuxEmitter.addListener('onSessionExit', (event) => {
      if (event.sessionId === this.id) {
        this.isRunning = false;
        this.exitListeners.forEach(listener => listener(event.exitCode));
      }
    });
  }

  public async start(config: TermuxSessionConfig = {}): Promise<TermuxSessionInfo> {
    try {
      const defaultConfig: Required<TermuxSessionConfig> = {
        command: '/data/data/com.termux/files/usr/bin/bash',
        args: ['-l'],
        workingDirectory: '/data/data/com.termux/files/home',
        environment: {
          PATH: '/data/data/com.termux/files/usr/bin:/data/data/com.termux/files/usr/bin/applets',
          HOME: '/data/data/com.termux/files/home',
          PREFIX: '/data/data/com.termux/files/usr',
          TMPDIR: '/data/data/com.termux/files/usr/tmp',
          TERM: 'xterm-256color',
          LANG: 'en_US.UTF-8',
          USER: 'termux',
          SHELL: '/data/data/com.termux/files/usr/bin/bash'
        },
        rows: 24,
        cols: 80
      };

      const finalConfig = { ...defaultConfig, ...config };
      finalConfig.environment = { ...defaultConfig.environment, ...config.environment };

      const sessionInfo = await TermuxCore.createSession(
        this.id,
        finalConfig.command,
        finalConfig.args,
        finalConfig.workingDirectory,
        finalConfig.environment,
        finalConfig.rows,
        finalConfig.cols
      );

      this.pid = sessionInfo.pid;
      this.isRunning = sessionInfo.isRunning;

      return {
        id: this.id,
        pid: this.pid,
        fileDescriptor: sessionInfo.fileDescriptor,
        isRunning: this.isRunning
      };
    } catch (error) {
      throw new Error(`Failed to start Termux session: ${error}`);
    }
  }

  public async write(data: string): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Session is not running');
    }
    
    try {
      await TermuxCore.writeToSession(this.id, data);
    } catch (error) {
      throw new Error(`Failed to write to session: ${error}`);
    }
  }

  public async read(): Promise<string> {
    if (!this.isRunning) {
      throw new Error('Session is not running');
    }
    
    try {
      return await TermuxCore.readFromSession(this.id);
    } catch (error) {
      throw new Error(`Failed to read from session: ${error}`);
    }
  }

  public async kill(): Promise<void> {
    try {
      await TermuxCore.killSession(this.id);
      this.isRunning = false;
    } catch (error) {
      throw new Error(`Failed to kill session: ${error}`);
    }
  }

  public onData(listener: (data: string) => void): () => void {
    this.dataListeners.add(listener);
    return () => this.dataListeners.delete(listener);
  }

  public onExit(listener: (_code: number) => void): () => void {
    this.exitListeners.add(listener);
    return () => this.exitListeners.delete(listener);
  }

  public destroy(): void {
    if (this.subscription) {
      this.subscription.remove();
    }
    this.dataListeners.clear();
    this.exitListeners.clear();
  }
}

export class TermuxManager {
  private static instance: TermuxManager;
  private sessions: Map<string, TermuxSession> = new Map();
  private isBootstrapInstalled: boolean = false;

  private constructor() {}

  public static getInstance(): TermuxManager {
    if (!TermuxManager.instance) {
      TermuxManager.instance = new TermuxManager();
    }
    return TermuxManager.instance;
  }

  public async initializeBootstrap(): Promise<void> {
    try {
      const bootstrapInfo = await TermuxCore.getBootstrapInfo();
      this.isBootstrapInstalled = bootstrapInfo.isInstalled;

      if (!this.isBootstrapInstalled) {
        await TermuxCore.installBootstrap();
        this.isBootstrapInstalled = true;
      }
    } catch (error) {
      throw new Error(`Failed to initialize bootstrap: ${error}`);
    }
  }

  public async createSession(id?: string, config?: TermuxSessionConfig): Promise<TermuxSession> {
    if (!this.isBootstrapInstalled) {
      await this.initializeBootstrap();
    }

    const session = new TermuxSession(id);
    await session.start(config);
    
    this.sessions.set(session.id, session);
    return session;
  }

  public getSession(id: string): TermuxSession | undefined {
    return this.sessions.get(id);
  }

  public async executeCommand(command: string, options: {
    workingDirectory?: string;
    environment?: Record<string, string>;
    timeout?: number;
  } = {}): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const session = await this.createSession();
    
    return new Promise((resolve, reject) => {
      let stdout = '';
      const stderr = '';
      let hasExited = false;

      const timeout = options.timeout || 30000; // 30 second default timeout
      const timeoutId = setTimeout(() => {
        if (!hasExited) {
          session.kill();
          reject(new Error('Command timed out'));
        }
      }, timeout);

      session.onData((data) => {
        stdout += data;
      });

      session.onExit((code) => {
        hasExited = true;
        clearTimeout(timeoutId);
        this.sessions.delete(session.id);
        resolve({ stdout, stderr, exitCode: code });
      });

      session.write(command + '\n');
      session.write('exit\n'); // Auto-exit after command
    });
  }

  public getActiveSessions(): TermuxSession[] {
    return Array.from(this.sessions.values());
  }

  public async killAllSessions(): Promise<void> {
    const promises = Array.from(this.sessions.values()).map(session => session.kill());
    await Promise.all(promises);
    this.sessions.clear();
  }
}

// Export singleton instance
export const termuxManager = TermuxManager.getInstance();