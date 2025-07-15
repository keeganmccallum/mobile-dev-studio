/**
 * React Native Termux Library
 * 
 * Easy-to-use interface for native Termux integration with React Native
 * 
 * Features:
 * - Multiple terminal sessions
 * - xterm.js integration for rendering
 * - Native Android Termux backend
 * - Real command execution
 * - Session management
 * 
 * @example
 * import { TermuxTerminal, TermuxSession, termuxManager } from './lib/termux';
 * 
 * // Simple component usage
 * <TermuxTerminal 
 *   sessionId="main"
 *   onData={(data) => console.log('Output:', data)}
 *   onExit={(code) => console.log('Exit code:', code)}
 * />
 * 
 * // Programmatic session control
 * const session = await termuxManager.createSession('build');
 * session.write('npm run build\n');
 * session.onData((data) => console.log(data));
 * 
 * // Execute commands
 * const result = await termuxManager.executeCommand('ls -la');
 * console.log(result.stdout);
 */

export { TermuxManager, TermuxSession, termuxManager } from './TermuxManager';
export { default as TermuxTerminal } from './TermuxTerminal';
export type { TermuxSessionConfig, TermuxSessionInfo } from './TermuxManager';
export type { TermuxTerminalProps, TermuxTerminalRef } from './TermuxTerminal';