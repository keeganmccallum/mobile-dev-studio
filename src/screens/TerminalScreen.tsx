import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TerminalScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🐧 Terminal Environment</Text>
        <Text style={styles.headerSubtitle}>Embedded Termux + Alpine Linux</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Environment Status</Text>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>🐧 Alpine Linux:</Text>
            <Text style={styles.statusValue}>Ready</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>📦 Node.js:</Text>
            <Text style={styles.statusValue}>v24.4.0</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>🚀 Dev Server:</Text>
            <Text style={styles.statusValue}>http://localhost:3000</Text>
          </View>
        </View>

        <View style={styles.terminalContainer}>
          <View style={styles.terminalHeader}>
            <View style={styles.terminalButtons}>
              <View style={[styles.terminalButton, { backgroundColor: '#ff5f56' }]} />
              <View style={[styles.terminalButton, { backgroundColor: '#ffbd2e' }]} />
              <View style={[styles.terminalButton, { backgroundColor: '#27ca3f' }]} />
            </View>
            <Text style={styles.terminalTitle}>terminal</Text>
          </View>
          
          <View style={styles.terminal}>
            <Text style={styles.terminalText}>
              <Text style={styles.prompt}>user@mobile-dev-studio</Text>
              <Text style={styles.path}>:~/project$</Text>
              <Text> npm start</Text>
            </Text>
            <Text style={styles.terminalText}>
              Starting development server...
            </Text>
            <Text style={styles.terminalText}>
              <Text style={styles.success}>✅ Server running on http://localhost:3000</Text>
            </Text>
            <Text style={styles.terminalText}>
              <Text style={styles.info}>ℹ️  Notion Editor ready for testing</Text>
            </Text>
            <Text style={styles.terminalText}>
              <Text style={styles.prompt}>user@mobile-dev-studio</Text>
              <Text style={styles.path}>:~/project$</Text>
              <Text style={styles.cursor}>█</Text>
            </Text>
          </View>
        </View>

        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Available Commands</Text>
          <Text style={styles.featureItem}>📦 npm start - Start development server</Text>
          <Text style={styles.featureItem}>🧪 npm test - Run automated tests</Text>
          <Text style={styles.featureItem}>🏗️  npm run build - Build for production</Text>
          <Text style={styles.featureItem}>🔧 code . - Open in VS Code (Tab 3)</Text>
          <Text style={styles.featureItem}>🌐 open localhost:3000 - Preview (Tab 2)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#21262d',
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
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#161b22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#21262d',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f0f6fc',
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: '#7d8590',
  },
  statusValue: {
    fontSize: 16,
    color: '#238636',
    fontWeight: '500',
  },
  terminalContainer: {
    backgroundColor: '#161b22',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#21262d',
    overflow: 'hidden',
  },
  terminalHeader: {
    backgroundColor: '#21262d',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  terminalButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  terminalButton: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  terminalTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#7d8590',
    fontSize: 14,
    fontWeight: '500',
  },
  terminal: {
    padding: 16,
    minHeight: 200,
  },
  terminalText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#f0f6fc',
    marginBottom: 4,
  },
  prompt: {
    color: '#238636',
    fontWeight: 'bold',
  },
  path: {
    color: '#58a6ff',
    fontWeight: 'bold',
  },
  success: {
    color: '#238636',
  },
  info: {
    color: '#58a6ff',
  },
  cursor: {
    color: '#f0f6fc',
    opacity: 0.8,
  },
  featuresCard: {
    backgroundColor: '#161b22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262d',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f0f6fc',
    marginBottom: 12,
  },
  featureItem: {
    fontSize: 16,
    color: '#7d8590',
    paddingVertical: 6,
  },
});