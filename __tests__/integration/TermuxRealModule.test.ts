/**
 * Integration tests for real Termux native module
 * These tests run against the actual native module in Android emulator
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const describeIfAndroid = Platform.OS === 'android' ? describe : describe.skip;

describeIfAndroid('TermuxCore Native Module (Real)', () => {
  let TermuxCore: any;
  let termuxEmitter: NativeEventEmitter;

  beforeAll(() => {
    // Get the native module
    TermuxCore = NativeModules.TermuxCore;
    termuxEmitter = new NativeEventEmitter(TermuxCore);
    
    // Ensure module is available
    if (!TermuxCore) {
      throw new Error('TermuxCore native module not available - ensure app is running on Android device/emulator');
    }
  });

  describe('Module Availability', () => {
    it('should have TermuxCore module available', () => {
      expect(TermuxCore).toBeDefined();
    });

    it('should have required native methods', () => {
      expect(typeof TermuxCore.createSession).toBe('function');
      expect(typeof TermuxCore.killSession).toBe('function');
      expect(typeof TermuxCore.writeToSession).toBe('function');
      expect(typeof TermuxCore.readFromSession).toBe('function');
      expect(typeof TermuxCore.getBootstrapInfo).toBe('function');
      expect(typeof TermuxCore.installBootstrap).toBe('function');
    });

    it('should support event emission', () => {
      expect(termuxEmitter).toBeDefined();
      expect(typeof termuxEmitter.addListener).toBe('function');
    });
  });

  describe('Bootstrap Operations', () => {
    it('should check bootstrap installation status', async () => {
      const bootstrapInfo = await TermuxCore.getBootstrapInfo();
      
      expect(bootstrapInfo).toBeDefined();
      expect(typeof bootstrapInfo.isInstalled).toBe('boolean');
      
      if (bootstrapInfo.isInstalled) {
        expect(typeof bootstrapInfo.version).toBe('string');
        expect(typeof bootstrapInfo.installPath).toBe('string');
      }
    }, 30000);

    it('should install bootstrap if not present', async () => {
      const bootstrapInfo = await TermuxCore.getBootstrapInfo();
      
      if (!bootstrapInfo.isInstalled) {
        const installResult = await TermuxCore.installBootstrap();
        expect(installResult).toBe(true);
        
        // Verify installation
        const newBootstrapInfo = await TermuxCore.getBootstrapInfo();
        expect(newBootstrapInfo.isInstalled).toBe(true);
      }
    }, 120000); // Bootstrap installation can take time
  });

  describe('Session Management', () => {
    let sessionId: string;

    beforeEach(() => {
      sessionId = `test-session-${Date.now()}`;
    });

    afterEach(async () => {
      // Clean up session if it exists
      try {
        await TermuxCore.killSession(sessionId);
      } catch (error) {
        // Session might already be dead
      }
    });

    it('should create a session', async () => {
      const sessionInfo = await TermuxCore.createSession(
        sessionId,
        '/data/data/com.termux/files/usr/bin/bash',
        ['-l'],
        '/data/data/com.termux/files/home',
        {
          PATH: '/data/data/com.termux/files/usr/bin:/data/data/com.termux/files/usr/bin/applets',
          HOME: '/data/data/com.termux/files/home',
          PREFIX: '/data/data/com.termux/files/usr',
          TMPDIR: '/data/data/com.termux/files/usr/tmp',
          TERM: 'xterm-256color',
          LANG: 'en_US.UTF-8',
          USER: 'termux',
          SHELL: '/data/data/com.termux/files/usr/bin/bash',
        },
        24,
        80
      );

      expect(sessionInfo).toBeDefined();
      expect(typeof sessionInfo.pid).toBe('number');
      expect(sessionInfo.pid).toBeGreaterThan(0);
      expect(typeof sessionInfo.fileDescriptor).toBe('number');
      expect(sessionInfo.isRunning).toBe(true);
    }, 30000);

    it('should kill a session', async () => {
      // Create session first
      await TermuxCore.createSession(
        sessionId,
        '/data/data/com.termux/files/usr/bin/bash',
        ['-l'],
        '/data/data/com.termux/files/home',
        {
          PATH: '/data/data/com.termux/files/usr/bin:/data/data/com.termux/files/usr/bin/applets',
          HOME: '/data/data/com.termux/files/home',
        },
        24,
        80
      );

      // Kill session
      const result = await TermuxCore.killSession(sessionId);
      expect(result).toBe(true);
    }, 30000);

    it('should handle session creation failures gracefully', async () => {
      // Try to create session with invalid command
      await expect(
        TermuxCore.createSession(
          sessionId,
          '/invalid/command',
          [],
          '/data/data/com.termux/files/home',
          {},
          24,
          80
        )
      ).rejects.toThrow();
    });
  });

  describe('Session I/O Operations', () => {
    let sessionId: string;

    beforeEach(async () => {
      sessionId = `test-io-session-${Date.now()}`;
      
      // Create session for I/O tests
      await TermuxCore.createSession(
        sessionId,
        '/data/data/com.termux/files/usr/bin/bash',
        ['-l'],
        '/data/data/com.termux/files/home',
        {
          PATH: '/data/data/com.termux/files/usr/bin:/data/data/com.termux/files/usr/bin/applets',
          HOME: '/data/data/com.termux/files/home',
        },
        24,
        80
      );
    });

    afterEach(async () => {
      try {
        await TermuxCore.killSession(sessionId);
      } catch (error) {
        // Session might already be dead
      }
    });

    it('should write data to session', async () => {
      const result = await TermuxCore.writeToSession(sessionId, 'echo "test"\\n');
      expect(result).toBe(true);
    }, 10000);

    it('should read data from session', async () => {
      // Write a command first
      await TermuxCore.writeToSession(sessionId, 'echo "hello world"\\n');
      
      // Give some time for command to execute
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Read output
      const output = await TermuxCore.readFromSession(sessionId);
      expect(typeof output).toBe('string');
      // Output might be empty if command hasn't finished yet
    }, 10000);

    it('should handle write failures for invalid session', async () => {
      await expect(
        TermuxCore.writeToSession('invalid-session', 'test')
      ).rejects.toThrow();
    });

    it('should handle read failures for invalid session', async () => {
      await expect(
        TermuxCore.readFromSession('invalid-session')
      ).rejects.toThrow();
    });
  });

  describe('Event System', () => {
    let sessionId: string;
    let subscription: any;

    beforeEach(async () => {
      sessionId = `test-event-session-${Date.now()}`;
    });

    afterEach(async () => {
      if (subscription) {
        subscription.remove();
      }
      try {
        await TermuxCore.killSession(sessionId);
      } catch (error) {
        // Session might already be dead
      }
    });

    it('should emit session output events', (done) => {
      const timeout = setTimeout(() => {
        done(new Error('Test timeout - no output event received'));
      }, 15000);

      subscription = termuxEmitter.addListener('onSessionOutput', (event) => {
        if (event.sessionId === sessionId) {
          clearTimeout(timeout);
          expect(event.sessionId).toBe(sessionId);
          expect(typeof event.data).toBe('string');
          done();
        }
      });

      // Create session and write command
      TermuxCore.createSession(
        sessionId,
        '/data/data/com.termux/files/usr/bin/bash',
        ['-l'],
        '/data/data/com.termux/files/home',
        {
          PATH: '/data/data/com.termux/files/usr/bin:/data/data/com.termux/files/usr/bin/applets',
          HOME: '/data/data/com.termux/files/home',
        },
        24,
        80
      ).then(() => {
        // Wait a bit for session to start, then write command
        setTimeout(() => {
          TermuxCore.writeToSession(sessionId, 'echo "test output"\\n');
        }, 1000);
      });
    });

    it('should emit session exit events', (done) => {
      const timeout = setTimeout(() => {
        done(new Error('Test timeout - no exit event received'));
      }, 15000);

      subscription = termuxEmitter.addListener('onSessionExit', (event) => {
        if (event.sessionId === sessionId) {
          clearTimeout(timeout);
          expect(event.sessionId).toBe(sessionId);
          expect(typeof event.exitCode).toBe('number');
          done();
        }
      });

      // Create session and immediately exit
      TermuxCore.createSession(
        sessionId,
        '/data/data/com.termux/files/usr/bin/bash',
        ['-l'],
        '/data/data/com.termux/files/home',
        {
          PATH: '/data/data/com.termux/files/usr/bin:/data/data/com.termux/files/usr/bin/applets',
          HOME: '/data/data/com.termux/files/home',
        },
        24,
        80
      ).then(() => {
        // Wait a bit for session to start, then exit
        setTimeout(() => {
          TermuxCore.writeToSession(sessionId, 'exit\\n');
        }, 1000);
      });
    });

    it('should handle listener removal', (done) => {
      subscription = termuxEmitter.addListener('onSessionOutput', () => {
        done(new Error('Event listener should have been removed'));
      });

      // Remove listener
      subscription.remove();

      // Create session and write command - should not trigger removed listener
      TermuxCore.createSession(
        sessionId,
        '/data/data/com.termux/files/usr/bin/bash',
        ['-l'],
        '/data/data/com.termux/files/home',
        {},
        24,
        80
      ).then(() => {
        setTimeout(() => {
          TermuxCore.writeToSession(sessionId, 'echo "test"\\n');
        }, 1000);
      });

      // If no event is received within 3 seconds, test passes
      setTimeout(() => {
        done();
      }, 3000);
    });
  });

  describe('Performance and Stress Tests', () => {
    it('should handle multiple concurrent sessions', async () => {
      const sessionIds: string[] = [];
      const sessionPromises: Promise<any>[] = [];

      // Create 3 concurrent sessions
      for (let i = 0; i < 3; i++) {
        const sessionId = `stress-session-${i}-${Date.now()}`;
        sessionIds.push(sessionId);
        
        sessionPromises.push(
          TermuxCore.createSession(
            sessionId,
            '/data/data/com.termux/files/usr/bin/bash',
            ['-l'],
            '/data/data/com.termux/files/home',
            {
              PATH: '/data/data/com.termux/files/usr/bin:/data/data/com.termux/files/usr/bin/applets',
              HOME: '/data/data/com.termux/files/home',
            },
            24,
            80
          )
        );
      }

      // Wait for all sessions to be created
      const results = await Promise.all(sessionPromises);
      
      // Verify all sessions were created successfully
      results.forEach((result, index) => {
        expect(result.pid).toBeGreaterThan(0);
        expect(result.isRunning).toBe(true);
      });

      // Clean up all sessions
      const killPromises = sessionIds.map(id => TermuxCore.killSession(id));
      await Promise.allSettled(killPromises);
    }, 60000);

    it('should handle rapid I/O operations', async () => {
      const sessionId = `rapid-io-session-${Date.now()}`;
      
      // Create session
      await TermuxCore.createSession(
        sessionId,
        '/data/data/com.termux/files/usr/bin/bash',
        ['-l'],
        '/data/data/com.termux/files/home',
        {
          PATH: '/data/data/com.termux/files/usr/bin:/data/data/com.termux/files/usr/bin/applets',
          HOME: '/data/data/com.termux/files/home',
        },
        24,
        80
      );

      // Perform rapid write operations
      const writePromises: Promise<any>[] = [];
      for (let i = 0; i < 10; i++) {
        writePromises.push(
          TermuxCore.writeToSession(sessionId, `echo "command ${i}"\\n`)
        );
      }

      // All writes should succeed
      const results = await Promise.all(writePromises);
      results.forEach(result => {
        expect(result).toBe(true);
      });

      // Clean up
      await TermuxCore.killSession(sessionId);
    }, 30000);
  });
});