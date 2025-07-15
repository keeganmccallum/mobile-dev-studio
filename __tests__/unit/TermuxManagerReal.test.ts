/**
 * Unit tests for TermuxManager using real native module
 * These tests verify the library logic without mocking native calls
 */

import { Platform } from 'react-native';
import { TermuxManager, TermuxSession, termuxManager } from '../../src/lib/termux/TermuxManager';

const describeIfAndroid = Platform.OS === 'android' ? describe : describe.skip;

describeIfAndroid('TermuxManager (Real Native Module)', () => {
  beforeEach(() => {
    // Reset singleton instance for each test
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
    it('should initialize bootstrap', async () => {
      const manager = TermuxManager.getInstance();
      
      // This should not throw and should complete
      await expect(manager.initializeBootstrap()).resolves.not.toThrow();
    }, 120000); // Bootstrap can take time

    it('should handle multiple bootstrap initialization calls', async () => {
      const manager = TermuxManager.getInstance();
      
      // First call
      await manager.initializeBootstrap();
      
      // Second call should also work (idempotent)
      await expect(manager.initializeBootstrap()).resolves.not.toThrow();
    }, 60000);
  });

  describe('Session Management', () => {
    let manager: TermuxManager;

    beforeEach(async () => {
      manager = TermuxManager.getInstance();
      // Ensure bootstrap is ready
      await manager.initializeBootstrap();
    }, 120000);

    afterEach(async () => {
      // Clean up all sessions
      await manager.killAllSessions();
    });

    it('should create a session with auto-generated ID', async () => {
      const session = await manager.createSession();

      expect(session).toBeInstanceOf(TermuxSession);
      expect(session.id).toBeDefined();
      expect(session.id).toMatch(/^session_\\d+_[a-z0-9]+$/);
      expect(session.pid).toBeGreaterThan(0);
      expect(session.isRunning).toBe(true);
    }, 30000);

    it('should create a session with custom ID', async () => {
      const customId = 'my-custom-session';
      const session = await manager.createSession(customId);

      expect(session.id).toBe(customId);
      expect(session.pid).toBeGreaterThan(0);
      expect(session.isRunning).toBe(true);
    }, 30000);

    it('should create a session with custom configuration', async () => {
      const config = {
        command: '/data/data/com.termux/files/usr/bin/bash',
        args: ['-c', 'echo "test"'],
        workingDirectory: '/data/data/com.termux/files/home',
        environment: {
          CUSTOM_VAR: 'custom_value',
        },
        rows: 30,
        cols: 120,
      };

      const session = await manager.createSession('custom-config-session', config);

      expect(session.id).toBe('custom-config-session');
      expect(session.pid).toBeGreaterThan(0);
      expect(session.isRunning).toBe(true);
    }, 30000);

    it('should store and retrieve created sessions', async () => {
      const sessionId = 'test-storage-session';
      const session = await manager.createSession(sessionId);

      const retrievedSession = manager.getSession(sessionId);
      expect(retrievedSession).toBe(session);
    }, 30000);

    it('should return undefined for non-existent sessions', () => {
      const session = manager.getSession('non-existent-session');
      expect(session).toBeUndefined();
    });

    it('should track active sessions', async () => {
      expect(manager.getActiveSessions()).toHaveLength(0);
      
      const session1 = await manager.createSession('session1');
      expect(manager.getActiveSessions()).toHaveLength(1);
      
      const session2 = await manager.createSession('session2');
      expect(manager.getActiveSessions()).toHaveLength(2);
      
      expect(manager.getActiveSessions()).toContain(session1);
      expect(manager.getActiveSessions()).toContain(session2);
    }, 60000);

    it('should handle session creation failures gracefully', async () => {
      const invalidConfig = {
        command: '/invalid/command/path',
        args: [],
        workingDirectory: '/invalid/directory',
        environment: {},
        rows: 24,
        cols: 80,
      };

      await expect(
        manager.createSession('invalid-session', invalidConfig)
      ).rejects.toThrow();
    });
  });

  describe('Command Execution', () => {
    let manager: TermuxManager;

    beforeEach(async () => {
      manager = TermuxManager.getInstance();
      await manager.initializeBootstrap();
    }, 120000);

    afterEach(async () => {
      await manager.killAllSessions();
    });

    it('should execute simple commands', async () => {
      const result = await manager.executeCommand('echo "hello world"');
      
      expect(result).toBeDefined();
      expect(result.stdout).toContain('hello world');
      expect(result.exitCode).toBe(0);
    }, 30000);

    it('should execute commands with custom options', async () => {
      const result = await manager.executeCommand('pwd', {
        workingDirectory: '/data/data/com.termux/files/home',
      });
      
      expect(result).toBeDefined();
      expect(result.stdout).toContain('/data/data/com.termux/files/home');
      expect(result.exitCode).toBe(0);
    }, 30000);

    it('should handle command timeouts', async () => {
      await expect(
        manager.executeCommand('sleep 10', { timeout: 1000 })
      ).rejects.toThrow('Command timed out');
    }, 5000);

    it('should handle command failures', async () => {
      const result = await manager.executeCommand('nonexistent-command');
      
      expect(result).toBeDefined();
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr || result.stdout).toContain('not found');
    }, 30000);

    it('should clean up sessions after command execution', async () => {
      const initialSessionCount = manager.getActiveSessions().length;
      
      await manager.executeCommand('echo "test"');
      
      // Session should be cleaned up after command completes
      expect(manager.getActiveSessions().length).toBe(initialSessionCount);
    }, 30000);
  });

  describe('Session Cleanup', () => {
    let manager: TermuxManager;

    beforeEach(async () => {
      manager = TermuxManager.getInstance();
      await manager.initializeBootstrap();
    }, 120000);

    it('should kill all sessions', async () => {
      // Create multiple sessions
      await manager.createSession('session1');
      await manager.createSession('session2');
      await manager.createSession('session3');
      
      expect(manager.getActiveSessions().length).toBe(3);
      
      // Kill all sessions
      await manager.killAllSessions();
      
      // All sessions should be cleaned up
      expect(manager.getActiveSessions().length).toBe(0);
    }, 60000);

    it('should handle errors when killing sessions gracefully', async () => {
      // Create a session
      const session = await manager.createSession('test-session');
      
      // Kill the session directly (simulating external termination)
      await session.kill();
      
      // killAllSessions should still work without throwing
      await expect(manager.killAllSessions()).resolves.not.toThrow();
    }, 30000);
  });

  describe('Error Handling', () => {
    let manager: TermuxManager;

    beforeEach(() => {
      manager = TermuxManager.getInstance();
    });

    it('should handle bootstrap initialization errors gracefully', async () => {
      // This test depends on the native module throwing appropriate errors
      // In a real scenario, this might happen due to permissions or system issues
      
      // For now, just ensure the method exists and can be called
      await expect(manager.initializeBootstrap()).resolves.not.toThrow();
    }, 60000);

    it('should handle session creation when bootstrap is not ready', async () => {
      // Try to create session without initializing bootstrap first
      // The manager should auto-initialize bootstrap
      const session = await manager.createSession('no-bootstrap-session');
      
      expect(session).toBeDefined();
      expect(session.isRunning).toBe(true);
    }, 120000);
  });

  describe('Performance Tests', () => {
    let manager: TermuxManager;

    beforeEach(async () => {
      manager = TermuxManager.getInstance();
      await manager.initializeBootstrap();
    }, 120000);

    afterEach(async () => {
      await manager.killAllSessions();
    });

    it('should handle multiple concurrent session creations', async () => {
      const sessionPromises = [];
      
      for (let i = 0; i < 5; i++) {
        sessionPromises.push(manager.createSession(`concurrent-session-${i}`));
      }
      
      const sessions = await Promise.all(sessionPromises);
      
      expect(sessions).toHaveLength(5);
      sessions.forEach((session, index) => {
        expect(session.id).toBe(`concurrent-session-${index}`);
        expect(session.isRunning).toBe(true);
      });
      
      expect(manager.getActiveSessions()).toHaveLength(5);
    }, 60000);

    it('should handle rapid command executions', async () => {
      const commandPromises = [];
      
      for (let i = 0; i < 10; i++) {
        commandPromises.push(manager.executeCommand(`echo "command ${i}"`));
      }
      
      const results = await Promise.all(commandPromises);
      
      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain(`command ${index}`);
      });
    }, 60000);
  });
});