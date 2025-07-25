import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TermuxTerminal } from '@keeganmccallum/expo-termux';

export default function TerminalScreen() {
  const handleTerminalData = (data: string) => {
    console.log('Terminal output:', data);
  };

  const handleTerminalExit = (exitCode: number) => {
    console.log('Terminal session exited with code:', exitCode);
  };

  return (
    <View style={styles.container}>
      <TermuxTerminal
        sessionId="main-terminal"
        onData={handleTerminalData}
        onExit={handleTerminalExit}
        style={styles.terminal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  terminal: {
    flex: 1,
  },
});