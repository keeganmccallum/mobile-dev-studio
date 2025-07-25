# @keeganmccallum/expo-termux

Drop-in Termux integration for Expo applications with automatic configuration.

## Features

- 🚀 **Zero-config installation** - Automatically handles Kotlin version conflicts
- 📱 **Native Android Termux backend** - Real terminal functionality
- 🖥️ **xterm.js integration** - Professional terminal UI components  
- 🔧 **Session management** - Multiple terminal sessions with command execution
- ⚡ **Minimal setup** - Works with fresh Expo projects out of the box

## Installation

```bash
npm install @keeganmccallum/expo-termux
```

Add the plugin to your `app.json`:

```json
{
  "expo": {
    "plugins": ["@keeganmccallum/expo-termux"]
  }
}
```

## Quick Start

```tsx
import React from 'react';
import { TermuxTerminal } from '@keeganmccallum/expo-termux';

export default function App() {
  return (
    <TermuxTerminal 
      sessionId="main"
      onData={(data) => console.log('Terminal output:', data)}
      onExit={(code) => console.log('Session exited with code:', code)}
    />
  );
}
```

## Advanced Usage

### Programmatic Session Management

```tsx
import { termuxManager } from '@keeganmccallum/expo-termux';

// Create a new session
const sessionId = await termuxManager.createSession({
  command: '/data/data/com.termux/files/usr/bin/bash',
  cwd: '/data/data/com.termux/files/home',
  environment: { TERM: 'xterm-256color' }
});

// Write commands
await termuxManager.writeToSession(sessionId, 'ls -la\\n');

// Listen for output
termuxManager.onSessionOutput((id, lines) => {
  if (id === sessionId) {
    console.log('Output:', lines.join('\\n'));
  }
});
```

### Execute One-off Commands

```tsx
import { termuxManager } from '@keeganmccallum/expo-termux';

const result = await termuxManager.executeCommand('pwd');
console.log('Current directory:', result.stdout);
```

## Components

### TermuxTerminal

Main terminal component with xterm.js integration.

```tsx
<TermuxTerminal
  sessionId="unique-session-id"
  onData={(data) => void}
  onExit={(exitCode) => void}
  style={{ flex: 1 }}
/>
```

### XTermWebTerminal  

Alternative WebView-based terminal implementation.

```tsx
<XTermWebTerminal
  sessionId="session-id"  
  onCommand={(command) => void}
  style={{ flex: 1 }}
/>
```

## API Reference

### termuxManager

Global session manager instance.

#### Methods

- `createSession(config?)` - Create new terminal session
- `getSession(id)` - Get existing session by ID  
- `executeCommand(command, options?)` - Execute single command
- `writeToSession(id, data)` - Write data to session
- `killSession(id)` - Terminate session
- `getActiveSessions()` - List all active sessions

#### Events

- `onSessionOutput(callback)` - Listen for session output
- `onSessionExit(callback)` - Listen for session termination

## Configuration

The package automatically handles:

- ✅ Kotlin version compatibility (1.9.25 for Compose Compiler 1.5.15)
- ✅ Android build configuration (Java 17, proper SDK versions)
- ✅ Gradle plugin conflicts resolution
- ✅ Expo modules integration

No manual configuration required!

## Compatibility

- Expo SDK: 52.0.0+
- React Native: 0.75.4+
- Android: API 21+ (Android 5.0+)
- Kotlin: 1.9.25 (automatically enforced)

## Troubleshooting

### Build Errors

If you encounter Kotlin version conflicts, the package should resolve them automatically. If issues persist:

1. Clean your build: `cd android && ./gradlew clean`
2. Rebuild: `npx expo run:android`

### Terminal Not Working

Ensure you have proper Android permissions and the Termux bootstrap is installed. The package handles this automatically on first run.

## License

MIT

## Contributing

Issues and pull requests welcome on [GitHub](https://github.com/keeganmccallum/mobile-dev-studio).