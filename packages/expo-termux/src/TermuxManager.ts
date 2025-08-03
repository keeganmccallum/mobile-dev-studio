import { NativeEventEmitter } from 'react-native';
import ExpoTermux, { TermuxSessionInfo } from './ExpoTermuxModule';
import { BridgeDebugger } from './BridgeDebugger';

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
    // Use the proper Expo module
    return ExpoTermux;
  }

  constructor() {
    // DEBUG: Comprehensive bridge debugging
    console.log('[TermuxManager] INITIALIZING - Running bridge diagnostics...');
    BridgeDebugger.debugBridgeRegistration();
    BridgeDebugger.testBridgeConnectivity();
    BridgeDebugger.logModuleLoadAttempt();
    
    // Initialize event emitter for session events
    try {
      const TermuxCore = this.getTermuxCore();
      if (TermuxCore) {
        // Cast to any to handle type differences between NativeModule and ProxyNativeModule
        this.eventEmitter = new NativeEventEmitter(TermuxCore as any);
        this.setupEventListeners();
        console.log('[TermuxManager] ✅ Native module found and initialized');
        console.log('[TermuxManager] Module methods:', Object.keys(TermuxCore));
      } else {
        console.error('[TermuxManager] ❌ Native module not available - check expo-termux installation');
        console.error('[TermuxManager] Expected module name: ExpoTermux');
        console.error('[TermuxManager] Make sure expo-termux plugin is in app.json');
      }
    } catch (error) {
      console.error('[TermuxManager] ❌ Error accessing ExpoTermux module:', error);
      console.error('[TermuxManager] This might indicate the module is not registered properly');
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
      const termuxCore = this.getTermuxCore();
      if (!termuxCore) {
        throw new Error('ExpoTermux native module not available');
      }

      // First test that module is available
      console.log('[TermuxManager] Testing native module...');
      const testResult = termuxCore.test();
      console.log('[TermuxManager] Native module test result:', testResult);

      // Create actual session using native module
      console.log('[TermuxManager] Creating Termux session with options:', options);
      const sessionInfo: TermuxSessionInfo = await termuxCore.createSession(
        options.command || '/system/bin/sh',
        options.cwd || '/system',
        options.environment || {}
      );

      console.log('[TermuxManager] Native session created:', sessionInfo);

      // Store session locally
      const session: TermuxSession = {
        id: sessionInfo.sessionId,
        pid: sessionInfo.pid,
        isRunning: sessionInfo.isRunning,
        command: options.command || '/system/bin/sh',
        cwd: options.cwd || '/system'
      };
      
      this.sessions.set(session.id, session);
      console.log(`[TermuxManager] ✅ Session created successfully: ${session.id}`);
      
      return session.id;
      
    } catch (error) {
      console.error('Failed to create session:', error);
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
      const termuxCore = this.getTermuxCore();
      if (!termuxCore) {
        throw new Error('ExpoTermux native module not available');
      }
      
      console.log(`[TermuxManager] Writing to session ${sessionId}:`, data);
      await termuxCore.writeToSession(sessionId, data);
      
    } catch (error) {
      console.error(`[TermuxManager] Failed to write to session ${sessionId}:`, error);
      throw error;
    }
  }

  readFromSession(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      const termuxCore = this.getTermuxCore();
      if (!termuxCore) {
        throw new Error('ExpoTermux native module not available');
      }
      
      const output = termuxCore.readFromSession(sessionId);
      console.log(`[TermuxManager] Read from session ${sessionId}:`, output);
      return output;
      
    } catch (error) {
      console.error(`[TermuxManager] Failed to read from session ${sessionId}:`, error);
      throw error;
    }
  }

  async killSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    try {
      const termuxCore = this.getTermuxCore();
      if (!termuxCore) {
        throw new Error('ExpoTermux native module not available');
      }
      
      const result = await termuxCore.killSession(sessionId);
      
      if (result) {
        session.isRunning = false;
        this.sessions.delete(sessionId);
        console.log(`[TermuxManager] ✅ Killed session: ${sessionId}`);
      }
      
      return result;
      
    } catch (error) {
      console.error(`[TermuxManager] Failed to kill session ${sessionId}:`, error);
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
    console.log(`[TermuxManager] Executing command: ${command}`);
    const sessionId = await this.createSession(options);
    
    try {
      // Clear any initial output from session creation
      this.readFromSession(sessionId);
      
      // Set up output collection
      let collectedOutput = '';
      let outputComplete = false;
      
      const outputListener = this.onSessionOutput((sid, lines) => {
        if (sid === sessionId) {
          const newOutput = lines.join('\n');
          collectedOutput += newOutput + '\n';
          console.log(`[TermuxManager] Collected output: ${newOutput}`);
          
          // Check if we got a new prompt (indicating command completion)
          if (newOutput.includes('$ ')) {
            outputComplete = true;
          }
        }
      });
      
      // Write command to session
      console.log(`[TermuxManager] Writing command: ${command}`);
      await this.writeToSession(sessionId, command + '\n');
      
      // Wait for output with timeout
      const startTime = Date.now();
      const timeout = 5000; // 5 second timeout
      
      while (!outputComplete && (Date.now() - startTime) < timeout) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Clean up listener
      outputListener();
      
      if (!outputComplete) {
        console.warn(`[TermuxManager] Command timed out: ${command}`);
        collectedOutput += '\n[Command timed out]';
      }
      
      console.log(`[TermuxManager] ✅ Command executed. Final output:`, collectedOutput);
      
      return {
        sessionId,
        output: collectedOutput,
        stdout: collectedOutput
      };
      
    } catch (error) {
      console.error(`[TermuxManager] Command execution failed:`, error);
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