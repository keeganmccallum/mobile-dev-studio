/**
 * Simplified TerminalService tests that can run in CI
 */

// Mock dependencies
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/documents/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue('mock content'),
  readDirectoryAsync: jest.fn().mockResolvedValue(['file1', 'file2']),
}));

jest.mock('termux-core', () => ({
  TermuxCore: {
    getBootstrapInfo: jest.fn(),
    installBootstrap: jest.fn(),
    createSession: jest.fn(),
    writeToSession: jest.fn(),
    killSession: jest.fn(),
  }
}));

import { TerminalService } from '../../src/services/TerminalService';

describe('TerminalService (CI Safe)', () => {
  let terminalService: TerminalService;

  beforeEach(() => {
    terminalService = new TerminalService();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create a new TerminalService instance', () => {
      expect(terminalService).toBeInstanceOf(TerminalService);
    });

    it('should have correct initial status', () => {
      const status = terminalService.getStatus();
      
      expect(status).toEqual({
        initialized: false,
        processCount: 0,
        runningProcesses: 0,
        alpineRootPath: expect.stringContaining('alpine-root'),
        serverStatus: { status: 'stopped' }
      });
    });
  });

  describe('Process Management', () => {
    it('should return empty processes list initially', () => {
      const processes = terminalService.getAllProcesses();
      expect(processes).toEqual([]);
    });

    it('should return undefined for non-existent process', () => {
      const process = terminalService.getProcess('non-existent');
      expect(process).toBeUndefined();
    });

    it('should handle process killing for non-existent process', () => {
      const result = terminalService.killProcess('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('Server Status Management', () => {
    it('should have initial server status as stopped', () => {
      const status = terminalService.getServerStatus();
      expect(status.status).toBe('stopped');
    });

    it('should handle event listeners', () => {
      const listener = jest.fn();
      
      terminalService.addEventListener(listener);
      terminalService.removeEventListener(listener);
      
      // Should not throw errors
      expect(true).toBe(true);
    });
  });

  describe('File Operations', () => {
    it('should handle directory listing', async () => {
      const files = await terminalService.getDirectoryListing('/test');
      expect(Array.isArray(files)).toBe(true);
    });

    it('should handle file reading', async () => {
      const content = await terminalService.readFile('/test/file.txt');
      expect(typeof content).toBe('string');
    });
  });

  describe('Service Cleanup', () => {
    it('should clear all processes', () => {
      terminalService.clearProcesses();
      
      const processes = terminalService.getAllProcesses();
      expect(processes).toEqual([]);
    });

    it('should handle session writing for non-existent session', async () => {
      const result = await terminalService.writeToSession('invalid', 'test');
      expect(result).toBe(false);
    });
  });

  describe('Environment Setup', () => {
    it('should have proper alpine root path', () => {
      const status = terminalService.getStatus();
      expect(status.alpineRootPath).toContain('alpine-root');
    });

    it('should maintain process count correctly', () => {
      const status = terminalService.getStatus();
      expect(status.processCount).toBe(0);
      expect(status.runningProcesses).toBe(0);
    });
  });
});