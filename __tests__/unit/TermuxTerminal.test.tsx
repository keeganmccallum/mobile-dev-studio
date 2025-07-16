/**
 * Unit tests for TermuxTerminal React component
 */

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import TermuxTerminal from '../../src/lib/termux/TermuxTerminal';
import { TermuxSession, termuxManager } from '../../src/lib/termux/TermuxManager';

// Mock React Native WebView
const mockWebView = {
  postMessage: jest.fn(),
};

jest.mock('react-native-webview', () => ({
  WebView: React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => mockWebView);
    return React.createElement('WebView', props);
  }),
}));

// Mock termuxManager
jest.mock('../../src/lib/termux/TermuxManager', () => ({
  termuxManager: {
    getSession: jest.fn(),
    createSession: jest.fn(),
  },
  TermuxSession: jest.fn(),
}));

// Mock session instance
const mockSession = {
  id: 'test-session',
  pid: 1234,
  isRunning: true,
  write: jest.fn(),
  onData: jest.fn(),
  onExit: jest.fn(),
};

describe('TermuxTerminal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWebView.postMessage.mockClear();
    (termuxManager.createSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('Basic Rendering', () => {
    it('should render terminal component', () => {
      const { getByTestId } = render(
        <TermuxTerminal testID="terminal-component" />
      );

      expect(getByTestId('terminal-component')).toBeTruthy();
    });

    it('should render with custom style', () => {
      const customStyle = { backgroundColor: 'red' };
      const { getByTestId } = render(
        <TermuxTerminal testID="terminal-component" style={customStyle} />
      );

      const terminal = getByTestId('terminal-component');
      expect(terminal.props.style).toEqual(expect.arrayContaining([
        { flex: 1 },
        customStyle,
      ]));
    });
  });

  describe('Session Management', () => {
    it('should create new session when sessionId is not provided', async () => {
      render(<TermuxTerminal />);

      await waitFor(() => {
        expect(termuxManager.createSession).toHaveBeenCalledWith(
          undefined,
          undefined
        );
      });
    });

    it('should create session with custom sessionId', async () => {
      render(<TermuxTerminal sessionId="custom-session" />);

      await waitFor(() => {
        expect(termuxManager.createSession).toHaveBeenCalledWith(
          'custom-session',
          undefined
        );
      });
    });

    it('should create session with custom configuration', async () => {
      const sessionConfig = {
        command: '/bin/sh',
        args: ['-c'],
        workingDirectory: '/tmp',
      };

      render(<TermuxTerminal sessionConfig={sessionConfig} />);

      await waitFor(() => {
        expect(termuxManager.createSession).toHaveBeenCalledWith(
          undefined,
          sessionConfig
        );
      });
    });

    it('should reuse existing session when sessionId matches', async () => {
      (termuxManager.getSession as jest.Mock).mockReturnValue(mockSession);

      render(<TermuxTerminal sessionId="existing-session" />);

      await waitFor(() => {
        expect(termuxManager.getSession).toHaveBeenCalledWith('existing-session');
        expect(termuxManager.createSession).not.toHaveBeenCalled();
      });
    });

    it('should handle session creation errors', async () => {
      const onError = jest.fn();
      (termuxManager.createSession as jest.Mock).mockRejectedValue(
        new Error('Session creation failed')
      );

      render(<TermuxTerminal onError={onError} />);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Session creation failed',
          })
        );
      });
    });
  });

  describe('Event Handling', () => {
    it('should set up data and exit listeners on session', async () => {
      const onData = jest.fn();
      const onExit = jest.fn();

      render(<TermuxTerminal onData={onData} onExit={onExit} />);

      await waitFor(() => {
        expect(mockSession.onData).toHaveBeenCalledWith(expect.any(Function));
        expect(mockSession.onExit).toHaveBeenCalledWith(expect.any(Function));
      });
    });

    it('should forward session data to WebView and callback', async () => {
      const onData = jest.fn();
      let dataCallback: (data: string) => void = jest.fn();

      mockSession.onData.mockImplementation((callback) => {
        dataCallback = callback;
        return jest.fn();
      });

      render(<TermuxTerminal onData={onData} />);

      await waitFor(() => {
        expect(mockSession.onData).toHaveBeenCalled();
      });

      // Simulate data from session
      dataCallback('test output');

      expect(mockWebView.postMessage).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'data',
          data: 'test output',
        })
      );
      expect(onData).toHaveBeenCalledWith('test output');
    });

    it('should handle session exit events', async () => {
      const onExit = jest.fn();
      let exitCallback: (code: number) => void = jest.fn();

      mockSession.onExit.mockImplementation((callback) => {
        exitCallback = callback;
        return jest.fn();
      });

      render(<TermuxTerminal onExit={onExit} />);

      await waitFor(() => {
        expect(mockSession.onExit).toHaveBeenCalled();
      });

      // Simulate session exit
      exitCallback(0);

      expect(onExit).toHaveBeenCalledWith(0);
    });

    it('should call onReady when terminal is ready', async () => {
      const onReady = jest.fn();

      const { getByTestId } = render(
        <TermuxTerminal onReady={onReady} testID="terminal-component" />
      );

      // Simulate WebView ready message
      const webView = getByTestId('terminal-component');
      fireEvent(webView, 'message', {
        nativeEvent: {
          data: JSON.stringify({ type: 'ready' }),
        },
      });

      expect(onReady).toHaveBeenCalled();
    });
  });

  describe('WebView Message Handling', () => {
    it('should handle input messages from WebView', async () => {
      const { getByTestId } = render(
        <TermuxTerminal testID="terminal-component" />
      );

      await waitFor(() => {
        expect(mockSession.onData).toHaveBeenCalled();
      });

      // Simulate WebView input message
      const webView = getByTestId('terminal-component');
      fireEvent(webView, 'message', {
        nativeEvent: {
          data: JSON.stringify({
            type: 'input',
            data: 'echo "test"\\n',
          }),
        },
      });

      expect(mockSession.write).toHaveBeenCalledWith('echo "test"\\n');
    });

    it('should handle resize messages from WebView', async () => {
      const { getByTestId } = render(
        <TermuxTerminal testID="terminal-component" />
      );

      const webView = getByTestId('terminal-component');
      fireEvent(webView, 'message', {
        nativeEvent: {
          data: JSON.stringify({
            type: 'resize',
            cols: 80,
            rows: 24,
          }),
        },
      });

      // Should log resize event (tested via console.log spy in integration tests)
    });

    it('should handle unknown message types gracefully', async () => {
      const { getByTestId } = render(
        <TermuxTerminal testID="terminal-component" />
      );

      const webView = getByTestId('terminal-component');
      fireEvent(webView, 'message', {
        nativeEvent: {
          data: JSON.stringify({
            type: 'unknown',
            data: 'test',
          }),
        },
      });

      // Should not crash and should log warning
    });

    it('should handle malformed JSON messages', async () => {
      const { getByTestId } = render(
        <TermuxTerminal testID="terminal-component" />
      );

      const webView = getByTestId('terminal-component');
      fireEvent(webView, 'message', {
        nativeEvent: {
          data: 'invalid json',
        },
      });

      // Should not crash and should log error
    });
  });

  describe('Imperative API', () => {
    it('should provide writeToTerminal method via ref', async () => {
      const ref = React.createRef<any>();

      render(<TermuxTerminal ref={ref} />);

      await waitFor(() => {
        expect(ref.current).toBeTruthy();
      });

      ref.current.writeToTerminal('test input');

      expect(mockSession.write).toHaveBeenCalledWith('test input');
    });

    it('should provide clearTerminal method via ref', async () => {
      const ref = React.createRef<any>();

      render(<TermuxTerminal ref={ref} />);

      await waitFor(() => {
        expect(ref.current).toBeTruthy();
      });

      ref.current.clearTerminal();

      expect(mockWebView.postMessage).toHaveBeenCalledWith(
        JSON.stringify({ type: 'clear' })
      );
    });

    it('should provide getSession method via ref', async () => {
      const ref = React.createRef<any>();

      render(<TermuxTerminal ref={ref} />);

      await waitFor(() => {
        expect(ref.current).toBeTruthy();
      });

      const session = ref.current.getSession();

      expect(session).toBe(mockSession);
    });

    it('should provide resizeTerminal method via ref', async () => {
      const ref = React.createRef<any>();

      render(<TermuxTerminal ref={ref} />);

      await waitFor(() => {
        expect(ref.current).toBeTruthy();
      });

      ref.current.resizeTerminal(120, 40);

      expect(mockWebView.postMessage).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'resize',
          cols: 120,
          rows: 40,
        })
      );
    });

    it('should handle writeToTerminal when session is not running', async () => {
      const ref = React.createRef<any>();
      const notRunningSession = { ...mockSession, isRunning: false };
      (termuxManager.createSession as jest.Mock).mockResolvedValue(notRunningSession);

      render(<TermuxTerminal ref={ref} />);

      await waitFor(() => {
        expect(ref.current).toBeTruthy();
      });

      ref.current.writeToTerminal('test input');

      expect(notRunningSession.write).not.toHaveBeenCalled();
    });
  });

  describe('Theme Support', () => {
    it('should apply dark theme by default', () => {
      const { getByTestId } = render(
        <TermuxTerminal testID="terminal-component" />
      );

      const webView = getByTestId('terminal-component');
      const html = webView.props.source.html;

      expect(html).toContain('background-color: #0d1117');
      expect(html).toContain("background: '#0d1117'");
      expect(html).toContain("foreground: '#f0f6fc'");
    });

    it('should apply light theme when specified', () => {
      const { getByTestId } = render(
        <TermuxTerminal theme="light" testID="terminal-component" />
      );

      const webView = getByTestId('terminal-component');
      const html = webView.props.source.html;

      expect(html).toContain('background-color: #ffffff');
      expect(html).toContain("background: '#ffffff'");
      expect(html).toContain("foreground: '#24292f'");
    });

    it('should support custom font size', () => {
      const { getByTestId } = render(
        <TermuxTerminal fontSize={16} testID="terminal-component" />
      );

      const webView = getByTestId('terminal-component');
      const html = webView.props.source.html;

      expect(html).toContain('fontSize: 16');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup listeners on unmount', async () => {
      const dataUnsubscribe = jest.fn();
      const exitUnsubscribe = jest.fn();

      mockSession.onData.mockReturnValue(dataUnsubscribe);
      mockSession.onExit.mockReturnValue(exitUnsubscribe);

      const { unmount } = render(<TermuxTerminal />);

      await waitFor(() => {
        expect(mockSession.onData).toHaveBeenCalled();
        expect(mockSession.onExit).toHaveBeenCalled();
      });

      unmount();

      expect(dataUnsubscribe).toHaveBeenCalled();
      expect(exitUnsubscribe).toHaveBeenCalled();
    });
  });
});