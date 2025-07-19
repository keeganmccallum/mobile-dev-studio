import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TermuxTestScreen: React.FC = () => {
  const [logs, setLogs] = useState<string[]>(['🔧 Termux Integration Test Screen Ready']);
  const [sessions, setSessions] = useState<any[]>([]);
  const [termuxManager, setTermuxManager] = useState<any>(null);
  const [moduleAvailable, setModuleAvailable] = useState(false);

  useEffect(() => {
    // Safely import and initialize termux manager
    const initializeTermux = async () => {
      try {
        addLog('🔍 Checking Termux module availability...');
        const { termuxManager: manager } = await import('../lib/termux/TermuxManager');
        setTermuxManager(manager);
        setModuleAvailable(true);
        addLog('✅ Termux module loaded successfully');
      } catch (error) {
        addLog(`❌ Failed to load Termux module: ${error}`);
        addLog('📝 Module is running in fallback mode');
        setModuleAvailable(false);
      }
    };
    
    initializeTermux();
  }, []);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const testSessionCreation = async () => {
    if (!moduleAvailable || !termuxManager) {
      addLog('❌ Termux module not available');
      return;
    }
    
    try {
      addLog('Creating new Termux session...');
      const sessionId = await termuxManager.createSession({
        command: '/bin/echo',
        cwd: '/tmp',
        environment: { TEST: 'true' }
      });
      addLog(`✅ Session created: ${sessionId}`);
      
      const allSessions = termuxManager.getAllSessions();
      setSessions(allSessions);
      addLog(`Total sessions: ${allSessions.length}`);
    } catch (error) {
      addLog(`❌ Session creation failed: ${error}`);
    }
  };

  const testCommandExecution = async () => {
    if (!moduleAvailable || !termuxManager) {
      addLog('❌ Termux module not available');
      return;
    }
    
    try {
      addLog('Executing test command...');
      const result = await termuxManager.executeCommand('echo "Hello from Termux!"');
      addLog(`✅ Command executed: ${result.output}`);
    } catch (error) {
      addLog(`❌ Command execution failed: ${error}`);
    }
  };

  const testSessionManager = async () => {
    if (!moduleAvailable || !termuxManager) {
      addLog('❌ Termux module not available');
      return;
    }
    
    try {
      addLog('Testing session manager...');
      const activeSessions = termuxManager.getActiveSessions();
      addLog(`Active sessions: ${activeSessions.length}`);
      
      if (activeSessions.length > 0) {
        const firstSession = activeSessions[0];
        addLog(`First session ID: ${firstSession.id}, PID: ${firstSession.pid}`);
        
        // Test writing to session
        await termuxManager.writeToSession(firstSession.id, 'test input\n');
        addLog(`✅ Wrote to session ${firstSession.id}`);
      }
    } catch (error) {
      addLog(`❌ Session manager test failed: ${error}`);
    }
  };

  const clearLogs = () => {
    setLogs(['🔧 Termux Integration Test Screen Ready']);
    setSessions([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Termux Integration Test</Text>
        <Text style={styles.subtitle}>Testing core functionality</Text>
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, moduleAvailable ? styles.statusSuccess : styles.statusError]}>
            {moduleAvailable ? '✅ Module Available' : '❌ Module Unavailable'}
          </Text>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testSessionCreation}>
          <Text style={styles.buttonText}>Create Session</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testCommandExecution}>
          <Text style={styles.buttonText}>Execute Command</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testSessionManager}>
          <Text style={styles.buttonText}>Test Manager</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearLogs}>
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>

      {sessions.length > 0 && (
        <View style={styles.sessionInfo}>
          <Text style={styles.sectionTitle}>Active Sessions ({sessions.length}):</Text>
          {sessions.map((session, index) => (
            <Text key={index} style={styles.sessionText}>
              ID: {session.id.substring(0, 12)}... | PID: {session.pid} | Running: {session.isRunning ? '✅' : '❌'}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.logsContainer}>
        <Text style={styles.sectionTitle}>Activity Logs:</Text>
        <ScrollView style={styles.logsScroll}>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logText}>{log}</Text>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#21262d',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f0f6fc',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#7d8590',
  },
  statusContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#161b22',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusSuccess: {
    color: '#238636',
  },
  statusError: {
    color: '#f85149',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  button: {
    backgroundColor: '#238636',
    padding: 12,
    borderRadius: 6,
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#da3633',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  sessionInfo: {
    margin: 16,
    padding: 12,
    backgroundColor: '#161b22',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#21262d',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f0f6fc',
    marginBottom: 8,
  },
  sessionText: {
    fontSize: 12,
    color: '#7d8590',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  logsContainer: {
    flex: 1,
    margin: 16,
    backgroundColor: '#161b22',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#21262d',
    padding: 12,
  },
  logsScroll: {
    flex: 1,
  },
  logText: {
    fontSize: 12,
    color: '#e6edf3',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});

export default TermuxTestScreen;