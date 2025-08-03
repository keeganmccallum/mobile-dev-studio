import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { termuxManager } from '@keeganmccallum/expo-termux';

export default function TermuxDemoScreen() {
  const [sessions, setSessions] = useState<string[]>([]);
  const [output, setOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Listen for session output
    const unsubscribe = termuxManager.onSessionOutput((sessionId, lines) => {
      setOutput(prev => prev + `[${sessionId}] ${lines.join('\\n')}\\n`);
    });

    return unsubscribe;
  }, []);

  const createNewSession = async () => {
    setIsLoading(true);
    try {
      const sessionId = await termuxManager.createSession({
        command: '/system/bin/sh',
        cwd: '/system'
      });
      setSessions(prev => [...prev, sessionId]);
      setOutput(prev => prev + `Created session: ${sessionId}\\n`);
    } catch (error) {
      Alert.alert('Error', `Failed to create session: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const executeCommand = async (command: string) => {
    setIsLoading(true);
    try {
      const result = await termuxManager.executeCommand(command);
      setOutput(prev => prev + `$ ${command}\\n${result.stdout}\\n`);
    } catch (error) {
      setOutput(prev => prev + `Error: ${error}\\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearOutput = () => {
    setOutput('');
  };

  const demoCommands = [
    'pwd',
    'ls',
    'whoami',
    'echo "Hello from Android Shell!"',
    'id'
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Termux Demo Features</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Management</Text>
          <TouchableOpacity 
            style={styles.button} 
            onPress={createNewSession}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Create New Session</Text>
          </TouchableOpacity>
          <Text style={styles.info}>Active Sessions: {sessions.length}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Commands</Text>
          {demoCommands.map((command, index) => (
            <TouchableOpacity
              key={index}
              style={styles.commandButton}
              onPress={() => executeCommand(command)}
              disabled={isLoading}
            >
              <Text style={styles.commandText}>{command}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.outputHeader}>
            <Text style={styles.sectionTitle}>Output</Text>
            <TouchableOpacity onPress={clearOutput}>
              <Text style={styles.clearButton}>Clear</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.outputContainer}>
            <Text style={styles.outputText}>{output || 'No output yet...'}</Text>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  commandButton: {
    backgroundColor: '#34C759',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  commandText: {
    color: 'white',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  info: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  outputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clearButton: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  outputContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    padding: 8,
    maxHeight: 200,
  },
  outputText: {
    color: '#00ff00',
    fontFamily: 'monospace',
    fontSize: 12,
  },
});