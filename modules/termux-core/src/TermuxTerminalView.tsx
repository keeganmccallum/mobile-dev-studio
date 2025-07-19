import React, { useRef, useImperativeHandle, useEffect } from 'react';
import { ViewProps } from 'react-native';
import { requireNativeViewManager } from 'expo-modules-core';

export interface TermuxTerminalViewProps extends ViewProps {
  command?: string;
  workingDirectory?: string;
  environment?: Record<string, string>;
  onSessionOutput?: (event: { sessionId: string; lines: string[] }) => void;
  onSessionExit?: (event: { sessionId: string; exitCode: number }) => void;
  onTitleChanged?: (event: { sessionId: string; title: string }) => void;
  autoStart?: boolean;
}

export interface TermuxTerminalRef {
  createSession: () => Promise<void>;
  writeToSession: (data: string) => Promise<void>;
  killSession: () => Promise<void>;
  sendCommand: (command: string) => Promise<void>;
}

const NativeView = requireNativeViewManager('TermuxTerminalView');

const TermuxTerminalView = React.forwardRef<TermuxTerminalRef, TermuxTerminalViewProps>((props, ref) => {
  const nativeRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    createSession: async () => {
      if (nativeRef.current) {
        return await nativeRef.current.createSession();
      }
    },
    writeToSession: async (data: string) => {
      if (nativeRef.current) {
        return await nativeRef.current.writeToSession(data);
      }
    },
    killSession: async () => {
      if (nativeRef.current) {
        return await nativeRef.current.killSession();
      }
    },
    sendCommand: async (command: string) => {
      if (nativeRef.current) {
        // Send command followed by enter
        return await nativeRef.current.writeToSession(command + '\n');
      }
    }
  }));

  useEffect(() => {
    // Auto-start session if requested
    if (props.autoStart && nativeRef.current) {
      nativeRef.current.createSession();
    }
  }, [props.autoStart]);

  return (
    <NativeView
      {...props}
      ref={nativeRef}
      command={props.command || '/data/data/com.termux/files/usr/bin/bash'}
      workingDirectory={props.workingDirectory || '/data/data/com.termux/files/home'}
      environment={props.environment || {
        PATH: '/data/data/com.termux/files/usr/bin:/data/data/com.termux/files/usr/bin/applets',
        HOME: '/data/data/com.termux/files/home',
        PREFIX: '/data/data/com.termux/files/usr',
        TMPDIR: '/data/data/com.termux/files/usr/tmp',
        SHELL: '/data/data/com.termux/files/usr/bin/bash',
        TERM: 'xterm-256color',
        LANG: 'en_US.UTF-8'
      }}
      onSessionOutput={props.onSessionOutput}
      onSessionExit={props.onSessionExit}
      onTitleChanged={props.onTitleChanged}
    />
  );
});

export default TermuxTerminalView;