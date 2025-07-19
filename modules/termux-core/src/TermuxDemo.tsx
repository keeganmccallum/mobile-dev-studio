import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { TermuxTerminalView, XTermWebTerminal, termuxManager } from './index';
import type { TermuxTerminalRef, XTermWebTerminalRef } from './index';

const TermuxDemo: React.FC = () => {
  const nativeTerminalRef = useRef<TermuxTerminalRef>(null);
  const webTerminalRef = useRef<XTermWebTerminalRef>(null);
  const [activeTab, setActiveTab] = useState<'native' | 'web'>('native');
  const [commandInput, setCommandInput] = useState('');
  const [sessionLogs, setSessionLogs] = useState<string[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  const addLog = (message: string) => {
    setSessionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleCreateSession = async () => {
    try {
      if (activeTab === 'native' && nativeTerminalRef.current) {
        await nativeTerminalRef.current.createSession();
        addLog('Native terminal session created');
      } else if (activeTab === 'web' && webTerminalRef.current) {
        const sessionId = await webTerminalRef.current.createSession();
        addLog(`Web terminal session created: ${sessionId}`);
      }
    } catch (error) {
      addLog(`Error creating session: ${error}`);
    }
  };

  const handleSendCommand = async () => {
    if (!commandInput.trim()) return;
    
    try {
      if (activeTab === 'native' && nativeTerminalRef.current) {
        await nativeTerminalRef.current.sendCommand(commandInput);
        addLog(`Sent to native terminal: ${commandInput}`);
      } else if (activeTab === 'web' && webTerminalRef.current) {
        await webTerminalRef.current.sendCommand(commandInput);
        addLog(`Sent to web terminal: ${commandInput}`);
      }
      setCommandInput('');
    } catch (error) {
      addLog(`Error sending command: ${error}`);
    }
  };

  const handleKillSession = async () => {
    try {
      if (activeTab === 'native' && nativeTerminalRef.current) {
        await nativeTerminalRef.current.killSession();
        addLog('Native terminal session killed');
      } else if (activeTab === 'web' && webTerminalRef.current) {
        await webTerminalRef.current.killSession();
        addLog('Web terminal session killed');
      }
    } catch (error) {
      addLog(`Error killing session: ${error}`);
    }
  };

  const handleClearTerminal = () => {
    if (activeTab === 'web' && webTerminalRef.current) {
      webTerminalRef.current.clear();
      addLog('Web terminal cleared');
    }
  };

  const handleSessionManagerTest = async () => {
    try {
      // Create a session using the manager directly
      const sessionId = await termuxManager.createSession({
        command: '/bin/echo',
        cwd: '/tmp',
        environment: { TEST: 'true' }
      });
      
      addLog(`Session manager created session: ${sessionId}`);
      
      // List all sessions
      const allSessions = termuxManager.getAllSessions();
      setSessions(allSessions);
      addLog(`Total sessions: ${allSessions.length}`);
      
      // Execute a command
      const result = await termuxManager.executeCommand('echo "Hello from Termux!"');
      addLog(`Command result: ${result.output}`);
      
    } catch (error) {
      addLog(`Session manager error: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Termux Terminal Demo</Text>
      
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'native' && styles.activeTab]}
          onPress={() => setActiveTab('native')}
        >
          <Text style={styles.tabText}>Native Terminal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'web' && styles.activeTab]}
          onPress={() => setActiveTab('web')}
        >
          <Text style={styles.tabText}>Web Terminal (XTerm)</Text>
        </TouchableOpacity>
      </View>

      {/* Terminal Display */}
      <View style={styles.terminalContainer}>
        {activeTab === 'native' ? (
          <TermuxTerminalView
            ref={nativeTerminalRef}
            style={styles.terminal}
            autoStart={false}
            onSessionOutput={(event) => {
              addLog(`Native output: ${event.lines.join(' ')}`);
            }}
            onSessionExit={(event) => {
              addLog(`Native session exited with code: ${event.exitCode}`);
            }}
          />
        ) : (
          <XTermWebTerminal
            ref={webTerminalRef}
            style={styles.terminal}
            theme="dark"
            fontSize={14}
            autoStart={false}
            onReady={() => addLog('XTerm web terminal ready')}
            onSessionCreated={(sessionId) => addLog(`XTerm session created: ${sessionId}`)}
            onData={(data) => addLog(`XTerm input: ${data.replace(/\\n/g, '\\\\n')}`)}
          />
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={handleCreateSession}>
            <Text style={styles.buttonText}>Create Session</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={handleKillSession}>
            <Text style={styles.buttonText}>Kill Session</Text>
          </TouchableOpacity>
          
          {activeTab === 'web' && (
            <TouchableOpacity style={styles.button} onPress={handleClearTerminal}>
              <Text style={styles.buttonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.commandRow}>
          <TextInput
            style={styles.commandInput}
            placeholder="Enter command..."
            value={commandInput}
            onChangeText={setCommandInput}
            onSubmitEditing={handleSendCommand}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendCommand}>
            <Text style={styles.buttonText}>Send</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.button, styles.testButton]} onPress={handleSessionManagerTest}>
          <Text style={styles.buttonText}>Test Session Manager</Text>
        </TouchableOpacity>
      </View>

      {/* Session Info */}
      {sessions.length > 0 && (
        <View style={styles.sessionInfo}>
          <Text style={styles.sectionTitle}>Active Sessions:</Text>
          {sessions.map((session, index) => (
            <Text key={index} style={styles.sessionText}>
              {session.id} - PID: {session.pid} - Running: {session.isRunning ? 'Yes' : 'No'}
            </Text>
          ))}
        </View>
      )}

      {/* Logs */}
      <View style={styles.logsContainer}>
        <Text style={styles.sectionTitle}>Activity Log:</Text>
        <ScrollView style={styles.logsScroll}>
          {sessionLogs.map((log, index) => (
            <Text key={index} style={styles.logText}>{log}</Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    padding: 12,
    backgroundColor: '#ddd',
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    color: '#333',
    fontWeight: '600',
  },
  terminalContainer: {
    height: 300,
    backgroundColor: '#000',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  terminal: {
    flex: 1,
  },
  controlsContainer: {
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  commandRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#34C759',
    alignSelf: 'center',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  commandInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  sessionInfo: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  sessionText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  logsContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
  },
  logsScroll: {
    flex: 1,
  },
  logText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});

export default TermuxDemo;