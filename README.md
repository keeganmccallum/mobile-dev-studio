# 🚀 Mobile Dev Studio

> A revolutionary mobile development environment that puts a complete development studio in your pocket!

## 🎯 Vision

Transform your mobile device into a powerful development workstation with:
- **🐧 Tab 1: Terminal Environment** - Embedded Termux/Alpine Linux with Node.js
- **🌐 Tab 2: Live Preview & Testing** - Interactive WebView with automated testing
- **💻 Tab 3: Code Editor** - VS Code integration via web interface

## ✨ Features

### 🐧 Terminal Environment
- Embedded Alpine Linux via proot-distro
- Full Node.js development stack
- Real-time server status monitoring
- Terminal emulation with GitHub-style UI
- Development server management

### 🌐 Live Preview & Testing
- WebView integration with localhost development server
- Bi-directional communication between native app and web content
- Automated testing capabilities with JavaScript injection
- Screenshot capture and interaction recording
- Real-time debugging and monitoring

### 💻 Code Editor Integration
- VS Code Web interface support
- GitHub Codespaces integration
- Local code-server compatibility
- Mobile-optimized editor interface
- File system bridge for seamless editing

## 🏗️ Architecture

```
📱 Expo React Native App
├── 🏠 Tab 1: Development Environment
│   ├── 🐧 Embedded Termux/Alpine (proot)
│   ├── 📦 Node.js + Development Stack
│   ├── 🧪 Testing Automation (Puppeteer)
│   └── 📊 Real-time Logs & Status
│
├── 🌐 Tab 2: Live Preview/Testing  
│   ├── 📱 WebView → localhost:3000
│   ├── 🤖 Automated Testing Interface
│   ├── 📸 Screenshot Capture
│   └── 🔄 Hot Reload Integration
│
└── 💻 Tab 3: Code Editor
    ├── 🌐 WebView → VS Code Web/CodeServer
    ├── 📁 File System Bridge
    ├── 🔗 Git Integration
    └── 🎨 Mobile-Optimized UI
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- Android/iOS development environment

### Installation

```bash
# Clone the repository
git clone https://github.com/keeganmccallum/mobile-dev-studio.git
cd mobile-dev-studio

# Install dependencies
npm install

# Start development server
npm start
```

### Running on Device

```bash
# Android
npm run android

# iOS
npm run ios

# Web (for testing)
npm run web
```

## 🛠️ Development Workflow

### Branching Strategy
- `main` - Production-ready code
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical fixes

### Creating Features

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add amazing new feature"

# Push and create PR
git push -u origin feature/your-feature-name
gh pr create --title "Add amazing new feature"
```

## 📦 Technology Stack

- **Framework**: Expo React Native
- **Navigation**: React Navigation (Bottom Tabs)
- **WebView**: react-native-webview
- **Icons**: Expo Vector Icons
- **Styling**: React Native StyleSheet
- **TypeScript**: Full type safety

## 🎨 Design System

### Color Palette
- **Background**: `#0d1117` (GitHub Dark)
- **Surface**: `#161b22` 
- **Border**: `#21262d`
- **Primary**: `#0969da` (GitHub Blue)
- **Success**: `#238636` (GitHub Green)
- **Error**: `#f85149` (GitHub Red)
- **Text Primary**: `#f0f6fc`
- **Text Secondary**: `#7d8590`

### Typography
- **Headers**: SF Pro Display / System Font
- **Body**: SF Pro Text / System Font  
- **Code**: SF Mono / Monospace

## 🧪 Testing

```bash
# Run tests
npm test

# Run specific test suite
npm run test:terminal
npm run test:preview
npm run test:editor
```

## 📱 Platform Support

- ✅ **Android 7.0+** (API 24+)
- ✅ **iOS 12.0+**
- ✅ **Web** (Development/Testing)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Expo Team** - For the amazing React Native framework
- **Termux Community** - For mobile Linux environments
- **VS Code Team** - For the incredible editor and web integration
- **React Navigation** - For seamless navigation patterns

## 🗺️ Roadmap

### Phase 1: Core Infrastructure ✅
- [x] 3-tab navigation setup
- [x] Basic UI/UX design
- [x] WebView integration
- [x] Project structure

### Phase 2: Terminal Integration 🚧
- [ ] Embedded Alpine Linux
- [ ] proot-distro integration
- [ ] Terminal emulation (xterm.js)
- [ ] Process management

### Phase 3: Advanced Features 📋
- [ ] File system bridge
- [ ] Git integration
- [ ] Extensions marketplace
- [ ] Cloud sync capabilities

### Phase 4: Polish & Distribution 📋
- [ ] Performance optimization
- [ ] App store deployment
- [ ] Documentation completion
- [ ] Community building

---

**Built with ❤️ by [Keegan McCallum](https://github.com/keeganmccallum)**

*Revolutionizing mobile development, one commit at a time! 🚀*