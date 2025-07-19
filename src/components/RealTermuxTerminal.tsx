import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { TermuxTerminalView } from 'termux-core';

interface RealTermuxTerminalProps {
  onReady?: () => void;
  style?: any;
}

export default function RealTermuxTerminal({ 
  onReady, 
  style 
}: RealTermuxTerminalProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const terminalRef = useRef<any>(null);

  useEffect(() => {
    // Initialize the terminal when component mounts
    const initializeTerminal = async () => {
      try {
        setIsReady(true);
        onReady?.();
      } catch (err) {
        // Log error for debugging
        setError('Failed to initialize terminal');
      }
    };

    initializeTerminal();
  }, [onReady]);

  const handleSessionOutput = (data: string) => {
    // Process terminal output data
    if (data.startsWith('$')) {
      // Parse and handle command if callback is provided
    }
  };

  const handleSessionExit = (_exitCode: number) => {
    // Handle session exit
  };

  if (error) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Terminal Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Text style={styles.errorHelp}>
            Make sure Termux bootstrap is properly installed
          </Text>
        </View>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Initializing Real Termux Terminal...</Text>
          <Text style={styles.loadingSubtext}>Setting up Linux environment</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {React.createElement(TermuxTerminalView as any, {
        ref: terminalRef,
        style: styles.terminal,
        command: "/data/data/com.termux/files/usr/bin/bash",
        workingDirectory: "/data/data/com.termux/files/home",
        environment: {
          PATH: '/data/data/com.termux/files/usr/bin:/data/data/com.termux/files/usr/bin/applets',
          HOME: '/data/data/com.termux/files/home',
          PREFIX: '/data/data/com.termux/files/usr',
          TMPDIR: '/data/data/com.termux/files/usr/tmp',
          TERM: 'xterm-256color',
          LANG: 'en_US.UTF-8',
          USER: 'termux',
          SHELL: '/data/data/com.termux/files/usr/bin/bash'
        },
        onSessionOutput: handleSessionOutput,
        onSessionExit: handleSessionExit
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  terminal: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#f0f6fc',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  loadingSubtext: {
    color: '#7d8590',
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#f85149',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorMessage: {
    color: '#f0f6fc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorHelp: {
    color: '#7d8590',
    fontSize: 12,
    textAlign: 'center',
  },
});