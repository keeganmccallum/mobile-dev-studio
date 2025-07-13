import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

export default function EditorScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [url, setUrl] = useState('https://vscode.dev');
  const [customUrl, setCustomUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const presetUrls = [
    { name: 'VS Code Web', url: 'https://vscode.dev', icon: 'code-slash' },
    { name: 'GitHub Codespaces', url: 'https://github.com/codespaces', icon: 'logo-github' },
    { name: 'Local Code Server', url: 'http://localhost:8080', icon: 'desktop' },
  ];

  const loadUrl = (newUrl: string) => {
    setUrl(newUrl);
    setShowUrlInput(false);
  };

  const openCustomUrl = () => {
    if (customUrl.trim()) {
      loadUrl(customUrl.trim());
      setCustomUrl('');
    }
  };

  const injectCodeServerHelpers = () => {
    const script = `
      (function() {
        // Helper functions for VS Code integration
        window.MobileDevStudio = {
          openProject: (path) => {
            // This would integrate with our file system bridge
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'OPEN_PROJECT',
              path: path
            }));
          },
          
          saveFile: () => {
            // Trigger save via keyboard shortcut
            const event = new KeyboardEvent('keydown', {
              key: 's',
              ctrlKey: true,
              metaKey: true,
              bubbles: true
            });
            document.dispatchEvent(event);
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'FILE_SAVED',
              message: 'File saved successfully'
            }));
          },
          
          openTerminal: () => {
            // This would switch to Terminal tab
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SWITCH_TAB',
              tab: 'terminal'
            }));
          },
          
          openPreview: () => {
            // This would switch to Preview tab
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SWITCH_TAB',
              tab: 'preview'
            }));
          }
        };
        
        // Customize VS Code for mobile
        setTimeout(() => {
          // Hide some desktop-specific UI elements
          const style = document.createElement('style');
          style.textContent = \`
            /* Mobile optimizations */
            .monaco-workbench .part.titlebar {
              display: none !important;
            }
            .monaco-workbench .part.activitybar {
              width: 60px !important;
            }
            .monaco-workbench .part.sidebar {
              width: 300px !important;
            }
            /* Larger touch targets */
            .monaco-tree .monaco-tree-row {
              min-height: 44px !important;
            }
            .tab {
              min-height: 44px !important;
            }
          \`;
          document.head.appendChild(style);
        }, 2000);
      })();
      true;
    `;
    
    return script;
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Message from VS Code:', data);
      
      switch (data.type) {
        case 'OPEN_PROJECT':
          Alert.alert('Open Project', `Opening: ${data.path}`);
          break;
        case 'FILE_SAVED':
          Alert.alert('File Saved', data.message);
          break;
        case 'SWITCH_TAB':
          Alert.alert('Tab Switch', `Switching to ${data.tab} tab`);
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.log('Error parsing message:', error);
    }
  };

  const runEditorAction = (action: string) => {
    const script = `
      if (window.MobileDevStudio) {
        window.MobileDevStudio.${action}();
      }
      true;
    `;
    
    webViewRef.current?.injectJavaScript(script);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💻 Code Editor</Text>
        <Text style={styles.headerSubtitle}>VS Code Integration</Text>
      </View>

      <View style={styles.urlSection}>
        <View style={styles.presetUrls}>
          {presetUrls.map((preset, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.presetButton,
                url === preset.url && styles.presetButtonActive
              ]}
              onPress={() => loadUrl(preset.url)}
            >
              <Ionicons 
                name={preset.icon as any} 
                size={16} 
                color={url === preset.url ? '#0969da' : '#7d8590'} 
              />
              <Text style={[
                styles.presetText,
                url === preset.url && styles.presetTextActive
              ]}>
                {preset.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity
          style={styles.customUrlButton}
          onPress={() => setShowUrlInput(!showUrlInput)}
        >
          <Ionicons name="link" size={16} color="#7d8590" />
          <Text style={styles.customUrlText}>Custom URL</Text>
        </TouchableOpacity>
      </View>

      {showUrlInput && (
        <View style={styles.urlInputContainer}>
          <TextInput
            style={styles.urlInput}
            value={customUrl}
            onChangeText={setCustomUrl}
            placeholder="Enter custom URL (e.g., http://localhost:8080)"
            placeholderTextColor="#7d8590"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.urlInputButton} onPress={openCustomUrl}>
            <Ionicons name="arrow-forward" size={20} color="#0969da" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={() => webViewRef.current?.reload()}
        >
          <Ionicons name="refresh" size={20} color="#58a6ff" />
          <Text style={styles.controlText}>Refresh</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={() => runEditorAction('saveFile')}
        >
          <Ionicons name="save" size={20} color="#238636" />
          <Text style={styles.controlText}>Save</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={() => runEditorAction('openTerminal')}
        >
          <Ionicons name="terminal" size={20} color="#f85149" />
          <Text style={styles.controlText}>Terminal</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.webViewContainer}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading VS Code...</Text>
            <Text style={styles.loadingSubtext}>
              {url.includes('localhost') 
                ? 'Make sure code-server is running' 
                : 'Connecting to web editor'
              }
            </Text>
          </View>
        )}
        
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          style={styles.webView}
          onMessage={handleMessage}
          injectedJavaScript={injectCodeServerHelpers()}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={(error) => {
            console.log('WebView error:', error);
            Alert.alert(
              'Connection Error', 
              url.includes('localhost') 
                ? 'Could not connect to local code-server. Please start it in Terminal tab.'
                : 'Could not load web editor. Please check your internet connection.'
            );
          }}
          allowsBackForwardNavigationGestures
          startInLoadingState
          userAgent="Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
        />
      </View>

      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          <Text style={styles.statusLabel}>Editor:</Text> {
            url.includes('vscode.dev') ? 'VS Code Web' :
            url.includes('github.com') ? 'GitHub Codespaces' :
            url.includes('localhost') ? 'Local Code Server' :
            'Custom'
          }
        </Text>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: isLoading ? '#f85149' : '#238636' }]} />
          <Text style={styles.statusText}>{isLoading ? 'Loading' : 'Ready'}</Text>
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
  urlSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#21262d',
  },
  presetUrls: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161b22',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#21262d',
    gap: 6,
    flex: 1,
  },
  presetButtonActive: {
    borderColor: '#0969da',
    backgroundColor: '#0d419d20',
  },
  presetText: {
    color: '#7d8590',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  presetTextActive: {
    color: '#0969da',
  },
  customUrlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161b22',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#21262d',
    gap: 6,
  },
  customUrlText: {
    color: '#7d8590',
    fontSize: 14,
    fontWeight: '500',
  },
  urlInputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  urlInput: {
    flex: 1,
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#21262d',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#f0f6fc',
    fontSize: 14,
  },
  urlInputButton: {
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#21262d',
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
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
    flex: 1,
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
});