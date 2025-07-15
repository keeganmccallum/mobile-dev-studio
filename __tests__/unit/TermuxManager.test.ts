/**
 * Unit tests for TermuxManager
 */

import { TermuxManager, TermuxSession, termuxManager } from '../../src/lib/termux/TermuxManager';
import { NativeModules } from 'react-native';

// Mock React Native modules
const mockTermuxCore = {
  createSession: jest.fn(),
  killSession: jest.fn(),
  writeToSession: jest.fn(),
  readFromSession: jest.fn(),
  getBootstrapInfo: jest.fn(),
  installBootstrap: jest.fn(),
};

const mockNativeEventEmitter = {
  addListener: jest.fn(),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
};

jest.mock('react-native', () => ({
  NativeModules: {
    TermuxCore: mockTermuxCore,
  },
  NativeEventEmitter: jest.fn(() => mockNativeEventEmitter),
}));

describe('TermuxManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton instance
    (TermuxManager as any).instance = null;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance for multiple calls', () => {
      const manager1 = TermuxManager.getInstance();
      const manager2 = TermuxManager.getInstance();
      
      expect(manager1).toBe(manager2);
    });

    it('should return the same instance as the exported singleton', () => {
      const manager = TermuxManager.getInstance();
      
      expect(manager).toBe(termuxManager);
    });
  });

  describe('Bootstrap Management', () => {
    it('should initialize bootstrap when not installed', async () => {
      mockTermuxCore.getBootstrapInfo.mockResolvedValue({ isInstalled: false });
      mockTermuxCore.installBootstrap.mockResolvedValue(true);

      const manager = TermuxManager.getInstance();
      await manager.initializeBootstrap();

      expect(mockTermuxCore.getBootstrapInfo).toHaveBeenCalled();
      expect(mockTermuxCore.installBootstrap).toHaveBeenCalled();
    });

    it('should skip bootstrap installation when already installed', async () => {
      mockTermuxCore.getBootstrapInfo.mockResolvedValue({ isInstalled: true });

      const manager = TermuxManager.getInstance();
      await manager.initializeBootstrap();

      expect(mockTermuxCore.getBootstrapInfo).toHaveBeenCalled();
      expect(mockTermuxCore.installBootstrap).not.toHaveBeenCalled();
    });

    it('should handle bootstrap initialization errors', async () => {
      mockTermuxCore.getBootstrapInfo.mockRejectedValue(new Error('Bootstrap check failed'));

      const manager = TermuxManager.getInstance();
      
      await expect(manager.initializeBootstrap()).rejects.toThrow('Failed to initialize bootstrap');
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      mockTermuxCore.getBootstrapInfo.mockResolvedValue({ isInstalled: true });
      mockTermuxCore.createSession.mockResolvedValue({
        pid: 1234,
        fileDescriptor: 5,
        isRunning: true,
      });
    });

    it('should create a new session with auto-generated ID', async () => {
      const manager = TermuxManager.getInstance();
      const session = await manager.createSession();

      expect(session).toBeInstanceOf(TermuxSession);
      expect(session.id).toBeDefined();
      expect(session.pid).toBe(1234);
      expect(session.isRunning).toBe(true);
    });

    it('should create a session with custom ID', async () => {
      const customId = 'custom-session-id';
      const manager = TermuxManager.getInstance();
      const session = await manager.createSession(customId);

      expect(session.id).toBe(customId);
    });

    it('should store created sessions', async () => {
      const manager = TermuxManager.getInstance();
      const session = await manager.createSession('test-session');

      const retrievedSession = manager.getSession('test-session');
      expect(retrievedSession).toBe(session);
    });

    it('should return undefined for non-existent sessions', () => {
      const manager = TermuxManager.getInstance();
      const session = manager.getSession('non-existent');

      expect(session).toBeUndefined();
    });

    it('should track active sessions', async () => {
      const manager = TermuxManager.getInstance();
      
      expect(manager.getActiveSessions()).toHaveLength(0);
      
      await manager.createSession('session1');
      await manager.createSession('session2');
      
      expect(manager.getActiveSessions()).toHaveLength(2);
    });

    it('should initialize bootstrap automatically when creating session', async () => {
      mockTermuxCore.getBootstrapInfo.mockResolvedValue({ isInstalled: false });
      mockTermuxCore.installBootstrap.mockResolvedValue(true);

      const manager = TermuxManager.getInstance();
      await manager.createSession();

      expect(mockTermuxCore.installBootstrap).toHaveBeenCalled();
    });
  });

  describe('Command Execution', () => {
    beforeEach(() => {
      mockTermuxCore.getBootstrapInfo.mockResolvedValue({ isInstalled: true });
      mockTermuxCore.createSession.mockResolvedValue({
        pid: 1234,
        fileDescriptor: 5,
        isRunning: true,
      });
      mockTermuxCore.writeToSession.mockResolvedValue(true);
      mockTermuxCore.killSession.mockResolvedValue(true);
    });

    it('should execute commands with proper output handling', async () => {
      const manager = TermuxManager.getInstance();
      
      // Mock session events
      let dataCallback: (data: string) => void;
      let exitCallback: (code: number) => void;
      
      mockNativeEventEmitter.addListener.mockImplementation((event, callback) => {
        if (event === 'onSessionOutput') {
          dataCallback = callback;
        } else if (event === 'onSessionExit') {
          exitCallback = callback;
        }
        return { remove: jest.fn() };
      });

      const commandPromise = manager.executeCommand('echo "test"');
      
      // Simulate session output
      setTimeout(() => {
        dataCallback({ sessionId: expect.any(String), data: 'test\n' });
        exitCallback({ sessionId: expect.any(String), exitCode: 0 });
      }, 10);

      const result = await commandPromise;
      
      expect(result.stdout).toBe('test\n');
      expect(result.exitCode).toBe(0);
    });

    it('should handle command timeouts', async () => {
      const manager = TermuxManager.getInstance();
      
      mockNativeEventEmitter.addListener.mockImplementation(() => ({
        remove: jest.fn(),
      }));

      const commandPromise = manager.executeCommand('sleep 100', { timeout: 100 });
      
      await expect(commandPromise).rejects.toThrow('Command timed out');
    });

    it('should clean up sessions after command execution', async () => {
      const manager = TermuxManager.getInstance();
      
      let exitCallback: (code: number) => void;
      
      mockNativeEventEmitter.addListener.mockImplementation((event, callback) => {
        if (event === 'onSessionExit') {
          exitCallback = callback;
        }
        return { remove: jest.fn() };
      });

      const commandPromise = manager.executeCommand('echo "test"');
      
      // Get the session ID that was created
      const activeSessions = manager.getActiveSessions();
      const sessionId = activeSessions[0].id;
      
      // Simulate session exit
      setTimeout(() => {
        exitCallback({ sessionId, exitCode: 0 });
      }, 10);

      await commandPromise;
      
      // Session should be cleaned up
      expect(manager.getActiveSessions()).toHaveLength(0);
    });
  });

  describe('Session Cleanup', () => {
    beforeEach(() => {
      mockTermuxCore.getBootstrapInfo.mockResolvedValue({ isInstalled: true });
      mockTermuxCore.createSession.mockResolvedValue({
        pid: 1234,
        fileDescriptor: 5,
        isRunning: true,
      });
      mockTermuxCore.killSession.mockResolvedValue(true);
    });

    it('should kill all sessions', async () => {
      const manager = TermuxManager.getInstance();
      
      await manager.createSession('session1');
      await manager.createSession('session2');
      
      expect(manager.getActiveSessions()).toHaveLength(2);
      
      await manager.killAllSessions();
      
      expect(mockTermuxCore.killSession).toHaveBeenCalledTimes(2);
      expect(manager.getActiveSessions()).toHaveLength(0);
    });

    it('should handle errors when killing sessions', async () => {
      const manager = TermuxManager.getInstance();
      
      await manager.createSession('session1');
      
      mockTermuxCore.killSession.mockRejectedValue(new Error('Kill failed'));
      
      // Should not throw even if killing fails
      await expect(manager.killAllSessions()).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle session creation errors', async () => {
      mockTermuxCore.getBootstrapInfo.mockResolvedValue({ isInstalled: true });
      mockTermuxCore.createSession.mockRejectedValue(new Error('Native creation failed'));

      const manager = TermuxManager.getInstance();
      
      await expect(manager.createSession()).rejects.toThrow('Failed to start Termux session');
    });

    it('should handle bootstrap installation errors', async () => {
      mockTermuxCore.getBootstrapInfo.mockResolvedValue({ isInstalled: false });
      mockTermuxCore.installBootstrap.mockRejectedValue(new Error('Install failed'));

      const manager = TermuxManager.getInstance();
      
      await expect(manager.initializeBootstrap()).rejects.toThrow('Failed to initialize bootstrap');
    });
  });
});