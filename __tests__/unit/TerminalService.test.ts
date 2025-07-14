import { TerminalService } from '../../src/services/TerminalService';
import * as FileSystem from 'expo-file-system';
import { TermuxCore } from 'termux-core';

// Mock the TermuxCore module
jest.mock('termux-core');

describe('TerminalService', () => {
  let terminalService: TerminalService;

  beforeEach(() => {
    terminalService = new TerminalService();
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully when bootstrap is already installed', async () => {
      (TermuxCore.getBootstrapInfo as jest.Mock).mockResolvedValue({
        installed: true,
        prefixPath: '/data/data/com.termux/files/usr',
        version: '2024.12.13'
      });

      const result = await terminalService.initialize();

      expect(result).toBe(true);
      expect(TermuxCore.getBootstrapInfo).toHaveBeenCalledTimes(2); // Called twice for check and verify
    });

    it('should install bootstrap when not installed', async () => {
      (TermuxCore.getBootstrapInfo as jest.Mock)
        .mockResolvedValueOnce({ installed: false, prefixPath: '' })
        .mockResolvedValueOnce({ installed: true, prefixPath: '/data/data/com.termux/files/usr' });
      
      (TermuxCore.installBootstrap as jest.Mock).mockResolvedValue(true);

      const result = await terminalService.initialize();

      expect(result).toBe(true);
      expect(TermuxCore.installBootstrap).toHaveBeenCalledTimes(1);
    });

    it('should fail when bootstrap installation fails', async () => {
      (TermuxCore.getBootstrapInfo as jest.Mock).mockResolvedValue({
        installed: false,
        prefixPath: ''
      });
      (TermuxCore.installBootstrap as jest.Mock).mockResolvedValue(false);

      const result = await terminalService.initialize();

      expect(result).toBe(false);
    });

    it('should handle initialization errors gracefully', async () => {
      (TermuxCore.getBootstrapInfo as jest.Mock).mockRejectedValue(
        new Error('Native module error')
      );

      const result = await terminalService.initialize();

      expect(result).toBe(false);
    });
  });

  describe('createProcess', () => {
    beforeEach(async () => {
      (TermuxCore.getBootstrapInfo as jest.Mock).mockResolvedValue({
        installed: true,
        prefixPath: '/data/data/com.termux/files/usr'
      });
      await terminalService.initialize();
    });

    it('should create a new terminal process', async () => {
      const mockSession = {
        id: 'session-123',
        pid: 1234,
        fileDescriptor: 5,
        isRunning: true
      };

      (TermuxCore.createSession as jest.Mock).mockResolvedValue(mockSession);

      const processId = await terminalService.createProcess('ls', ['-la'], '/home');

      expect(processId).toBeDefined();
      expect(TermuxCore.createSession).toHaveBeenCalledWith(
        'ls',
        ['-la'],
        '/home',
        expect.objectContaining({
          PATH: '/data/data/com.termux/files/usr/bin:/data/data/com.termux/files/usr/bin/applets',
          HOME: '/data/data/com.termux/files/home',
          PREFIX: '/data/data/com.termux/files/usr'
        })
      );

      const process = terminalService.getProcess(processId);
      expect(process).toBeDefined();
      expect(process?.command).toBe('ls');
      expect(process?.args).toEqual(['-la']);
      expect(process?.pid).toBe(1234);
    });

    it('should handle session creation failure', async () => {
      (TermuxCore.createSession as jest.Mock).mockRejectedValue(
        new Error('Failed to create session')
      );

      await expect(terminalService.createProcess('invalid-command'))
        .rejects.toThrow('Failed to create session');
    });
  });

  describe('writeToSession', () => {
    it('should write data to existing session', async () => {
      const mockSession = {
        id: 'session-123',
        pid: 1234,
        fileDescriptor: 5,
        isRunning: true
      };

      (TermuxCore.getBootstrapInfo as jest.Mock).mockResolvedValue({
        installed: true,
        prefixPath: '/data/data/com.termux/files/usr'
      });
      (TermuxCore.createSession as jest.Mock).mockResolvedValue(mockSession);
      (TermuxCore.writeToSession as jest.Mock).mockResolvedValue(undefined);

      await terminalService.initialize();
      const processId = await terminalService.createProcess('bash');

      const result = await terminalService.writeToSession(processId, 'echo hello\n');

      expect(result).toBe(true);
      expect(TermuxCore.writeToSession).toHaveBeenCalledWith('session-123', 'echo hello\n');
    });

    it('should return false for non-existent session', async () => {
      const result = await terminalService.writeToSession('invalid-id', 'test');

      expect(result).toBe(false);
      expect(TermuxCore.writeToSession).not.toHaveBeenCalled();
    });
  });

  describe('killProcess', () => {
    it('should kill existing process and session', async () => {
      const mockSession = {
        id: 'session-123',
        pid: 1234,
        fileDescriptor: 5,
        isRunning: true
      };

      (TermuxCore.getBootstrapInfo as jest.Mock).mockResolvedValue({
        installed: true,
        prefixPath: '/data/data/com.termux/files/usr'
      });
      (TermuxCore.createSession as jest.Mock).mockResolvedValue(mockSession);
      (TermuxCore.killSession as jest.Mock).mockResolvedValue(true);

      await terminalService.initialize();
      const processId = await terminalService.createProcess('bash');

      const result = terminalService.killProcess(processId);

      expect(result).toBe(true);
      expect(TermuxCore.killSession).toHaveBeenCalledWith('session-123');

      const process = terminalService.getProcess(processId);
      expect(process?.status).toBe('stopped');
    });
  });

  describe('server status management', () => {
    it('should notify server status changes', () => {
      const listener = jest.fn();
      terminalService.addEventListener(listener);

      // Simulate server status change (would happen in real implementation)
      terminalService['notifyServerStatus']('running', 'http://localhost:3000');

      expect(listener).toHaveBeenCalledWith({
        type: 'SERVER_STATUS_CHANGE',
        data: { status: 'running', url: 'http://localhost:3000' }
      });
    });

    it('should return current server status', () => {
      const status = terminalService.getServerStatus();

      expect(status).toEqual({ status: 'stopped' });
    });

    it('should remove event listeners', () => {
      const listener = jest.fn();
      terminalService.addEventListener(listener);
      terminalService.removeEventListener(listener);

      terminalService['notifyServerStatus']('running', 'http://localhost:3000');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    it('should return comprehensive service status', async () => {
      (TermuxCore.getBootstrapInfo as jest.Mock).mockResolvedValue({
        installed: true,
        prefixPath: '/data/data/com.termux/files/usr'
      });

      await terminalService.initialize();

      const status = terminalService.getStatus();

      expect(status).toEqual({
        initialized: true,
        processCount: 0,
        runningProcesses: 0,
        alpineRootPath: '/data/data/com.termux/files/usr',
        serverStatus: { status: 'stopped' }
      });
    });
  });
});