import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RealTermuxTerminal from '../components/RealTermuxTerminal';
import XTerminal from '../components/XTerminal';
import { terminalService } from '../services/TerminalService';

export default function TerminalScreen() {
  const [isTerminalReady, setIsTerminalReady] = useState(false);
  const [showStatus, setShowStatus] = useState(true);
  const [terminalStatus, setTerminalStatus] = useState<{
    initialized: boolean;
    processCount: number;
    runningProcesses: number;
    alpineRootPath: string;
    serverStatus: { status: 'stopped' | 'running' | 'error'; url?: string };
  }>({
    initialized: false,
    processCount: 0,
    runningProcesses: 0,
    alpineRootPath: '',
    serverStatus: { status: 'stopped' }
  });

  useEffect(() => {
    // Initialize terminal service and get status
    const initializeTerminal = async () => {
      await terminalService.initialize();
      updateStatus();
    };
    
    initializeTerminal();
    
    // Update status every 5 seconds
    const interval = setInterval(updateStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = () => {
    const status = terminalService.getStatus();
    setTerminalStatus(status);
  };

  const handleTerminalReady = () => {
    setIsTerminalReady(true);
    updateStatus();
  };

  const handleCommand = (command: string, args: string[]) => {
    console.log(`Terminal command: ${command} ${args.join(' ')}`);
    updateStatus();
  };

  const toggleStatusView = () => {
    setShowStatus(!showStatus);
  };

  const clearTerminal = () => {
    Alert.alert(
      'Clear Terminal',
      'Are you sure you want to clear the terminal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            // Clear processes
            terminalService.clearProcesses();
            updateStatus();
          }
        }
      ]
    );
  };

  const restartEnvironment = async () => {
    Alert.alert(
      'Restart Environment',
      'This will restart the Alpine Linux environment. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Restart', 
          style: 'destructive',
          onPress: async () => {
            terminalService.clearProcesses();
            await terminalService.initialize();
            updateStatus();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>🐧 Terminal Environment</Text>
          <Text style={styles.headerSubtitle}>
            {terminalStatus.initialized ? 'Alpine Linux Ready' : 'Initializing...'}
          </Text>
        </View>
        
        <View style={styles.headerControls}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleStatusView}>
            <Ionicons 
              name={showStatus ? 'eye-off' : 'eye'} 
              size={20} 
              color="#7d8590" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={clearTerminal}>
            <Ionicons name="trash" size={20} color="#f85149" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={restartEnvironment}>
            <Ionicons name="refresh" size={20} color="#58a6ff" />
          </TouchableOpacity>
        </View>
      </View>

      {showStatus && (
        <View style={styles.statusBar}>
          <View style={styles.statusSection}>
            <View style={styles.statusItem}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: terminalStatus.initialized ? '#238636' : '#f85149' }
              ]} />
              <Text style={styles.statusText}>
                Alpine Linux: {terminalStatus.initialized ? 'Ready' : 'Initializing'}
              </Text>
            </View>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusText}>
                Processes: {terminalStatus.processCount} 
                ({terminalStatus.runningProcesses} running)
              </Text>
            </View>
          </View>
          
          <View style={styles.statusSection}>
            <View style={styles.statusItem}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: isTerminalReady ? '#238636' : '#f85149' }
              ]} />
              <Text style={styles.statusText}>
                Terminal: {isTerminalReady ? 'Ready' : 'Loading'}
              </Text>
            </View>
            
            <View style={styles.statusItem}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: terminalStatus.serverStatus.status === 'running' ? '#238636' : '#7d8590' }
              ]} />
              <Text style={styles.statusText}>
                Dev Server: {terminalStatus.serverStatus.status === 'running' ? 'Running' : 'Stopped'}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.terminalContainer} testID="terminal-native">
        <RealTermuxTerminal
          onReady={handleTerminalReady}
          onCommand={handleCommand}
          style={styles.terminal}
        />
      </View>

      {!isTerminalReady && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <Text style={styles.loadingTitle}>🚀 Starting Terminal...</Text>
            <Text style={styles.loadingSubtitle}>
              Setting up Alpine Linux environment
            </Text>
            <View style={styles.loadingSteps}>
              <Text style={styles.loadingStep}>
                ✅ Initializing file system
              </Text>
              <Text style={styles.loadingStep}>
                ✅ Creating environment
              </Text>
              <Text style={styles.loadingStep}>
                {isTerminalReady ? '✅' : '⏳'} Loading terminal interface
              </Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#21262d',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f0f6fc',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#7d8590',
  },
  headerControls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#21262d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#161b22',
    borderBottomWidth: 1,
    borderBottomColor: '#21262d',
  },
  statusSection: {
    flex: 1,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#7d8590',
  },
  terminalContainer: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  terminal: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13, 17, 23, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingContent: {
    alignItems: 'center',
    padding: 40,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f0f6fc',
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#7d8590',
    marginBottom: 24,
    textAlign: 'center',
  },
  loadingSteps: {
    alignItems: 'flex-start',
  },
  loadingStep: {
    fontSize: 14,
    color: '#7d8590',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
});