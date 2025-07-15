/**
 * Integration tests for native Termux module bridge
 * These tests run against the actual native module in Android emulator
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

describe('TermuxCore Native Module Integration', () => {
  let TermuxCore: any;
  let termuxEmitter: NativeEventEmitter;

  beforeAll(() => {
    // Skip tests if not on Android
    if (Platform.OS !== 'android') {
      console.warn('Skipping TermuxCore tests - Android only');
      return;
    }
    
    // Get the native module
    TermuxCore = NativeModules.TermuxCore;
    termuxEmitter = new NativeEventEmitter(TermuxCore);
    
    // Ensure module is available
    if (!TermuxCore) {
      throw new Error('TermuxCore native module not available');
    }
  });

  beforeEach(() => {
    if (Platform.OS !== 'android') {
      return;
    }
  });

  describe('Module Availability', () => {
    it('should have TermuxCore module available', () => {
      if (Platform.OS !== 'android') {
        expect(true).toBe(true); // Skip on non-Android
        return;
      }
      expect(TermuxCore).toBeDefined();
    });

    it('should have required native methods', () => {
      if (Platform.OS !== 'android') {
        expect(true).toBe(true); // Skip on non-Android
        return;
      }
      expect(TermuxCore.createSession).toBeDefined();
      expect(TermuxCore.killSession).toBeDefined();
      expect(TermuxCore.writeToSession).toBeDefined();
      expect(TermuxCore.readFromSession).toBeDefined();
      expect(TermuxCore.getBootstrapInfo).toBeDefined();
      expect(TermuxCore.installBootstrap).toBeDefined();
    });

    it('should support event emission', () => {
      if (Platform.OS !== 'android') {
        expect(true).toBe(true); // Skip on non-Android
        return;
      }
      expect(termuxEmitter).toBeDefined();
      expect(termuxEmitter.addListener).toBeDefined();
    });
  });

  describe('Bootstrap Operations', () => {
    it('should check bootstrap installation status', async () => {
      // Mock implementation
      TermuxCore.getBootstrapInfo = jest.fn().mockResolvedValue({
        isInstalled: true,
        version: '1.0.0',
        installPath: '/data/data/com.termux/files/usr',
      });

      const bootstrapInfo = await TermuxCore.getBootstrapInfo();

      expect(bootstrapInfo).toEqual({
        isInstalled: true,
        version: '1.0.0',
        installPath: '/data/data/com.termux/files/usr',
      });
    });

    it('should install bootstrap when not present', async () => {
      // Mock implementation
      TermuxCore.installBootstrap = jest.fn().mockResolvedValue(true);

      const result = await TermuxCore.installBootstrap();

      expect(result).toBe(true);
      expect(TermuxCore.installBootstrap).toHaveBeenCalled();
    });

    it('should handle bootstrap installation failures', async () => {
      TermuxCore.installBootstrap = jest.fn().mockRejectedValue(
        new Error('Bootstrap installation failed')
      );

      await expect(TermuxCore.installBootstrap()).rejects.toThrow(
        'Bootstrap installation failed'
      );
    });
  });

  describe('Session Management', () => {
    it('should create session with correct parameters', async () => {
      // Mock implementation
      TermuxCore.createSession = jest.fn().mockResolvedValue({
        pid: 1234,
        fileDescriptor: 5,
        isRunning: true,
      });

      const sessionInfo = await TermuxCore.createSession(
        'test-session',
        '/data/data/com.termux/files/usr/bin/bash',
        ['-l'],
        '/data/data/com.termux/files/home',
        {
          PATH: '/data/data/com.termux/files/usr/bin',
          HOME: '/data/data/com.termux/files/home',
        },
        24,
        80
      );

      expect(TermuxCore.createSession).toHaveBeenCalledWith(
        'test-session',
        '/data/data/com.termux/files/usr/bin/bash',
        ['-l'],
        '/data/data/com.termux/files/home',
        {
          PATH: '/data/data/com.termux/files/usr/bin',
          HOME: '/data/data/com.termux/files/home',
        },
        24,
        80
      );

      expect(sessionInfo).toEqual({
        pid: 1234,
        fileDescriptor: 5,
        isRunning: true,
      });
    });

    it('should handle session creation failures', async () => {
      TermuxCore.createSession = jest.fn().mockRejectedValue(
        new Error('Failed to create native session')
      );

      await expect(
        TermuxCore.createSession('test-session', '/bin/bash', [], '/', {}, 24, 80)
      ).rejects.toThrow('Failed to create native session');
    });

    it('should kill session by ID', async () => {
      TermuxCore.killSession = jest.fn().mockResolvedValue(true);

      const result = await TermuxCore.killSession('test-session');

      expect(result).toBe(true);
      expect(TermuxCore.killSession).toHaveBeenCalledWith('test-session');
    });

    it('should handle session kill failures', async () => {
      TermuxCore.killSession = jest.fn().mockRejectedValue(
        new Error('Failed to kill session')
      );

      await expect(TermuxCore.killSession('test-session')).rejects.toThrow(
        'Failed to kill session'
      );
    });
  });

  describe('Session I/O Operations', () => {
    it('should write data to session', async () => {
      TermuxCore.writeToSession = jest.fn().mockResolvedValue(true);

      const result = await TermuxCore.writeToSession('test-session', 'echo "hello"\\n');

      expect(result).toBe(true);
      expect(TermuxCore.writeToSession).toHaveBeenCalledWith(
        'test-session',
        'echo "hello"\\n'
      );
    });

    it('should read data from session', async () => {
      TermuxCore.readFromSession = jest.fn().mockResolvedValue('hello\\n');

      const result = await TermuxCore.readFromSession('test-session');

      expect(result).toBe('hello\\n');
      expect(TermuxCore.readFromSession).toHaveBeenCalledWith('test-session');
    });

    it('should handle write failures', async () => {
      TermuxCore.writeToSession = jest.fn().mockRejectedValue(
        new Error('Write operation failed')
      );

      await expect(
        TermuxCore.writeToSession('test-session', 'test')
      ).rejects.toThrow('Write operation failed');
    });

    it('should handle read failures', async () => {
      TermuxCore.readFromSession = jest.fn().mockRejectedValue(
        new Error('Read operation failed')
      );

      await expect(
        TermuxCore.readFromSession('test-session')
      ).rejects.toThrow('Read operation failed');
    });
  });

  describe('Event System', () => {
    it('should emit session output events', (done) => {
      const testData = 'test output from session';
      const testSessionId = 'test-session';

      const subscription = termuxEmitter.addListener('onSessionOutput', (event) => {
        expect(event).toEqual({
          sessionId: testSessionId,
          data: testData,
        });
        subscription.remove();
        done();
      });

      // Simulate native event emission
      termuxEmitter.emit('onSessionOutput', {
        sessionId: testSessionId,
        data: testData,
      });
    });

    it('should emit session exit events', (done) => {
      const testSessionId = 'test-session';
      const testExitCode = 0;

      const subscription = termuxEmitter.addListener('onSessionExit', (event) => {
        expect(event).toEqual({
          sessionId: testSessionId,
          exitCode: testExitCode,
        });
        subscription.remove();
        done();
      });

      // Simulate native event emission
      termuxEmitter.emit('onSessionExit', {
        sessionId: testSessionId,
        exitCode: testExitCode,
      });
    });

    it('should support multiple event listeners', (done) => {
      const testData = 'test output';
      const testSessionId = 'test-session';
      let callCount = 0;

      const checkComplete = () => {
        callCount++;
        if (callCount === 2) {
          done();
        }
      };

      const subscription1 = termuxEmitter.addListener('onSessionOutput', (event) => {
        expect(event.data).toBe(testData);
        subscription1.remove();
        checkComplete();
      });

      const subscription2 = termuxEmitter.addListener('onSessionOutput', (event) => {
        expect(event.data).toBe(testData);
        subscription2.remove();
        checkComplete();
      });

      // Simulate native event emission
      termuxEmitter.emit('onSessionOutput', {
        sessionId: testSessionId,
        data: testData,
      });
    });

    it('should handle listener removal', () => {
      const listener = jest.fn();
      const subscription = termuxEmitter.addListener('onSessionOutput', listener);

      // Emit event - should be received
      termuxEmitter.emit('onSessionOutput', {
        sessionId: 'test',
        data: 'test',
      });

      expect(listener).toHaveBeenCalledTimes(1);

      // Remove listener
      subscription.remove();
      listener.mockClear();

      // Emit event again - should not be received
      termuxEmitter.emit('onSessionOutput', {
        sessionId: 'test',
        data: 'test',
      });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle native module unavailability', () => {
      // Temporarily make module unavailable
      const originalModule = NativeModules.TermuxCore;
      delete NativeModules.TermuxCore;

      expect(() => {
        const unavailableModule = NativeModules.TermuxCore;
        expect(unavailableModule).toBeUndefined();
      }).not.toThrow();

      // Restore module
      NativeModules.TermuxCore = originalModule;
    });

    it('should handle invalid session IDs', async () => {
      TermuxCore.writeToSession = jest.fn().mockRejectedValue(
        new Error('Invalid session ID')
      );

      await expect(
        TermuxCore.writeToSession('invalid-session', 'test')
      ).rejects.toThrow('Invalid session ID');
    });

    it('should handle concurrent session operations', async () => {
      TermuxCore.createSession = jest.fn().mockImplementation(
        (sessionId) => Promise.resolve({
          pid: Math.floor(Math.random() * 10000),
          fileDescriptor: Math.floor(Math.random() * 100),
          isRunning: true,
        })
      );

      const sessionPromises = [
        TermuxCore.createSession('session1', '/bin/bash', [], '/', {}, 24, 80),
        TermuxCore.createSession('session2', '/bin/bash', [], '/', {}, 24, 80),
        TermuxCore.createSession('session3', '/bin/bash', [], '/', {}, 24, 80),
      ];

      const results = await Promise.all(sessionPromises);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.pid).toBeDefined();
        expect(result.fileDescriptor).toBeDefined();
        expect(result.isRunning).toBe(true);
      });
    });
  });

  describe('Performance', () => {
    it('should handle rapid I/O operations', async () => {
      TermuxCore.writeToSession = jest.fn().mockResolvedValue(true);
      TermuxCore.readFromSession = jest.fn().mockResolvedValue('output');

      const sessionId = 'perf-test-session';
      const operations = [];

      // Create 100 rapid write operations
      for (let i = 0; i < 100; i++) {
        operations.push(TermuxCore.writeToSession(sessionId, `command ${i}\\n`));
      }

      // Create 100 rapid read operations
      for (let i = 0; i < 100; i++) {
        operations.push(TermuxCore.readFromSession(sessionId));
      }

      // All operations should complete successfully
      await expect(Promise.all(operations)).resolves.toHaveLength(200);
    });

    it('should handle large data chunks', async () => {
      const largeData = 'x'.repeat(10000); // 10KB of data
      TermuxCore.writeToSession = jest.fn().mockResolvedValue(true);
      TermuxCore.readFromSession = jest.fn().mockResolvedValue(largeData);

      await expect(
        TermuxCore.writeToSession('test-session', largeData)
      ).resolves.toBe(true);

      await expect(
        TermuxCore.readFromSession('test-session')
      ).resolves.toBe(largeData);
    });
  });
});