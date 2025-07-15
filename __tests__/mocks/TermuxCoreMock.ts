/**
 * Mock implementation of TermuxCore native module
 */

export interface MockTermuxSession {
  id: string;
  pid: number;
  fileDescriptor: number;
  isRunning: boolean;
  command: string;
  args: string[];
  workingDirectory: string;
  environment: Record<string, string>;
}

export class TermuxCoreMock {
  private static instance: TermuxCoreMock;
  private sessions: Map<string, MockTermuxSession> = new Map();
  private isBootstrapInstalled: boolean = false;
  private eventListeners: Map<string, Set<(event: any) => void>> = new Map();

  private constructor() {}

  static getInstance(): TermuxCoreMock {
    if (!TermuxCoreMock.instance) {
      TermuxCoreMock.instance = new TermuxCoreMock();
    }
    return TermuxCoreMock.instance;
  }

  static reset(): void {
    TermuxCoreMock.instance = new TermuxCoreMock();
  }

  // Bootstrap methods
  async getBootstrapInfo(): Promise<{
    isInstalled: boolean;
    version?: string;
    installPath?: string;
  }> {
    return {
      isInstalled: this.isBootstrapInstalled,
      version: this.isBootstrapInstalled ? '1.0.0' : undefined,
      installPath: this.isBootstrapInstalled ? '/data/data/com.termux/files/usr' : undefined,
    };
  }

  async installBootstrap(): Promise<boolean> {
    // Simulate installation delay
    await new Promise(resolve => setTimeout(resolve, 100));
    this.isBootstrapInstalled = true;
    return true;
  }

  // Session management
  async createSession(
    sessionId: string,
    command: string,
    args: string[],
    workingDirectory: string,
    environment: Record<string, string>,
    rows: number,
    cols: number
  ): Promise<{ pid: number; fileDescriptor: number; isRunning: boolean }> {
    if (!this.isBootstrapInstalled) {
      throw new Error('Bootstrap not installed');
    }

    const session: MockTermuxSession = {
      id: sessionId,
      pid: Math.floor(Math.random() * 10000) + 1000,
      fileDescriptor: Math.floor(Math.random() * 100) + 10,
      isRunning: true,
      command,
      args,
      workingDirectory,
      environment,
    };

    this.sessions.set(sessionId, session);

    // Simulate session startup
    setTimeout(() => {
      this.emitEvent('onSessionOutput', {
        sessionId,
        data: `Welcome to Termux session ${sessionId}\\n`,
      });
    }, 50);

    return {
      pid: session.pid,
      fileDescriptor: session.fileDescriptor,
      isRunning: session.isRunning,
    };
  }

  async killSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.isRunning = false;
    this.sessions.delete(sessionId);

    // Emit exit event
    setTimeout(() => {
      this.emitEvent('onSessionExit', {
        sessionId,
        exitCode: 0,
      });
    }, 10);

    return true;
  }

  // Session I/O
  async writeToSession(sessionId: string, data: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (!session.isRunning) {
      throw new Error(`Session ${sessionId} is not running`);
    }

    // Simulate command processing
    setTimeout(() => {
      this.processCommand(sessionId, data);
    }, 10);

    return true;
  }

  async readFromSession(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (!session.isRunning) {
      throw new Error(`Session ${sessionId} is not running`);
    }

    // Return mock output
    return `Output from session ${sessionId}\\n`;
  }

  // Event system
  addListener(event: string, listener: (event: any) => void): { remove: () => void } {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    const listeners = this.eventListeners.get(event)!;
    listeners.add(listener);

    return {
      remove: () => {
        listeners.delete(listener);
      },
    };
  }

  removeListener(event: string, listener: (event: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.eventListeners.delete(event);
    } else {
      this.eventListeners.clear();
    }
  }

  emit(event: string, data: any): void {
    this.emitEvent(event, data);
  }

  // Internal methods
  private emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  private processCommand(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const command = data.trim();
    
    // Simulate different commands
    if (command === 'exit') {
      this.emitEvent('onSessionExit', {
        sessionId,
        exitCode: 0,
      });
      session.isRunning = false;
      this.sessions.delete(sessionId);
    } else if (command.startsWith('echo ')) {
      const text = command.substring(5).replace(/"/g, '');
      this.emitEvent('onSessionOutput', {
        sessionId,
        data: `${text}\\n`,
      });
    } else if (command === 'ls') {
      this.emitEvent('onSessionOutput', {
        sessionId,
        data: 'file1.txt\\nfile2.txt\\ndirectory1/\\n',
      });
    } else if (command === 'pwd') {
      this.emitEvent('onSessionOutput', {
        sessionId,
        data: `${session.workingDirectory}\\n`,
      });
    } else if (command === 'whoami') {
      this.emitEvent('onSessionOutput', {
        sessionId,
        data: 'termux\\n',
      });
    } else if (command.startsWith('sleep ')) {
      const seconds = parseInt(command.substring(6)) || 1;
      setTimeout(() => {
        this.emitEvent('onSessionOutput', {
          sessionId,
          data: `Slept for ${seconds} seconds\\n`,
        });
      }, seconds * 1000);
    } else if (command === 'clear') {
      // Don't emit output for clear command
      return;
    } else {
      // Default response for unknown commands
      this.emitEvent('onSessionOutput', {
        sessionId,
        data: `bash: ${command}: command not found\\n`,
      });
    }
  }

  // Test utilities
  getSession(sessionId: string): MockTermuxSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): MockTermuxSession[] {
    return Array.from(this.sessions.values());
  }

  setBootstrapInstalled(installed: boolean): void {
    this.isBootstrapInstalled = installed;
  }

  simulateSessionCrash(sessionId: string, exitCode: number = 1): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isRunning = false;
      this.sessions.delete(sessionId);
      this.emitEvent('onSessionExit', {
        sessionId,
        exitCode,
      });
    }
  }

  simulateOutput(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (session && session.isRunning) {
      this.emitEvent('onSessionOutput', {
        sessionId,
        data,
      });
    }
  }
}

// Export singleton instance
export const termuxCoreMock = TermuxCoreMock.getInstance();