import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { terminalService } from '../services/TerminalService';

export default function PreviewScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [url, setUrl] = useState('http://localhost:3000');
  const [serverStatus, setServerStatus] = useState<'stopped' | 'running' | 'error'>('stopped');
  const webViewRef = useRef<WebView>(null);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Message from WebView:', data);
      
      // Handle different message types
      switch (data.type) {
        case 'TEST_RESULT':
          Alert.alert('Test Result', data.message);
          break;
        case 'ERROR':
          Alert.alert('Error', data.message);
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.log('Error parsing message:', error);
    }
  };

  const injectAutomationScript = () => {
    const script = `
      (function() {
        // Automation helper functions
        window.MobileDevStudio = {
          takeScreenshot: () => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SCREENSHOT_REQUEST',
              timestamp: Date.now()
            }));
          },
          
          testEditor: () => {
            try {
              const editor = document.querySelector('[data-slate-editor="true"]');
              if (editor) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'TEST_RESULT',
                  message: 'Editor found and ready!',
                  success: true
                }));
              } else {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'TEST_RESULT',
                  message: 'Editor not found',
                  success: false
                }));
              }
            } catch (error) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ERROR',
                message: error.message
              }));
            }
          },
          
          typeText: (text) => {
            try {
              const editor = document.querySelector('[data-slate-editor="true"]');
              if (editor) {
                editor.focus();
                document.execCommand('insertText', false, text);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'TEST_RESULT',
                  message: 'Text typed successfully!',
                  success: true
                }));
              }
            } catch (error) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ERROR',
                message: error.message
              }));
            }
          }
        };
        
        // Auto-run initial tests when page loads
        setTimeout(() => {
          if (window.MobileDevStudio) {
            window.MobileDevStudio.testEditor();
          }
        }, 2000);
      })();
      true;
    `;
    
    return script;
  };

  const runTest = (testType: string) => {
    const script = `
      if (window.MobileDevStudio) {
        switch('${testType}') {
          case 'editor':
            window.MobileDevStudio.testEditor();
            break;
          case 'type':
            window.MobileDevStudio.typeText('Hello from Mobile Dev Studio! 🚀');
            break;
          case 'screenshot':
            window.MobileDevStudio.takeScreenshot();
            break;
        }
      }
      true;
    `;
    
    webViewRef.current?.injectJavaScript(script);
  };

  useEffect(() => {
    // Listen for server status changes from terminal
    const handleServerStatus = (event: { type: string; data: any }) => {
      if (event.type === 'SERVER_STATUS_CHANGE') {
        setServerStatus(event.data.status);
        if (event.data.status === 'running' && event.data.url) {
          setUrl(event.data.url);
          // Auto-refresh the WebView when server starts
          setTimeout(() => {
            webViewRef.current?.reload();
          }, 1000);
        }
      }
    };

    terminalService.addEventListener(handleServerStatus);
    
    // Get initial server status
    const initialStatus = terminalService.getServerStatus();
    setServerStatus(initialStatus.status);
    if (initialStatus.url) {
      setUrl(initialStatus.url);
    }

    return () => {
      terminalService.removeEventListener(handleServerStatus);
    };
  }, []);

  const refreshPage = () => {
    webViewRef.current?.reload();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>🌐 Live Preview</Text>
          <Text style={styles.headerSubtitle}>Interactive Testing & Automation</Text>
        </View>
        
        <View style={styles.serverStatus}>
          <View style={[
            styles.statusDot, 
            { backgroundColor: serverStatus === 'running' ? '#238636' : serverStatus === 'error' ? '#f85149' : '#7d8590' }
          ]} />
          <Text style={styles.serverStatusText}>
            {serverStatus === 'running' ? 'Server Running' : 
             serverStatus === 'error' ? 'Server Error' : 'Server Stopped'}
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={refreshPage}>
          <Ionicons name="refresh" size={20} color="#58a6ff" />
          <Text style={styles.controlText}>Refresh</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={() => runTest('editor')}
        >
          <Ionicons name="checkmark-circle" size={20} color="#238636" />
          <Text style={styles.controlText}>Test Editor</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={() => runTest('type')}
        >
          <Ionicons name="text" size={20} color="#f85149" />
          <Text style={styles.controlText}>Type Test</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.webViewContainer}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {serverStatus === 'running' ? 'Loading Notion Editor...' : 'Connecting to Development Server...'}
            </Text>
            <Text style={styles.loadingSubtext}>
              {serverStatus === 'running' 
                ? 'Server is running, loading application...' 
                : 'Run "npm start" in Terminal tab to start the development server'}
            </Text>
          </View>
        )}
        
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          style={styles.webView}
          onMessage={handleMessage}
          injectedJavaScript={injectAutomationScript()}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={(error) => {
            console.log('WebView error:', error);
            const errorMessage = serverStatus === 'running' 
              ? 'Could not load the application. Check server logs in Terminal tab.'
              : 'Development server not running. Start it with "npm start" in Terminal tab.';
            Alert.alert('Connection Error', errorMessage);
          }}
          allowsBackForwardNavigationGestures
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Connecting...</Text>
            </View>
          )}
        />
      </View>

      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          <Text style={styles.statusLabel}>URL:</Text> {url}
        </Text>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: isLoading ? '#f85149' : '#238636' }]} />
          <Text style={styles.statusText}>{isLoading ? 'Loading' : 'Connected'}</Text>
        </View>
      </View>
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
  controls: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#21262d',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161b22',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#21262d',
    gap: 6,
  },
  controlText: {
    color: '#f0f6fc',
    fontSize: 14,
    fontWeight: '500',
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d1117',
    zIndex: 10,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f0f6fc',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#7d8590',
    textAlign: 'center',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#161b22',
    borderTopWidth: 1,
    borderTopColor: '#21262d',
  },
  statusText: {
    fontSize: 12,
    color: '#7d8590',
    flex: 1,
  },
  statusLabel: {
    fontWeight: '600',
    color: '#f0f6fc',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  serverStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#161b22',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#21262d',
  },
  serverStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#f0f6fc',
  },
});