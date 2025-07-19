import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { termuxManager, TermuxSession } from './TermuxManager';

export interface XTermWebTerminalProps {
  style?: ViewStyle;
  sessionId?: string;
  theme?: 'dark' | 'light';
  fontSize?: number;
  fontFamily?: string;
  onReady?: () => void;
  onSessionCreated?: (sessionId: string) => void;
  onData?: (data: string) => void;
  autoStart?: boolean;
}

export interface XTermWebTerminalRef {
  createSession: () => Promise<string>;
  writeToSession: (data: string) => Promise<void>;
  killSession: () => Promise<void>;
  sendCommand: (command: string) => Promise<void>;
  clear: () => void;
  focus: () => void;
  resize: (cols: number, rows: number) => void;
}

const XTermWebTerminal = forwardRef<XTermWebTerminalRef, XTermWebTerminalProps>((props, ref) => {
  const webViewRef = useRef<WebView>(null);
  const sessionIdRef = useRef<string | null>(props.sessionId || null);
  const unsubscribeRefs = useRef<(() => void)[]>([]);

  useImperativeHandle(ref, () => ({
    createSession: async () => {
      const sessionId = await termuxManager.createSession();
      sessionIdRef.current = sessionId;
      props.onSessionCreated?.(sessionId);
      
      // Set up session event listeners
      setupSessionListeners(sessionId);
      
      return sessionId;
    },
    
    writeToSession: async (data: string) => {
      if (sessionIdRef.current) {
        await termuxManager.writeToSession(sessionIdRef.current, data);
      }
      // Also send to xterm for immediate display
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'INPUT',
        data: data
      }));
    },
    
    killSession: async () => {
      if (sessionIdRef.current) {
        await termuxManager.killSession(sessionIdRef.current);
        sessionIdRef.current = null;
      }
      // Clean up event listeners
      unsubscribeRefs.current.forEach(unsub => unsub());
      unsubscribeRefs.current = [];
    },
    
    sendCommand: async (command: string) => {
      if (sessionIdRef.current) {
        await termuxManager.writeToSession(sessionIdRef.current, command + '\n');
      }
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'INPUT',
        data: command + '\n'
      }));
    },
    
    clear: () => {
      webViewRef.current?.postMessage(JSON.stringify({ type: 'CLEAR' }));
    },
    
    focus: () => {
      webViewRef.current?.postMessage(JSON.stringify({ type: 'FOCUS' }));
    },
    
    resize: (cols: number, rows: number) => {
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'RESIZE',
        cols,
        rows
      }));
    }
  }));

  const setupSessionListeners = (sessionId: string) => {
    // Listen for session output
    const outputUnsub = termuxManager.onSessionOutput((id, lines) => {
      if (id === sessionId) {
        webViewRef.current?.postMessage(JSON.stringify({
          type: 'OUTPUT',
          data: lines.join('\n') + '\n'
        }));
      }
    });

    // Listen for session exit
    const exitUnsub = termuxManager.onSessionExit((id, exitCode) => {
      if (id === sessionId) {
        webViewRef.current?.postMessage(JSON.stringify({
          type: 'SESSION_EXITED',
          exitCode
        }));
      }
    });

    unsubscribeRefs.current.push(outputUnsub, exitUnsub);
  };

  useEffect(() => {
    if (props.autoStart && !sessionIdRef.current) {
      // Auto-create session
      termuxManager.createSession().then(sessionId => {
        sessionIdRef.current = sessionId;
        props.onSessionCreated?.(sessionId);
        setupSessionListeners(sessionId);
      });
    }

    return () => {
      // Clean up on unmount
      unsubscribeRefs.current.forEach(unsub => unsub());
    };
  }, [props.autoStart]);

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'READY':
          props.onReady?.();
          break;
          
        case 'DATA':
          // User input from xterm
          if (sessionIdRef.current) {
            termuxManager.writeToSession(sessionIdRef.current, message.data);
          }
          props.onData?.(message.data);
          break;
          
        case 'RESIZE':
          // Terminal was resized
          console.log('Terminal resized:', message.cols, message.rows);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const terminalHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>XTerm Terminal</title>
      <script src="https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/xterm-addon-web-links@0.9.0/lib/xterm-addon-web-links.min.js"></script>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css" />
      <style>
        body {
          margin: 0;
          padding: 8px;
          background-color: ${props.theme === 'light' ? '#ffffff' : '#000000'};
          font-family: ${props.fontFamily || "'Courier New', monospace"};
          overflow: hidden;
        }
        #terminal {
          width: 100%;
          height: 100vh;
        }
        .xterm-viewport {
          overflow-y: auto;
        }
      </style>
    </head>
    <body>
      <div id="terminal"></div>
      
      <script>
        // Initialize XTerm
        const terminal = new Terminal({
          theme: {
            background: '${props.theme === 'light' ? '#ffffff' : '#000000'}',
            foreground: '${props.theme === 'light' ? '#000000' : '#ffffff'}',
            cursor: '${props.theme === 'light' ? '#000000' : '#ffffff'}',
            selection: '${props.theme === 'light' ? '#4a4a4a' : '#ffffff44'}'
          },
          fontSize: ${props.fontSize || 14},
          fontFamily: '${props.fontFamily || 'Courier New, monospace'}',
          cursorBlink: true,
          scrollback: 1000,
          convertEol: true
        });
        
        // Add addons
        const fitAddon = new FitAddon.FitAddon();
        const webLinksAddon = new WebLinksAddon.WebLinksAddon();
        
        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);
        
        // Open terminal
        terminal.open(document.getElementById('terminal'));
        fitAddon.fit();
        
        // Handle input
        terminal.onData(data => {
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'DATA',
            data: data
          }));
        });
        
        // Handle resize
        terminal.onResize(({ cols, rows }) => {
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'RESIZE',
            cols: cols,
            rows: rows
          }));
        });
        
        // Listen for messages from React Native
        window.addEventListener('message', (event) => {
          try {
            const message = JSON.parse(event.data);
            
            switch (message.type) {
              case 'INPUT':
                // Don't echo input, just send to backend
                break;
                
              case 'OUTPUT':
                terminal.write(message.data);
                break;
                
              case 'CLEAR':
                terminal.clear();
                break;
                
              case 'FOCUS':
                terminal.focus();
                break;
                
              case 'RESIZE':
                terminal.resize(message.cols, message.rows);
                fitAddon.fit();
                break;
                
              case 'SESSION_EXITED':
                terminal.write('\\r\\n\\n[Process completed (code ' + message.exitCode + ') - press Enter]\\r\\n');
                break;
            }
          } catch (error) {
            console.error('Error handling message:', error);
          }
        });
        
        // Auto-resize on window resize
        window.addEventListener('resize', () => {
          fitAddon.fit();
        });
        
        // Initial welcome message
        terminal.write('\\x1b[1;32mXTerm.js Terminal Ready\\x1b[0m\\r\\n');
        terminal.write('Type commands or connect to a Termux session...\\r\\n\\n');
        
        // Focus the terminal
        terminal.focus();
        
        // Notify React Native that terminal is ready
        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'READY'
        }));
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[{ flex: 1 }, props.style]}>
      <WebView
        ref={webViewRef}
        source={{ html: terminalHtml }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        style={{ backgroundColor: props.theme === 'light' ? '#ffffff' : '#000000' }}
      />
    </View>
  );
});

export default XTermWebTerminal;