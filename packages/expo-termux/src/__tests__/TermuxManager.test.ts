import { TermuxManager, termuxManager } from '../TermuxManager';
import { NativeModules } from 'react-native';

// Mock NativeModules
jest.mock('react-native', () => ({
  NativeModules: {
    TermuxCore: {
      createSession: jest.fn(),
      writeToSession: jest.fn(),
      killSession: jest.fn(),
      getBootstrapInfo: jest.fn(),
      installBootstrap: jest.fn(),
    }
  },
  NativeEventEmitter: jest.fn().mockImplementation(() => ({
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
  })),
}));

describe('TermuxManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a session with default options', async () => {
      const mockResult = {
        id: 'test-session',
        pid: 1234,
        isRunning: true,
        fileDescriptor: 5
      };
      
      (NativeModules.TermuxCore.createSession as jest.Mock).mockResolvedValue(mockResult);

      const sessionId = await termuxManager.createSession();
      
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(NativeModules.TermuxCore.createSession).toHaveBeenCalledWith(
        expect.stringMatching(/^session_\d+_[a-z0-9]+$/),
        '/data/data/com.termux/files/usr/bin/bash',
        [],
        '/data/data/com.termux/files/home',
        expect.objectContaining({
          PATH: expect.stringContaining('/data/data/com.termux/files/usr/bin'),
          HOME: '/data/data/com.termux/files/home',
          SHELL: '/data/data/com.termux/files/usr/bin/bash',
          TERM: 'xterm-256color',
        }),
        24,
        80
      );
    });

    it('should create a session with custom options', async () => {
      const mockResult = {
        id: 'test-session',
        pid: 1234,
        isRunning: true,
        fileDescriptor: 5
      };
      
      (NativeModules.TermuxCore.createSession as jest.Mock).mockResolvedValue(mockResult);

      const options = {
        command: '/bin/sh',
        cwd: '/tmp',
        environment: { CUSTOM_VAR: 'test' }
      };

      const sessionId = await termuxManager.createSession(options);
      
      expect(NativeModules.TermuxCore.createSession).toHaveBeenCalledWith(
        expect.any(String),
        '/bin/sh',
        [],
        '/tmp',
        expect.objectContaining({
          CUSTOM_VAR: 'test',
          HOME: '/data/data/com.termux/files/home',
        }),
        24,
        80
      );
    });

    it('should throw error when native module is not available', async () => {
      // Temporarily remove TermuxCore
      const originalTermuxCore = NativeModules.TermuxCore;
      delete (NativeModules as any).TermuxCore;

      await expect(termuxManager.createSession()).rejects.toThrow(
        'TermuxCore native module not available'
      );

      // Restore TermuxCore
      NativeModules.TermuxCore = originalTermuxCore;
    });
  });

  describe('writeToSession', () => {
    it('should write data to an existing session', async () => {
      // First create a session
      const mockResult = {
        id: 'test-session',
        pid: 1234,
        isRunning: true,
        fileDescriptor: 5
      };
      
      (NativeModules.TermuxCore.createSession as jest.Mock).mockResolvedValue(mockResult);
      (NativeModules.TermuxCore.writeToSession as jest.Mock).mockResolvedValue(undefined);

      const sessionId = await termuxManager.createSession();
      await termuxManager.writeToSession(sessionId, 'ls -la');

      expect(NativeModules.TermuxCore.writeToSession).toHaveBeenCalledWith(sessionId, 'ls -la');
    });

    it('should throw error for non-existent session', async () => {
      await expect(termuxManager.writeToSession('non-existent', 'test')).rejects.toThrow(
        'Session non-existent not found'
      );
    });
  });

  describe('killSession', () => {
    it('should kill an existing session', async () => {
      // First create a session
      const mockResult = {
        id: 'test-session',
        pid: 1234,
        isRunning: true,
        fileDescriptor: 5
      };
      
      (NativeModules.TermuxCore.createSession as jest.Mock).mockResolvedValue(mockResult);
      (NativeModules.TermuxCore.killSession as jest.Mock).mockResolvedValue(true);

      const sessionId = await termuxManager.createSession();
      const result = await termuxManager.killSession(sessionId);

      expect(result).toBe(true);
      expect(NativeModules.TermuxCore.killSession).toHaveBeenCalledWith(sessionId);
      
      const session = termuxManager.getSession(sessionId);
      expect(session?.isRunning).toBe(false);
    });

    it('should return false for non-existent session', async () => {
      const result = await termuxManager.killSession('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('executeCommand', () => {
    it('should execute command and return output', async () => {
      const mockResult = {
        id: 'test-session',
        pid: 1234,
        isRunning: true,
        fileDescriptor: 5
      };
      
      (NativeModules.TermuxCore.createSession as jest.Mock).mockResolvedValue(mockResult);
      (NativeModules.TermuxCore.writeToSession as jest.Mock).mockResolvedValue(undefined);

      // Mock the session output event
      setTimeout(() => {
        termuxManager['outputCallbacks'].forEach(callback => {
          callback('test-session', ['output line 1', 'output line 2']);
        });
        
        termuxManager['exitCallbacks'].forEach(callback => {
          callback('test-session', 0);
        });
      }, 100);

      const result = await termuxManager.executeCommand('ls -la');
      
      expect(result.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(result.output).toContain('output line 1');
      expect(result.stdout).toContain('output line 2');
    });
  });

  describe('event handling', () => {
    it('should handle session output events', () => {
      const callback = jest.fn();
      const unsubscribe = termuxManager.onSessionOutput(callback);

      // Simulate event
      termuxManager['outputCallbacks'].forEach(cb => {
        cb('test-session', ['test output']);
      });

      expect(callback).toHaveBeenCalledWith('test-session', ['test output']);
      
      // Test unsubscribe
      unsubscribe();
      callback.mockClear();
      
      termuxManager['outputCallbacks'].forEach(cb => {
        cb('test-session', ['test output 2']);
      });
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle session exit events', () => {
      const callback = jest.fn();
      const unsubscribe = termuxManager.onSessionExit(callback);

      // Simulate event
      termuxManager['exitCallbacks'].forEach(cb => {
        cb('test-session', 0);
      });

      expect(callback).toHaveBeenCalledWith('test-session', 0);
      
      // Test unsubscribe
      unsubscribe();
    });
  });

  describe('session management', () => {
    it('should track active sessions', async () => {
      const mockResult = {
        id: 'test-session',
        pid: 1234,
        isRunning: true,
        fileDescriptor: 5
      };
      
      (NativeModules.TermuxCore.createSession as jest.Mock).mockResolvedValue(mockResult);

      const sessionId1 = await termuxManager.createSession();
      const sessionId2 = await termuxManager.createSession();

      const allSessions = termuxManager.getAllSessions();
      const activeSessions = termuxManager.getActiveSessions();

      expect(allSessions).toHaveLength(2);
      expect(activeSessions).toHaveLength(2);
      expect(activeSessions.every(s => s.isRunning)).toBe(true);
    });
  });
});