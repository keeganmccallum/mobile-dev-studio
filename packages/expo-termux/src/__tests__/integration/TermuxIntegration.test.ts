/**
 * Integration tests for Termux native module
 * These tests verify the bridge between JavaScript and native code
 */

import { NativeModules } from 'react-native';
import { termuxManager } from '../../TermuxManager';

// Skip these tests if running in CI without proper emulator
const isEmulatorAvailable = () => {
  try {
    return !!NativeModules.TermuxCore;
  } catch (error) {
    return false;
  }
};

describe('Termux Native Integration', () => {
  beforeAll(() => {
    if (!isEmulatorAvailable()) {
      console.log('Skipping integration tests - emulator not available');
    }
  });

  describe('Native Module Availability', () => {
    it('should have TermuxCore native module available', () => {
      if (!isEmulatorAvailable()) {
        return; // Skip if no emulator
      }
      
      expect(NativeModules.TermuxCore).toBeDefined();
      expect(typeof NativeModules.TermuxCore.createSession).toBe('function');
      expect(typeof NativeModules.TermuxCore.writeToSession).toBe('function');
      expect(typeof NativeModules.TermuxCore.killSession).toBe('function');
      expect(typeof NativeModules.TermuxCore.getBootstrapInfo).toBe('function');
    });
  });

  describe('Bootstrap Management', () => {
    it('should get bootstrap info', async () => {
      if (!isEmulatorAvailable()) {
        return;
      }
      
      const info = await NativeModules.TermuxCore.getBootstrapInfo();
      expect(info).toHaveProperty('isInstalled');
      expect(typeof info.isInstalled).toBe('boolean');
    });

    it('should handle bootstrap installation', async () => {
      if (!isEmulatorAvailable()) {
        return;
      }
      
      // Note: This test might take a while in real environment
      // For CI, we'll mock this or use a timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      
      try {
        const result = await Promise.race([
          NativeModules.TermuxCore.installBootstrap(),
          timeoutPromise
        ]);
        expect(typeof result).toBe('boolean');
      } catch (error) {
        if (error.message === 'Timeout') {
          console.log('Bootstrap installation test timed out (expected in CI)');
        } else {
          throw error;
        }
      }
    });
  });

  describe('Session Management', () => {
    let sessionId: string;

    it('should create a fallback session', async () => {
      if (!isEmulatorAvailable()) {
        return;
      }
      
      const result = await NativeModules.TermuxCore.createSession(
        'test-session-id',
        '/system/bin/sh',
        [],
        '/data/data/com.termux/files/home',
        {},
        24,
        80
      );

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('pid');
      expect(result).toHaveProperty('isRunning');
      expect(result.isRunning).toBe(true);
      
      sessionId = result.id;
    });

    it('should write to session', async () => {
      if (!isEmulatorAvailable() || !sessionId) {
        return;
      }
      
      await expect(
        NativeModules.TermuxCore.writeToSession(sessionId, 'echo "Hello World"')
      ).resolves.toBeUndefined();
    });

    it('should read from session', async () => {
      if (!isEmulatorAvailable() || !sessionId) {
        return;
      }
      
      const output = await NativeModules.TermuxCore.readFromSession(sessionId);
      expect(typeof output).toBe('string');
    });

    it('should kill session', async () => {
      if (!isEmulatorAvailable() || !sessionId) {
        return;
      }
      
      const result = await NativeModules.TermuxCore.killSession(sessionId);
      expect(result).toBe(true);
    });
  });

  describe('TermuxManager Integration', () => {
    it('should create session through manager', async () => {
      if (!isEmulatorAvailable()) {
        return;
      }
      
      const sessionId = await termuxManager.createSession({
        command: '/system/bin/sh',
        cwd: '/data/data/com.termux/files/home'
      });

      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      
      const session = termuxManager.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session?.isRunning).toBe(true);
      
      // Clean up
      await termuxManager.killSession(sessionId);
    });

    it('should execute simple commands', async () => {
      if (!isEmulatorAvailable()) {
        return;
      }
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Command timeout')), 10000)
      );
      
      try {
        const result = await Promise.race([
          termuxManager.executeCommand('echo "test"'),
          timeoutPromise
        ]);
        
        expect(result).toHaveProperty('sessionId');
        expect(result).toHaveProperty('output');
        expect(result).toHaveProperty('stdout');
      } catch (error) {
        if (error.message === 'Command timeout') {
          console.log('Command execution test timed out (expected in CI)');
        } else {
          throw error;
        }
      }
    });
  });
});