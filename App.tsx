import React from 'react';
import { View, Text } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d1117' }}>
      <Text style={{ color: '#f0f6fc', fontSize: 24 }}>🚀 Minimal Test App</Text>
      <Text style={{ color: '#7d8590', fontSize: 16, marginTop: 8 }}>Testing basic launch functionality</Text>
    </View>
  );
}