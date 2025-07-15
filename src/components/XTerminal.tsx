import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { terminalService } from '../services/TerminalService';

interface XTerminalProps {
  onCommand?: (command: string, args: string[]) => void;
  onReady?: () => void;
  theme?: 'dark' | 'light';
}

export default function XTerminal({ onCommand, onReady, theme = 'dark' }: XTerminalProps) {
  const webViewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState('/home/user');

  const terminalHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Mobile Dev Studio Terminal</title>
    <script src="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/lib/xterm.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@xterm/addon-fit@0.10.0/lib/addon-fit.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@xterm/addon-web-links@0.11.0/lib/addon-web-links.min.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.css" />
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: ${theme === 'dark' ? '#0d1117' : '#ffffff'};
            font-family: 'SFMono-Regular', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'Consolas', monospace;
        }
        #terminal {
            width: 100vw;
            height: 100vh;
            padding: 8px;
            box-sizing: border-box;
        }
        .xterm {
            font-feature-settings: "liga" 0;
            position: relative;
            user-select: none;
            -ms-user-select: none;
            -webkit-user-select: none;
        }
        .xterm.focus,
        .xterm:focus {
            outline: none;
        }
        .xterm .xterm-viewport {
            background-color: transparent;
            overflow-y: scroll;
            cursor: default;
            position: absolute;
            right: 0;
            left: 0;
            top: 0;
            bottom: 0;
        }
        .xterm .xterm-screen {
            position: relative;
        }
        .xterm .xterm-screen canvas {
            position: absolute;
            left: 0;
            top: 0;
        }
        .xterm .xterm-scroll-area {
            visibility: hidden;
        }
        .xterm-char-measure-element {
            display: inline-block;
            visibility: hidden;
            position: absolute;
            top: 0;
            left: -9999em;
            line-height: normal;
        }
        .xterm.enable-mouse-events {
            cursor: default;
        }
        .xterm.xterm-cursor-pointer {
            cursor: pointer;
        }
        .xterm.column-select.focus {
            cursor: crosshair;
        }
        .xterm .xterm-accessibility,
        .xterm .xterm-message {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            right: 0;
            z-index: 10;
            color: transparent;
        }
        .xterm .live-region {
            position: absolute;
            left: -9999px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        }
    </style>
</head>
<body>
    <!-- Hidden input for mobile keyboard -->
    <input type="text" id="mobileKeyboard" style="position: absolute; left: -9999px; opacity: 0; z-index: -1;" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
    <div id="terminal"></div>
    <script>
        // Initialize terminal
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
            fontSize: 14,
            lineHeight: 1.2,
            cursorBlink: true,
            cursorStyle: 'block',
            allowTransparency: true,
            scrollback: 1000,
            tabStopWidth: 4
        });

        // Load addons
        const fitAddon = new FitAddon.FitAddon();
        const webLinksAddon = new WebLinksAddon.WebLinksAddon();
        
        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);

        // Open terminal
        terminal.open(document.getElementById('terminal'));
        fitAddon.fit();

        // Terminal state
        let currentLine = '';
        let currentDirectory = '/home/user';
        let commandHistory = [];
        let historyIndex = -1;

        // Show welcome message
        terminal.writeln('\\x1b[32m┌─────────────────────────────────────────────────────────────┐\\x1b[0m');
        terminal.writeln('\\x1b[32m│\\x1b[0m \\x1b[1m🚀 Welcome to Mobile Dev Studio Terminal\\x1b[0m               \\x1b[32m│\\x1b[0m');
        terminal.writeln('\\x1b[32m│\\x1b[0m                                                           \\x1b[32m│\\x1b[0m');
        terminal.writeln('\\x1b[32m│\\x1b[0m \\x1b[36mAlpine Linux Environment Ready\\x1b[0m                          \\x1b[32m│\\x1b[0m');
        terminal.writeln('\\x1b[32m│\\x1b[0m \\x1b[33mType "help" for available commands\\x1b[0m                    \\x1b[32m│\\x1b[0m');
        terminal.writeln('\\x1b[32m└─────────────────────────────────────────────────────────────┘\\x1b[0m');
        terminal.writeln('');
        
        // Show initial prompt
        showPrompt();

        function showPrompt() {
            const user = '\\x1b[32muser\\x1b[0m';
            const at = '\\x1b[37m@\\x1b[0m';
            const host = '\\x1b[32mmobile-dev-studio\\x1b[0m';
            const colon = '\\x1b[37m:\\x1b[0m';
            const dir = currentDirectory === '/home/user' ? '\\x1b[34m~\\x1b[0m' : '\\x1b[34m' + currentDirectory + '\\x1b[0m';
            const dollar = '\\x1b[37m$\\x1b[0m';
            
            terminal.write(user + at + host + colon + dir + dollar + ' ');
        }

        function executeCommand(command) {
            const parts = command.trim().split(/\\s+/);
            const cmd = parts[0];
            const args = parts.slice(1);

            // Add to command history
            if (command.trim()) {
                commandHistory.push(command.trim());
                historyIndex = commandHistory.length;
            }

            // Send command to React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'COMMAND',
                command: cmd,
                args: args,
                cwd: currentDirectory,
                timestamp: Date.now()
            }));

            // Handle some commands locally for immediate feedback
            switch (cmd) {
                case 'clear':
                    terminal.clear();
                    showPrompt();
                    return;
                    
                case '':
                    showPrompt();
                    return;
                    
                default:
                    // Wait for response from React Native
                    break;
            }
        }

        // Mobile keyboard support
        const mobileKeyboard = document.getElementById('mobileKeyboard');
        let mobileKeyboardBuffer = '';
        
        // Focus hidden input on terminal click
        document.getElementById('terminal').addEventListener('click', () => {
            mobileKeyboard.focus();
        });
        
        // Handle mobile keyboard input
        mobileKeyboard.addEventListener('input', (e) => {
            const newValue = e.target.value;
            const newChar = newValue.slice(mobileKeyboardBuffer.length);
            
            if (newChar) {
                currentLine += newChar;
                terminal.write(newChar);
            }
            
            mobileKeyboardBuffer = newValue;
        });
        
        // Handle mobile keyboard special keys
        mobileKeyboard.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                terminal.writeln('');
                executeCommand(currentLine);
                currentLine = '';
                mobileKeyboard.value = '';
                mobileKeyboardBuffer = '';
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                if (currentLine.length > 0) {
                    currentLine = currentLine.substr(0, currentLine.length - 1);
                    terminal.write('\\b \\b');
                    mobileKeyboard.value = mobileKeyboard.value.slice(0, -1);
                    mobileKeyboardBuffer = mobileKeyboard.value;
                }
            }
        });

        // Handle keyboard input
        terminal.onKey(({ key, domEvent }) => {
            const printable = !domEvent.altKey && !domEvent.altGraphKey && !domEvent.ctrlKey && !domEvent.metaKey;

            if (domEvent.keyCode === 13) { // Enter
                terminal.writeln('');
                executeCommand(currentLine);
                currentLine = '';
            } else if (domEvent.keyCode === 8) { // Backspace
                if (currentLine.length > 0) {
                    currentLine = currentLine.substr(0, currentLine.length - 1);
                    terminal.write('\\b \\b');
                }
            } else if (domEvent.keyCode === 38) { // Up arrow - command history
                if (historyIndex > 0) {
                    // Clear current line
                    terminal.write('\\r\\x1b[K');
                    showPrompt();
                    
                    historyIndex--;
                    currentLine = commandHistory[historyIndex] || '';
                    terminal.write(currentLine);
                }
            } else if (domEvent.keyCode === 40) { // Down arrow - command history
                if (historyIndex < commandHistory.length - 1) {
                    // Clear current line
                    terminal.write('\\r\\x1b[K');
                    showPrompt();
                    
                    historyIndex++;
                    currentLine = commandHistory[historyIndex] || '';
                    terminal.write(currentLine);
                } else if (historyIndex === commandHistory.length - 1) {
                    // Clear current line
                    terminal.write('\\r\\x1b[K');
                    showPrompt();
                    
                    historyIndex = commandHistory.length;
                    currentLine = '';
                }
            } else if (printable) {
                currentLine += key;
                terminal.write(key);
            }
        });

        // Handle window resize
        function handleResize() {
            fitAddon.fit();
        }

        window.addEventListener('resize', handleResize);
        
        // Auto-resize after a short delay
        setTimeout(() => {
            fitAddon.fit();
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'READY',
                cols: terminal.cols,
                rows: terminal.rows
            }));
        }, 100);

        // Handle messages from React Native
        window.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                
                switch (data.type) {
                    case 'COMMAND_OUTPUT':
                        if (data.output && Array.isArray(data.output)) {
                            data.output.forEach(line => {
                                if (line.startsWith('$ ')) {
                                    // Don't show the command again, we already showed it
                                    return;
                                }
                                terminal.writeln(line);
                            });
                        }
                        
                        if (data.cwd && data.cwd !== currentDirectory) {
                            currentDirectory = data.cwd;
                        }
                        
                        showPrompt();
                        break;
                        
                    case 'CLEAR':
                        terminal.clear();
                        showPrompt();
                        break;
                        
                    case 'RESIZE':
                        fitAddon.fit();
                        break;
                }
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        });

        // Expose terminal functions globally
        window.mobileTerminal = {
            writeln: (text) => terminal.writeln(text),
            write: (text) => terminal.write(text),
            clear: () => terminal.clear(),
            fit: () => fitAddon.fit(),
            focus: () => {
                terminal.focus();
                mobileKeyboard.focus();
            }
        };
    </script>
</body>
</html>
`;

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'READY':
          setIsReady(true);
          if (onReady) {
            onReady();
          }
          break;
          
        case 'COMMAND': {
          const { command, args, cwd } = data;
          
          // Execute command through terminal service
          const processId = await terminalService.createProcess(command, args, cwd);
          
          // Wait a bit for command to complete, then get output
          setTimeout(async () => {
            const process = terminalService.getProcess(processId);
            if (process) {
              // Update current directory if it changed
              if (process.cwd !== currentDirectory) {
                setCurrentDirectory(process.cwd);
              }
              
              // Send output back to terminal
              webViewRef.current?.postMessage(JSON.stringify({
                type: 'COMMAND_OUTPUT',
                output: process.output,
                cwd: process.cwd,
                status: process.status
              }));
            }
          }, 100);
          
          if (onCommand) {
            onCommand(command, args);
          }
          break;
        }
      }
    } catch (error) {
      console.error('Error handling terminal message:', error);
    }
  };

  const clearTerminal = () => {
    webViewRef.current?.postMessage(JSON.stringify({ type: 'CLEAR' }));
  };

  const resizeTerminal = () => {
    webViewRef.current?.postMessage(JSON.stringify({ type: 'RESIZE' }));
  };

  useEffect(() => {
    // Initialize terminal service
    terminalService.initialize();
  }, []);

  useEffect(() => {
    // Handle orientation changes
    const subscription = Dimensions.addEventListener('change', () => {
      setTimeout(() => {
        resizeTerminal();
      }, 100);
    });

    return () => subscription?.remove();
  }, []);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: terminalHtml }}
        onMessage={handleMessage}
        style={styles.webView}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        bounces={false}
        keyboardDisplayRequiresUserAction={false}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        onLoadEnd={() => {
          // Focus terminal after load
          setTimeout(() => {
            webViewRef.current?.injectJavaScript(`
              if (window.mobileTerminal && window.mobileTerminal.focus) {
                window.mobileTerminal.focus();
              }
              // Also try to focus the terminal element directly
              const terminalElement = document.querySelector('.xterm-helper-textarea');
              if (terminalElement) {
                terminalElement.focus();
              }
              // Ensure the terminal canvas is focusable
              const canvas = document.querySelector('.xterm-screen canvas');
              if (canvas) {
                canvas.setAttribute('tabindex', '0');
                canvas.focus();
              }
              true;
            `);
          }, 500);
        }}
        onTouchStart={() => {
          // Focus terminal on touch
          webViewRef.current?.injectJavaScript(`
            if (window.mobileTerminal && window.mobileTerminal.focus) {
              window.mobileTerminal.focus();
            }
            const terminalElement = document.querySelector('.xterm-helper-textarea');
            if (terminalElement) {
              terminalElement.focus();
            }
            true;
          `);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});