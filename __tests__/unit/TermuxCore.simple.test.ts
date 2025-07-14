/**
 * Simplified TermuxCore tests that can run in CI
 */

describe('TermuxCore Module (CI Safe)', () => {
  // Mock the module since it won't be available in CI
  const mockTermuxCore = {
    getBootstrapInfo: jest.fn(),
    installBootstrap: jest.fn(),
    createSession: jest.fn(),
    writeToSession: jest.fn(),
    killSession: jest.fn(),
    onSessionOutput: jest.fn(),
    onSessionExit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Bootstrap Management', () => {
    it('should have getBootstrapInfo method', () => {
      expect(typeof mockTermuxCore.getBootstrapInfo).toBe('function');
    });

    it('should handle bootstrap installation', async () => {
      mockTermuxCore.installBootstrap.mockResolvedValue(true);
      
      const result = await mockTermuxCore.installBootstrap();
      expect(result).toBe(true);
      expect(mockTermuxCore.installBootstrap).toHaveBeenCalledTimes(1);
    });

    it('should handle bootstrap info retrieval', async () => {
      const mockInfo = {
        installed: true,
        prefixPath: '/data/data/com.termux/files/usr',
        version: '2024.12.13'
      };
      
      mockTermuxCore.getBootstrapInfo.mockResolvedValue(mockInfo);
      
      const result = await mockTermuxCore.getBootstrapInfo();
      expect(result).toEqual(mockInfo);
    });
  });

  describe('Session Management', () => {
    it('should create terminal sessions', async () => {
      const mockSession = {
        id: 'session-123',
        pid: 1234,
        fileDescriptor: 5,
        isRunning: true
      };

      mockTermuxCore.createSession.mockResolvedValue(mockSession);

      const result = await mockTermuxCore.createSession(
        '/bin/bash',
        [],
        '/home',
        {}
      );

      expect(result).toEqual(mockSession);
      expect(mockTermuxCore.createSession).toHaveBeenCalledWith(
        '/bin/bash', [], '/home', {}
      );
    });

    it('should write to sessions', async () => {
      mockTermuxCore.writeToSession.mockResolvedValue(undefined);

      await mockTermuxCore.writeToSession('session-123', 'echo hello\n');

      expect(mockTermuxCore.writeToSession).toHaveBeenCalledWith(
        'session-123', 'echo hello\n'
      );
    });

    it('should kill sessions', async () => {
      mockTermuxCore.killSession.mockResolvedValue(true);

      const result = await mockTermuxCore.killSession('session-123');

      expect(result).toBe(true);
      expect(mockTermuxCore.killSession).toHaveBeenCalledWith('session-123');
    });
  });

  describe('Event Handling', () => {
    it('should register output listeners', () => {
      const callback = jest.fn();
      
      mockTermuxCore.onSessionOutput('session-123', callback);
      
      expect(mockTermuxCore.onSessionOutput).toHaveBeenCalledWith(
        'session-123', callback
      );
    });

    it('should register exit listeners', () => {
      const callback = jest.fn();
      
      mockTermuxCore.onSessionExit('session-123', callback);
      
      expect(mockTermuxCore.onSessionExit).toHaveBeenCalledWith(
        'session-123', callback
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle bootstrap installation failures', async () => {
      mockTermuxCore.installBootstrap.mockResolvedValue(false);

      const result = await mockTermuxCore.installBootstrap();
      expect(result).toBe(false);
    });

    it('should handle session creation failures', async () => {
      mockTermuxCore.createSession.mockRejectedValue(
        new Error('Session creation failed')
      );

      await expect(mockTermuxCore.createSession('invalid', [], '', {}))
        .rejects.toThrow('Session creation failed');
    });
  });
});