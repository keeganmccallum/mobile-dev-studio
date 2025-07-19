import { TermuxManager } from '../../modules/termux-core/src/TermuxManager';
import { TermuxCore } from '../../modules/termux-core/src/index';

// Mock the native modules since we're testing the TypeScript layer
jest.mock('expo-modules-core', () => ({
  NativeModulesProxy: {
    TermuxCore: {
      getBootstrapInfo: jest.fn().mockResolvedValue({ installed: true, prefixPath: '/usr' }),
      installBootstrap: jest.fn().mockResolvedValue(true),
    }
  },
  requireNativeViewManager: jest.fn().mockReturnValue(() => null)
}));

jest.mock('react-native', () => ({
  NativeModules: {},
  NativeEventEmitter: class MockEventEmitter {
    addListener = jest.fn().mockReturnValue({ remove: jest.fn() });
  }
}));

describe('Termux Integration Tests', () => {
  let termuxManager: TermuxManager;

  beforeEach(() => {
    termuxManager = new TermuxManager();
  });

  describe('TermuxManager', () => {
    test('should create a session with default options', async () => {
      const sessionId = await termuxManager.createSession();
      
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      
      const session = termuxManager.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session?.isRunning).toBe(true);
      expect(session?.command).toBe('/data/data/com.termux/files/usr/bin/bash');
    });

    test('should create a session with custom options', async () => {
      const options = {
        command: '/bin/sh',
        cwd: '/tmp',
        environment: { TEST: 'true' }
      };

      const sessionId = await termuxManager.createSession(options);
      const session = termuxManager.getSession(sessionId);
      
      expect(session?.command).toBe('/bin/sh');
      expect(session?.cwd).toBe('/tmp');
    });

    test('should track multiple sessions', async () => {
      const session1 = await termuxManager.createSession();
      const session2 = await termuxManager.createSession();
      
      const allSessions = termuxManager.getAllSessions();
      expect(allSessions).toHaveLength(2);
      
      const activeSessions = termuxManager.getActiveSessions();
      expect(activeSessions).toHaveLength(2);
    });

    test('should write to session', async () => {
      const sessionId = await termuxManager.createSession();
      
      // Should not throw
      await expect(termuxManager.writeToSession(sessionId, 'echo "test"')).resolves.toBeUndefined();
    });

    test('should handle session kill', async () => {
      const sessionId = await termuxManager.createSession();
      
      const result = await termuxManager.killSession(sessionId);
      expect(result).toBe(true);
      
      const session = termuxManager.getSession(sessionId);
      expect(session?.isRunning).toBe(false);
    });

    test('should execute commands', async () => {
      const result = await termuxManager.executeCommand('echo "hello"');
      
      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('output');
      expect(result.output).toBe('Executed: echo "hello"\\n');
    });

    test('should handle non-existent session operations', async () => {
      const nonExistentId = 'fake-session-id';
      
      await expect(termuxManager.writeToSession(nonExistentId, 'test'))
        .rejects.toThrow('Session fake-session-id not found');
      
      const result = await termuxManager.killSession(nonExistentId);
      expect(result).toBe(false);
      
      const session = termuxManager.getSession(nonExistentId);
      expect(session).toBeUndefined();
    });
  });

  describe('TermuxCore Legacy API', () => {
    test('should get bootstrap info', async () => {
      const info = await TermuxCore.getBootstrapInfo();
      
      expect(info).toHaveProperty('installed');
      expect(info).toHaveProperty('prefixPath');
    });

    test('should install bootstrap', async () => {
      const result = await TermuxCore.installBootstrap();
      expect(result).toBe(true);
    });

    test('should create session through legacy API', async () => {
      const session = await TermuxCore.createSession(
        '/bin/bash',
        [],
        '/tmp',
        { HOME: '/home' }
      );
      
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('pid');
      expect(session).toHaveProperty('isRunning');
      expect(session.isRunning).toBe(true);
    });
  });

  describe('Event Handling', () => {
    test('should set up session output listeners', () => {
      const callback = jest.fn();
      const unsubscribe = termuxManager.onSessionOutput(callback);
      
      expect(typeof unsubscribe).toBe('function');
      
      // Clean up
      unsubscribe();
    });

    test('should set up session exit listeners', () => {
      const callback = jest.fn();
      const unsubscribe = termuxManager.onSessionExit(callback);
      
      expect(typeof unsubscribe).toBe('function');
      
      // Clean up
      unsubscribe();
    });

    test('should set up title change listeners', () => {
      const callback = jest.fn();
      const unsubscribe = termuxManager.onTitleChanged(callback);
      
      expect(typeof unsubscribe).toBe('function');
      
      // Clean up
      unsubscribe();
    });
  });

  describe('Session Environment', () => {
    test('should set default Termux environment variables', async () => {
      const sessionId = await termuxManager.createSession();
      const session = termuxManager.getSession(sessionId);
      
      // Verify the session was created with proper defaults
      expect(session?.command).toBe('/data/data/com.termux/files/usr/bin/bash');
      expect(session?.cwd).toBe('/data/data/com.termux/files/home');
    });

    test('should merge custom environment with defaults', async () => {
      const customEnv = { CUSTOM_VAR: 'custom_value' };
      const sessionId = await termuxManager.createSession({ environment: customEnv });
      
      // Session should be created successfully with custom environment
      const session = termuxManager.getSession(sessionId);
      expect(session).toBeDefined();
    });
  });
});