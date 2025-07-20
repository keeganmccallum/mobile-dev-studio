import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// Temporarily disabled for testing: import { TermuxTerminal, termuxManager, TermuxTerminalRef } from '../lib/termux';

export default function TerminalScreen() {
  const [isTerminalReady, setIsTerminalReady] = useState(false);
  const [showStatus, setShowStatus] = useState(true);
  const [isBootstrapInitialized, setIsBootstrapInitialized] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  // const terminalRef = useRef<TermuxTerminalRef>(null);

  useEffect(() => {
    // Initialize Termux bootstrap
    const initializeBootstrap = async () => {
      try {
        // await termuxManager.initializeBootstrap();
        setIsBootstrapInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Termux bootstrap:', error);
      }
    };
    
    initializeBootstrap();
    
    // Update session count periodically
    const interval = setInterval(() => {
      // setSessionCount(termuxManager.getActiveSessions().length);
      setSessionCount(0);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const handleTerminalReady = () => {
    setIsTerminalReady(true);
  };

  const handleTerminalData = (data: string) => {
    console.log('Terminal output:', data);
  };

  const handleTerminalExit = (code: number) => {
    console.log('Terminal exited with code:', code);
    setIsTerminalReady(false);
  };

  const handleTerminalError = (error: Error) => {
    console.error('Terminal error:', error);
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
            // terminalRef.current?.clearTerminal();
          }
        }
      ]
    );
  };

  const restartEnvironment = async () => {
    Alert.alert(
      'Restart Environment',
      'This will restart the Termux environment. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Restart', 
          style: 'destructive',
          onPress: async () => {
            // await termuxManager.killAllSessions();
            setSessionCount(0);
            setIsTerminalReady(false);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>🐧 Termux Terminal</Text>
          <Text style={styles.headerSubtitle}>
            {isBootstrapInitialized ? 'Bootstrap Ready' : 'Initializing...'}
          </Text>
        </View>
        
        <View style={styles.headerControls}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={toggleStatusView}
            testID="status-toggle-button"
          >
            <Ionicons 
              name={showStatus ? 'eye-off' : 'eye'} 
              size={20} 
              color="#7d8590" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={clearTerminal}
            testID="clear-terminal-button"
          >
            <Ionicons name="trash" size={20} color="#f85149" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={restartEnvironment}
            testID="restart-environment-button"
          >
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
                { backgroundColor: isBootstrapInitialized ? '#238636' : '#f85149' }
              ]} />
              <Text style={styles.statusText}>
                Bootstrap: {isBootstrapInitialized ? 'Ready' : 'Initializing'}
              </Text>
            </View>
            
            <View style={styles.statusItem}>
              <Text style={styles.statusText}>
                Sessions: {sessionCount} active
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
                { backgroundColor: '#238636' }
              ]} />
              <Text style={styles.statusText}>
                Native: Connected
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.terminalContainer} testID="terminal-termux">
        <View style={styles.placeholderTerminal}>
          <Text style={styles.placeholderText}>Terminal temporarily disabled for testing</Text>
        </View>
        {/* <TermuxTerminal
          ref={terminalRef}
          sessionId="main"
          onReady={handleTerminalReady}
          onData={handleTerminalData}
          onExit={handleTerminalExit}
          onError={handleTerminalError}
          style={styles.terminal}
          theme="dark"
        /> */}
      </View>

      {!isTerminalReady && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <Text style={styles.loadingTitle}>🚀 Starting Termux...</Text>
            <Text style={styles.loadingSubtitle}>
              Setting up native terminal environment
            </Text>
            <View style={styles.loadingSteps}>
              <Text style={styles.loadingStep}>
                {isBootstrapInitialized ? '✅' : '⏳'} Installing bootstrap
              </Text>
              <Text style={styles.loadingStep}>
                {isBootstrapInitialized ? '✅' : '⏳'} Creating environment
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
  placeholderTerminal: {
    flex: 1,
    backgroundColor: '#161b22',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 8,
  },
  placeholderText: {
    color: '#7d8590',
    fontSize: 16,
  },
});