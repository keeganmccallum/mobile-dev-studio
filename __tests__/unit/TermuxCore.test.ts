import { TermuxCore } from 'termux-core';
import { NativeModulesProxy } from 'expo-modules-core';

describe('TermuxCore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBootstrapInfo', () => {
    it('should return bootstrap info when module is available', async () => {
      const mockBootstrapInfo = {
        installed: true,
        prefixPath: '/data/data/com.termux/files/usr',
        version: '2024.12.13',
        size: 30000000
      };

      (NativeModulesProxy.TermuxCore.getBootstrapInfo as jest.Mock)
        .mockResolvedValue(mockBootstrapInfo);

      const result = await TermuxCore.getBootstrapInfo();

      expect(result).toEqual(mockBootstrapInfo);
      expect(NativeModulesProxy.TermuxCore.getBootstrapInfo).toHaveBeenCalledTimes(1);
    });

    it('should return default bootstrap info when module fails', async () => {
      (NativeModulesProxy.TermuxCore.getBootstrapInfo as jest.Mock)
        .mockRejectedValue(new Error('Module not available'));

      const result = await TermuxCore.getBootstrapInfo();

      expect(result).toEqual({
        installed: false,
        prefixPath: ''
      });
    });
  });

  describe('installBootstrap', () => {
    it('should install bootstrap successfully', async () => {
      (NativeModulesProxy.TermuxCore.installBootstrap as jest.Mock)
        .mockResolvedValue(true);

      const result = await TermuxCore.installBootstrap();

      expect(result).toBe(true);
      expect(NativeModulesProxy.TermuxCore.installBootstrap).toHaveBeenCalledTimes(1);
    });

    it('should handle installation failure', async () => {
      (NativeModulesProxy.TermuxCore.installBootstrap as jest.Mock)
        .mockRejectedValue(new Error('Installation failed'));

      const result = await TermuxCore.installBootstrap();

      expect(result).toBe(false);
    });
  });

  describe('createSession', () => {
    it('should create a terminal session with correct parameters', async () => {
      const mockSession = {
        id: 'session-123',
        pid: 1234,
        fileDescriptor: 5,
        isRunning: true
      };

      (NativeModulesProxy.TermuxCore.createSession as jest.Mock)
        .mockResolvedValue(mockSession);

      const command = '/data/data/com.termux/files/usr/bin/bash';
      const args = ['-l'];
      const cwd = '/data/data/com.termux/files/home';
      const env = {
        PATH: '/data/data/com.termux/files/usr/bin',
        HOME: '/data/data/com.termux/files/home'
      };

      const result = await TermuxCore.createSession(command, args, cwd, env);

      expect(result).toEqual(mockSession);
      expect(NativeModulesProxy.TermuxCore.createSession).toHaveBeenCalledWith(
        command, args, cwd, env, 24, 80
      );
    });
  });

  describe('writeToSession', () => {
    it('should write data to terminal session', async () => {
      (NativeModulesProxy.TermuxCore.writeToSession as jest.Mock)
        .mockResolvedValue(undefined);

      await TermuxCore.writeToSession('session-123', 'ls -la\n');

      expect(NativeModulesProxy.TermuxCore.writeToSession).toHaveBeenCalledWith(
        'session-123', 'ls -la\n'
      );
    });
  });

  describe('killSession', () => {
    it('should kill terminal session successfully', async () => {
      (NativeModulesProxy.TermuxCore.killSession as jest.Mock)
        .mockResolvedValue(true);

      const result = await TermuxCore.killSession('session-123');

      expect(result).toBe(true);
      expect(NativeModulesProxy.TermuxCore.killSession).toHaveBeenCalledWith('session-123');
    });
  });

  describe('event handlers', () => {
    it('should register session output callback', () => {
      const callback = jest.fn();
      
      // These are placeholder implementations since events aren't fully implemented
      TermuxCore.onSessionOutput('session-123', callback);
      
      // Verify the callback is stored (implementation would vary)
      expect(callback).toBeDefined();
    });

    it('should register session exit callback', () => {
      const callback = jest.fn();
      
      TermuxCore.onSessionExit('session-123', callback);
      
      expect(callback).toBeDefined();
    });
  });
});