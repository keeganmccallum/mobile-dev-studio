import React from 'react';
import { ViewProps } from 'react-native';
import { requireNativeViewManager } from 'expo-modules-core';

export interface TermuxTerminalViewProps extends ViewProps {
  command?: string;
  workingDirectory?: string;
  environment?: Record<string, string>;
  onSessionOutput?: (data: string) => void;
  onSessionExit?: (exitCode: number) => void;
}

const NativeView = requireNativeViewManager('TermuxTerminalView');

const TermuxTerminalView = React.forwardRef((props: TermuxTerminalViewProps, ref: any) => {
  return (
    <NativeView
      {...props}
      ref={ref}
      command={props.command || '/data/data/com.termux/files/usr/bin/bash'}
      workingDirectory={props.workingDirectory || '/data/data/com.termux/files/home'}
      environment={props.environment || {
        PATH: '/data/data/com.termux/files/usr/bin:/data/data/com.termux/files/usr/bin/applets',
        HOME: '/data/data/com.termux/files/home',
        PREFIX: '/data/data/com.termux/files/usr',
        TMPDIR: '/data/data/com.termux/files/usr/tmp',
        TERM: 'xterm-256color',
        LANG: 'en_US.UTF-8'
      }}
    />
  );
});

export default TermuxTerminalView;