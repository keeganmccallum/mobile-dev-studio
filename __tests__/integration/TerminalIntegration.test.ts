import { TerminalService } from '../../src/services/TerminalService';
import { TermuxCore } from 'termux-core';

describe('Terminal Integration', () => {
  let terminalService: TerminalService;

  beforeEach(() => {
    terminalService = new TerminalService();
    jest.clearAllMocks();
  });

  describe('Complete Terminal Workflow', () => {
    it('should complete full initialization and session creation workflow', async () => {
      // Mock the bootstrap installation flow
      (TermuxCore.getBootstrapInfo as jest.Mock)
        .mockResolvedValueOnce({ installed: false, prefixPath: '' })
        .mockResolvedValueOnce({ installed: true, prefixPath: '/data/data/com.termux/files/usr' });
      
      (TermuxCore.installBootstrap as jest.Mock).mockResolvedValue(true);
      
      const mockSession = {
        id: 'session-123',
        pid: 1234,
        fileDescriptor: 5,
        isRunning: true
      };
      (TermuxCore.createSession as jest.Mock).mockResolvedValue(mockSession);
      (TermuxCore.writeToSession as jest.Mock).mockResolvedValue(undefined);

      // 1. Initialize terminal service
      const initResult = await terminalService.initialize();
      expect(initResult).toBe(true);

      // 2. Create a terminal session
      const processId = await terminalService.createProcess(
        '/data/data/com.termux/files/usr/bin/bash',
        ['-l'],
        '/data/data/com.termux/files/home'
      );

      expect(processId).toBeDefined();

      // 3. Verify process was created
      const process = terminalService.getProcess(processId);
      expect(process).toBeDefined();
      expect(process?.status).toBe('running');
      expect(process?.pid).toBe(1234);

      // 4. Write to the session
      const writeResult = await terminalService.writeToSession(processId, 'echo "Hello World"\n');
      expect(writeResult).toBe(true);

      // 5. Verify the native module was called correctly
      expect(TermuxCore.createSession).toHaveBeenCalledWith(
        '/data/data/com.termux/files/usr/bin/bash',
        ['-l'],
        '/data/data/com.termux/files/home',
        expect.objectContaining({
          PATH: '/data/data/com.termux/files/usr/bin:/data/data/com.termux/files/usr/bin/applets',
          HOME: '/data/data/com.termux/files/home',
          PREFIX: '/data/data/com.termux/files/usr',
          TMPDIR: '/data/data/com.termux/files/usr/tmp',
          TERM: 'xterm-256color',
          LANG: 'en_US.UTF-8'
        })
      );

      expect(TermuxCore.writeToSession).toHaveBeenCalledWith('session-123', 'echo "Hello World"\n');
    });

    it('should handle development server workflow', async () => {
      // Setup initialized terminal
      (TermuxCore.getBootstrapInfo as jest.Mock).mockResolvedValue({
        installed: true,
        prefixPath: '/data/data/com.termux/files/usr'
      });

      const mockSession = {
        id: 'session-npm',
        pid: 5678,
        fileDescriptor: 6,
        isRunning: true
      };
      (TermuxCore.createSession as jest.Mock).mockResolvedValue(mockSession);
      (TermuxCore.writeToSession as jest.Mock).mockResolvedValue(undefined);

      await terminalService.initialize();

      // Create session for npm commands
      const processId = await terminalService.createProcess('npm', ['start']);

      // Verify server status tracking
      expect(terminalService.getServerStatus().status).toBe('stopped');

      // Simulate server starting (would happen via session output in real scenario)
      const listener = jest.fn();
      terminalService.addEventListener(listener);

      // Simulate npm start output that triggers server status change
      terminalService['notifyServerStatus']('running', 'http://localhost:3000');

      expect(listener).toHaveBeenCalledWith({
        type: 'SERVER_STATUS_CHANGE',
        data: { status: 'running', url: 'http://localhost:3000' }
      });

      expect(terminalService.getServerStatus()).toEqual({
        status: 'running',
        url: 'http://localhost:3000'
      });
    });

    it('should handle multiple concurrent sessions', async () => {
      (TermuxCore.getBootstrapInfo as jest.Mock).mockResolvedValue({
        installed: true,
        prefixPath: '/data/data/com.termux/files/usr'
      });

      const mockSessions = [
        { id: 'session-1', pid: 1001, fileDescriptor: 5, isRunning: true },
        { id: 'session-2', pid: 1002, fileDescriptor: 6, isRunning: true },
        { id: 'session-3', pid: 1003, fileDescriptor: 7, isRunning: true }
      ];

      (TermuxCore.createSession as jest.Mock)
        .mockResolvedValueOnce(mockSessions[0])
        .mockResolvedValueOnce(mockSessions[1])
        .mockResolvedValueOnce(mockSessions[2]);

      await terminalService.initialize();

      // Create multiple sessions
      const processIds = await Promise.all([
        terminalService.createProcess('bash'),
        terminalService.createProcess('top'),
        terminalService.createProcess('tail', ['-f', '/var/log/messages'])
      ]);

      expect(processIds).toHaveLength(3);

      // Verify all processes are tracked
      const allProcesses = terminalService.getAllProcesses();
      expect(allProcesses).toHaveLength(3);
      expect(allProcesses.every(p => p.status === 'running')).toBe(true);

      // Verify status includes all processes
      const status = terminalService.getStatus();
      expect(status.processCount).toBe(3);
      expect(status.runningProcesses).toBe(3);
    });

    it('should cleanup sessions properly', async () => {
      (TermuxCore.getBootstrapInfo as jest.Mock).mockResolvedValue({
        installed: true,
        prefixPath: '/data/data/com.termux/files/usr'
      });

      const mockSession = {
        id: 'session-cleanup',
        pid: 9999,
        fileDescriptor: 8,
        isRunning: true
      };
      (TermuxCore.createSession as jest.Mock).mockResolvedValue(mockSession);
      (TermuxCore.killSession as jest.Mock).mockResolvedValue(true);

      await terminalService.initialize();

      const processId = await terminalService.createProcess('bash');
      
      // Kill the process
      const killResult = terminalService.killProcess(processId);
      expect(killResult).toBe(true);

      // Verify session was killed
      expect(TermuxCore.killSession).toHaveBeenCalledWith('session-cleanup');

      // Verify process status updated
      const process = terminalService.getProcess(processId);
      expect(process?.status).toBe('stopped');

      // Clear all processes
      terminalService.clearProcesses();
      expect(terminalService.getAllProcesses()).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle bootstrap installation failure gracefully', async () => {
      (TermuxCore.getBootstrapInfo as jest.Mock).mockResolvedValue({
        installed: false,
        prefixPath: ''
      });
      (TermuxCore.installBootstrap as jest.Mock).mockResolvedValue(false);

      const result = await terminalService.initialize();

      expect(result).toBe(false);
      expect(terminalService.getStatus().initialized).toBe(false);
    });

    it('should handle session creation failures', async () => {
      (TermuxCore.getBootstrapInfo as jest.Mock).mockResolvedValue({
        installed: true,
        prefixPath: '/data/data/com.termux/files/usr'
      });
      (TermuxCore.createSession as jest.Mock).mockRejectedValue(
        new Error('Session creation failed')
      );

      await terminalService.initialize();

      await expect(terminalService.createProcess('invalid-command'))
        .rejects.toThrow('Session creation failed');
    });

    it('should handle write failures gracefully', async () => {
      (TermuxCore.getBootstrapInfo as jest.Mock).mockResolvedValue({
        installed: true,
        prefixPath: '/data/data/com.termux/files/usr'
      });

      const mockSession = {
        id: 'session-write-fail',
        pid: 1111,
        fileDescriptor: 9,
        isRunning: true
      };
      (TermuxCore.createSession as jest.Mock).mockResolvedValue(mockSession);
      (TermuxCore.writeToSession as jest.Mock).mockRejectedValue(
        new Error('Write failed')
      );

      await terminalService.initialize();
      const processId = await terminalService.createProcess('bash');

      const result = await terminalService.writeToSession(processId, 'test');
      expect(result).toBe(false);
    });
  });
});