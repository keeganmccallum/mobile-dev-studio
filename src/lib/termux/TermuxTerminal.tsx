import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { TermuxSession, TermuxSessionConfig, termuxManager } from './TermuxManager';

export interface TermuxTerminalProps {
  sessionId?: string;
  sessionConfig?: TermuxSessionConfig;
  style?: ViewStyle;
  theme?: 'dark' | 'light';
  fontSize?: number;
  onReady?: () => void;
  onData?: (data: string) => void;
  onExit?: (code: number) => void;
  onError?: (error: Error) => void;
}

export interface TermuxTerminalRef {
  writeToTerminal: (data: string) => void;
  clearTerminal: () => void;
  getSession: () => TermuxSession | null;
  resizeTerminal: (cols: number, rows: number) => void;
}

const TermuxTerminal = forwardRef<TermuxTerminalRef, TermuxTerminalProps>((props, ref) => {
  const {
    sessionId,
    sessionConfig,
    style,
    theme = 'dark',
    fontSize = 14,
    onReady,
    onData,
    onExit,
    onError,
  } = props;

  const webViewRef = useRef<WebView>(null);
  const [session, setSession] = useState<TermuxSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useImperativeHandle(ref, () => ({
    writeToTerminal: (data: string) => {
      if (session && session.isRunning) {
        session.write(data);
      }
    },
    clearTerminal: () => {
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'clear'
      }));
    },
    getSession: () => session,
    resizeTerminal: (cols: number, rows: number) => {
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'resize',
        cols,
        rows
      }));
    }
  }));

  useEffect(() => {
    let currentSession: TermuxSession | null = null;
    let dataUnsubscribe: (() => void) | null = null;
    let exitUnsubscribe: (() => void) | null = null;

    const initializeSession = async () => {
      try {
        // Get or create session
        if (sessionId) {
          currentSession = termuxManager.getSession(sessionId);
        }
        
        if (!currentSession) {
          currentSession = await termuxManager.createSession(sessionId, sessionConfig);
        }

        setSession(currentSession);

        // Set up event listeners
        dataUnsubscribe = currentSession.onData((data) => {
          // Send data to xterm.js
          webViewRef.current?.postMessage(JSON.stringify({
            type: 'data',
            data: data
          }));
          
          onData?.(data);
        });

        exitUnsubscribe = currentSession.onExit((code) => {
          setSession(null);
          onExit?.(code);
        });

      } catch (error) {
        console.error('Failed to initialize Termux session:', error);
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    };

    initializeSession();

    return () => {
      dataUnsubscribe?.();
      exitUnsubscribe?.();
    };
  }, [sessionId, sessionConfig]);

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'ready':
          setIsReady(true);
          onReady?.();
          break;
          
        case 'input':
          if (session && session.isRunning) {
            session.write(message.data);
          }
          break;
          
        case 'resize':
          // Handle terminal resize
          console.log('Terminal resized:', message.cols, message.rows);
          break;
          
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  const terminalHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Termux Terminal</title>
    <script src="https://unpkg.com/xterm@5.3.0/lib/xterm.js"></script>
    <script src="https://unpkg.com/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js"></script>
    <script src="https://unpkg.com/xterm-addon-web-links@0.9.0/lib/xterm-addon-web-links.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/xterm@5.3.0/css/xterm.css" />
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: ${theme === 'dark' ? '#0d1117' : '#ffffff'};
            overflow: hidden;
        }
        #terminal {
            width: 100%;
            height: 100vh;
            padding: 8px;
            box-sizing: border-box;
        }
        .xterm-viewport {
            background-color: ${theme === 'dark' ? '#0d1117' : '#ffffff'} !important;
        }
    </style>
</head>
<body>
    <div id="terminal"></div>
    <script>
        const terminal = new Terminal({
            theme: {
                background: '${theme === 'dark' ? '#0d1117' : '#ffffff'}',
                foreground: '${theme === 'dark' ? '#f0f6fc' : '#24292f'}',
                cursor: '${theme === 'dark' ? '#f0f6fc' : '#24292f'}',
                cursorAccent: '${theme === 'dark' ? '#0d1117' : '#ffffff'}',
                selection: '${theme === 'dark' ? '#264f78' : '#0969da40'}',
                black: '${theme === 'dark' ? '#484f58' : '#24292f'}',
                red: '#ff7b72',
                green: '#3fb950',
                yellow: '#d29922',
                blue: '#58a6ff',
                magenta: '#bc8cff',
                cyan: '#39c5cf',
                white: '${theme === 'dark' ? '#b1bac4' : '#656d76'}',
                brightBlack: '${theme === 'dark' ? '#6e7681' : '#656d76'}',
                brightRed: '#ffa198',
                brightGreen: '#56d364',
                brightYellow: '#e3b341',
                brightBlue: '#79c0ff',
                brightMagenta: '#d2a8ff',
                brightCyan: '#56d4dd',
                brightWhite: '${theme === 'dark' ? '#f0f6fc' : '#24292f'}'
            },
            fontFamily: 'SFMono-Regular, Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',
            fontSize: ${fontSize},
            lineHeight: 1.2,
            cursorBlink: true,
            cursorStyle: 'block',
            allowTransparency: true,
            scrollback: 1000,
            tabStopWidth: 4,
            convertEol: true
        });

        // Load addons
        const fitAddon = new FitAddon.FitAddon();
        const webLinksAddon = new WebLinksAddon.WebLinksAddon();
        
        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);

        // Open terminal
        terminal.open(document.getElementById('terminal'));
        fitAddon.fit();

        // Handle input
        terminal.onData((data) => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'input',
                data: data
            }));
        });

        // Handle resize
        terminal.onResize((size) => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'resize',
                cols: size.cols,
                rows: size.rows
            }));
        });

        // Handle messages from React Native
        window.addEventListener('message', (event) => {
            const message = JSON.parse(event.data);
            
            switch (message.type) {
                case 'data':
                    terminal.write(message.data);
                    break;
                    
                case 'clear':
                    terminal.clear();
                    break;
                    
                case 'resize':
                    terminal.resize(message.cols, message.rows);
                    break;
            }
        });

        // Auto-fit on window resize
        window.addEventListener('resize', () => {
            fitAddon.fit();
        });

        // Show welcome message
        terminal.writeln('\\x1b[1;32m🐧 Termux Terminal Ready\\x1b[0m');
        terminal.writeln('\\x1b[90mConnecting to native session...\\x1b[0m');
        terminal.writeln('');

        // Notify React Native that terminal is ready
        window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'ready'
        }));
    </script>
</body>
</html>
  `;

  return (
    <View style={[{ flex: 1 }, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: terminalHtml }}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        onError={(error) => {
          console.error('WebView error:', error);
          onError?.(new Error('WebView loading failed'));
        }}
      />
    </View>
  );
});

export default TermuxTerminal;