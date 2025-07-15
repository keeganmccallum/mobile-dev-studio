/**
 * Unit tests for TermuxSession
 */

import { TermuxSession } from '../../src/lib/termux/TermuxManager';
import { NativeModules } from 'react-native';

// Mock React Native modules
const mockTermuxCore = {
  createSession: jest.fn(),
  killSession: jest.fn(),
  writeToSession: jest.fn(),
  readFromSession: jest.fn(),
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

describe('TermuxSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Session Creation', () => {
    it('should create session with auto-generated ID', () => {
      const session = new TermuxSession();
      
      expect(session.id).toBeDefined();
      expect(session.id).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(session.pid).toBe(0);
      expect(session.isRunning).toBe(false);
    });

    it('should create session with custom ID', () => {
      const customId = 'my-custom-session';
      const session = new TermuxSession(customId);
      
      expect(session.id).toBe(customId);
    });

    it('should set up event listeners on creation', () => {
      new TermuxSession();
      
      expect(mockNativeEventEmitter.addListener).toHaveBeenCalledWith(
        'onSessionOutput',
        expect.any(Function)
      );
      expect(mockNativeEventEmitter.addListener).toHaveBeenCalledWith(
        'onSessionExit',
        expect.any(Function)
      );
    });
  });

  describe('Session Start', () => {
    it('should start session with default configuration', async () => {
      mockTermuxCore.createSession.mockResolvedValue({
        pid: 1234,
        fileDescriptor: 5,
        isRunning: true,
      });

      const session = new TermuxSession('test-session');
      const sessionInfo = await session.start();

      expect(mockTermuxCore.createSession).toHaveBeenCalledWith(
        'test-session',
        '/data/data/com.termux/files/usr/bin/bash',
        ['-l'],
        '/data/data/com.termux/files/home',
        expect.objectContaining({
          PATH: '/data/data/com.termux/files/usr/bin:/data/data/com.termux/files/usr/bin/applets',
          HOME: '/data/data/com.termux/files/home',
          PREFIX: '/data/data/com.termux/files/usr',
          TMPDIR: '/data/data/com.termux/files/usr/tmp',
          TERM: 'xterm-256color',
          LANG: 'en_US.UTF-8',
          USER: 'termux',
          SHELL: '/data/data/com.termux/files/usr/bin/bash',
        }),
        24,
        80
      );

      expect(sessionInfo).toEqual({
        id: 'test-session',
        pid: 1234,
        fileDescriptor: 5,
        isRunning: true,
      });

      expect(session.pid).toBe(1234);
      expect(session.isRunning).toBe(true);
    });

    it('should start session with custom configuration', async () => {
      mockTermuxCore.createSession.mockResolvedValue({
        pid: 5678,
        fileDescriptor: 7,
        isRunning: true,
      });

      const session = new TermuxSession('custom-session');
      const config = {
        command: '/usr/bin/fish',
        args: ['-i'],
        workingDirectory: '/home/user',
        environment: {
          CUSTOM_VAR: 'custom_value',
          PATH: '/custom/path',
        },
        rows: 30,
        cols: 120,
      };

      await session.start(config);

      expect(mockTermuxCore.createSession).toHaveBeenCalledWith(
        'custom-session',
        '/usr/bin/fish',
        ['-i'],
        '/home/user',
        expect.objectContaining({
          CUSTOM_VAR: 'custom_value',
          PATH: '/custom/path',
          HOME: '/data/data/com.termux/files/home', // Default values should still be present
        }),
        30,
        120
      );
    });

    it('should handle session start errors', async () => {
      mockTermuxCore.createSession.mockRejectedValue(new Error('Native start failed'));

      const session = new TermuxSession('error-session');
      
      await expect(session.start()).rejects.toThrow('Failed to start Termux session');
    });
  });

  describe('Session I/O', () => {
    let session: TermuxSession;

    beforeEach(async () => {
      mockTermuxCore.createSession.mockResolvedValue({
        pid: 1234,
        fileDescriptor: 5,
        isRunning: true,
      });
      mockTermuxCore.writeToSession.mockResolvedValue(true);
      mockTermuxCore.readFromSession.mockResolvedValue('output data');

      session = new TermuxSession('io-session');
      await session.start();
    });

    it('should write data to session', async () => {
      const data = 'echo "hello"\\n';
      
      await session.write(data);
      
      expect(mockTermuxCore.writeToSession).toHaveBeenCalledWith('io-session', data);
    });

    it('should read data from session', async () => {
      const result = await session.read();
      
      expect(mockTermuxCore.readFromSession).toHaveBeenCalledWith('io-session');
      expect(result).toBe('output data');
    });

    it('should handle write errors', async () => {
      mockTermuxCore.writeToSession.mockRejectedValue(new Error('Write failed'));
      
      await expect(session.write('test')).rejects.toThrow('Failed to write to session');
    });

    it('should handle read errors', async () => {
      mockTermuxCore.readFromSession.mockRejectedValue(new Error('Read failed'));
      
      await expect(session.read()).rejects.toThrow('Failed to read from session');
    });

    it('should prevent I/O operations on stopped session', async () => {
      session.isRunning = false;
      
      await expect(session.write('test')).rejects.toThrow('Session is not running');
      await expect(session.read()).rejects.toThrow('Session is not running');
    });
  });

  describe('Event Handling', () => {
    let session: TermuxSession;
    let outputCallback: (event: any) => void;
    let exitCallback: (event: any) => void;

    beforeEach(async () => {
      mockTermuxCore.createSession.mockResolvedValue({
        pid: 1234,
        fileDescriptor: 5,
        isRunning: true,
      });

      // Capture event callbacks
      mockNativeEventEmitter.addListener.mockImplementation((event, callback) => {
        if (event === 'onSessionOutput') {
          outputCallback = callback;
        } else if (event === 'onSessionExit') {
          exitCallback = callback;
        }
        return { remove: jest.fn() };
      });

      session = new TermuxSession('event-session');
      await session.start();
    });

    it('should handle data events for correct session', () => {
      const dataListener = jest.fn();
      session.onData(dataListener);

      // Trigger data event for this session
      outputCallback({
        sessionId: 'event-session',
        data: 'test output',
      });

      expect(dataListener).toHaveBeenCalledWith('test output');
    });

    it('should ignore data events for other sessions', () => {
      const dataListener = jest.fn();
      session.onData(dataListener);

      // Trigger data event for different session
      outputCallback({
        sessionId: 'other-session',
        data: 'test output',
      });

      expect(dataListener).not.toHaveBeenCalled();
    });

    it('should handle exit events', () => {
      const exitListener = jest.fn();
      session.onExit(exitListener);

      // Trigger exit event
      exitCallback({
        sessionId: 'event-session',
        exitCode: 0,
      });

      expect(exitListener).toHaveBeenCalledWith(0);
      expect(session.isRunning).toBe(false);
    });

    it('should return unsubscribe function for data listeners', () => {
      const dataListener = jest.fn();
      const unsubscribe = session.onData(dataListener);

      // Trigger data event
      outputCallback({
        sessionId: 'event-session',
        data: 'test output',
      });

      expect(dataListener).toHaveBeenCalledWith('test output');

      // Unsubscribe and test again
      unsubscribe();
      dataListener.mockClear();

      outputCallback({
        sessionId: 'event-session',
        data: 'test output 2',
      });

      expect(dataListener).not.toHaveBeenCalled();
    });

    it('should return unsubscribe function for exit listeners', () => {
      const exitListener = jest.fn();
      const unsubscribe = session.onExit(exitListener);

      // Trigger exit event
      exitCallback({
        sessionId: 'event-session',
        exitCode: 0,
      });

      expect(exitListener).toHaveBeenCalledWith(0);

      // Unsubscribe and test again
      unsubscribe();
      exitListener.mockClear();

      exitCallback({
        sessionId: 'event-session',
        exitCode: 1,
      });

      expect(exitListener).not.toHaveBeenCalled();
    });

    it('should support multiple data listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      session.onData(listener1);
      session.onData(listener2);

      outputCallback({
        sessionId: 'event-session',
        data: 'test output',
      });

      expect(listener1).toHaveBeenCalledWith('test output');
      expect(listener2).toHaveBeenCalledWith('test output');
    });
  });

  describe('Session Termination', () => {
    let session: TermuxSession;

    beforeEach(async () => {
      mockTermuxCore.createSession.mockResolvedValue({
        pid: 1234,
        fileDescriptor: 5,
        isRunning: true,
      });
      mockTermuxCore.killSession.mockResolvedValue(true);

      session = new TermuxSession('kill-session');
      await session.start();
    });

    it('should kill session', async () => {
      await session.kill();
      
      expect(mockTermuxCore.killSession).toHaveBeenCalledWith('kill-session');
      expect(session.isRunning).toBe(false);
    });

    it('should handle kill errors', async () => {
      mockTermuxCore.killSession.mockRejectedValue(new Error('Kill failed'));
      
      await expect(session.kill()).rejects.toThrow('Failed to kill session');
    });

    it('should not attempt to kill already stopped session', async () => {
      session.isRunning = false;
      
      await session.kill();
      
      expect(mockTermuxCore.killSession).not.toHaveBeenCalled();
    });
  });

  describe('Session Cleanup', () => {
    it('should clean up event listeners and subscriptions', () => {
      const mockSubscription = { remove: jest.fn() };
      mockNativeEventEmitter.addListener.mockReturnValue(mockSubscription);

      const session = new TermuxSession('cleanup-session');
      session.destroy();

      expect(mockSubscription.remove).toHaveBeenCalled();
    });

    it('should clear all listeners on destroy', () => {
      const session = new TermuxSession('cleanup-session');
      const dataListener = jest.fn();
      const exitListener = jest.fn();
      
      session.onData(dataListener);
      session.onExit(exitListener);
      
      session.destroy();
      
      // Verify internal listener sets are cleared
      expect((session as any).dataListeners.size).toBe(0);
      expect((session as any).exitListeners.size).toBe(0);
    });
  });
});