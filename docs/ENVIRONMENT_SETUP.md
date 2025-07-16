# Environment Setup Guide - Lumasachi Control

This guide provides step-by-step instructions for setting up the development environment for the Lumasachi Control React Native application.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [System Requirements](#system-requirements)
- [Node.js Setup](#nodejs-setup)
- [React Native CLI Installation](#react-native-cli-installation)
- [iOS Development Setup](#ios-development-setup)
- [Android Development Setup](#android-development-setup)
- [Project Installation](#project-installation)
- [IDE Configuration](#ide-configuration)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## 📋 Prerequisites

Before starting, ensure you have:

- **macOS** (for iOS development) or **Windows/Linux** (for Android development)
- **Administrator/sudo access** on your machine
- **Stable internet connection** for downloading dependencies
- **Git** installed and configured

---

## 🔧 System Requirements

### Minimum Requirements

- **RAM**: 8GB (16GB recommended)
- **Storage**: 10GB free space (SSD recommended)
- **Processor**: Intel i5 / AMD Ryzen 5 or equivalent

### Supported Operating Systems

- **macOS**: 10.15 (Catalina) or later
- **Windows**: Windows 10 or later
- **Linux**: Ubuntu 18.04 or later

---

## 🟢 Node.js Setup

### Install Node.js

#### Option 1: Using Node Version Manager (Recommended)

**macOS/Linux:**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell configuration
source ~/.bashrc

# Install Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

**Windows:**
```powershell
# Install nvm-windows from GitHub releases
# Download from: https://github.com/coreybutler/nvm-windows/releases

# Install Node.js 18
nvm install 18.17.0
nvm use 18.17.0

# Verify installation
node --version
npm --version
```

#### Option 2: Direct Installation

Download and install Node.js 18+ from [nodejs.org](https://nodejs.org/)

### Configure npm

```bash
# Set npm registry (optional)
npm config set registry https://registry.npmjs.org/

# Increase npm timeout
npm config set fetch-timeout 600000

# Set npm cache directory
npm config set cache ~/.npm-cache
```

---

## ⚡ React Native CLI Installation

### Install React Native CLI

```bash
# Install React Native CLI globally
npm install -g react-native-cli

# Verify installation
react-native --version
```

### Install Development Tools

```bash
# Install useful development tools
npm install -g yarn
npm install -g watchman  # macOS only
npm install -g react-native-debugger
```

---

## 🍎 iOS Development Setup

### Prerequisites (macOS only)

1. **Xcode**: Install from Mac App Store
2. **Command Line Tools**: Install via terminal

### Step-by-Step Setup

#### 1. Install Xcode

```bash
# Install Xcode from Mac App Store
# Or download from Apple Developer Portal

# Accept Xcode license
sudo xcodebuild -license accept

# Install Command Line Tools
xcode-select --install
```

#### 2. Configure Xcode

```bash
# Set Xcode path
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

# Verify Xcode installation
xcodebuild -version
```

#### 3. Install CocoaPods

```bash
# Install CocoaPods
sudo gem install cocoapods

# Initialize CocoaPods
pod setup

# Verify installation
pod --version
```

#### 4. iOS Simulator Setup

```bash
# List available simulators
xcrun simctl list devices

# Boot iOS simulator
xcrun simctl boot "iPhone 14"

# Open simulator
open -a Simulator
```

---

## 🤖 Android Development Setup

### Prerequisites

1. **Java Development Kit (JDK)**
2. **Android Studio**
3. **Android SDK**

### Step-by-Step Setup

#### 1. Install Java Development Kit

**macOS:**
```bash
# Using Homebrew
brew install openjdk@11

# Add to PATH
echo 'export PATH="/opt/homebrew/opt/openjdk@11/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Windows:**
```powershell
# Download and install JDK 11 from Oracle or OpenJDK
# https://jdk.java.net/11/

# Set JAVA_HOME environment variable
setx JAVA_HOME "C:\Program Files\Java\jdk-11.0.x"
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-11-jdk

# Verify installation
java -version
```

#### 2. Install Android Studio

1. Download Android Studio from [developer.android.com](https://developer.android.com/studio)
2. Run the installer and follow the setup wizard
3. Install the following SDK components:
   - Android SDK Platform 31 (API Level 31)
   - Android SDK Build-Tools 31.0.0
   - Android SDK Platform-Tools
   - Android SDK Tools
   - Intel x86 Atom_64 System Images (for emulator)

#### 3. Configure Android SDK

**macOS/Linux:**
```bash
# Add to shell profile (~/.bashrc, ~/.zshrc, etc.)
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
export ANDROID_HOME=$HOME/Android/Sdk          # Linux
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Reload shell
source ~/.zshrc  # or ~/.bashrc
```

**Windows:**
```powershell
# Set environment variables
setx ANDROID_HOME "C:\Users\%USERNAME%\AppData\Local\Android\Sdk"
setx PATH "%PATH%;%ANDROID_HOME%\emulator;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin;%ANDROID_HOME%\platform-tools"
```

#### 4. Create Android Virtual Device

```bash
# List available AVDs
emulator -list-avds

# Create AVD using Android Studio
# OR using command line:
avdmanager create avd -n TestDevice -k "system-images;android-31;google_apis;x86_64"

# Start emulator
emulator @TestDevice
```

---

## 🚀 Project Installation

### Clone and Setup

```bash
# Clone the repository
git clone https://github.com/your-org/lumasachi-react-native.git
cd lumasachi-react-native

# Install dependencies
npm install

# iOS specific setup
cd ios
pod install
cd ..

# Verify React Native installation
npx react-native doctor
```

### Environment Variables

Create a `.env` file in the project root:

```bash
# .env file
API_URL=https://api-dev.lumasachi.com
DEBUG=true
ENABLE_FLIPPER=true
```

---

## 🔧 IDE Configuration

### Visual Studio Code

#### Install Extensions

```bash
# Install VS Code extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-react-native
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-eslint
```

#### Configure Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "typescriptreact"
  },
  "typescript.suggest.autoImports": true,
  "javascript.suggest.autoImports": true,
  "reactNative.packager.port": 8081
}
```

#### Configure Launch Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug iOS",
      "type": "reactNative",
      "request": "launch",
      "platform": "ios"
    },
    {
      "name": "Debug Android",
      "type": "reactNative",
      "request": "launch",
      "platform": "android"
    }
  ]
}
```

### Alternative IDEs

#### WebStorm
1. Install React Native plugin
2. Configure TypeScript support
3. Set up ESLint and Prettier

#### Atom
1. Install atom-react-native plugin
2. Configure language-typescript
3. Set up linter-eslint

---

## ✅ Verification

### Run Verification Commands

```bash
# Verify Node.js
node --version  # Should show v18.x.x

# Verify npm
npm --version   # Should show 9.x.x or higher

# Verify React Native CLI
react-native --version

# Verify CocoaPods (macOS)
pod --version

# Verify Java (Android)
java -version

# Verify Android SDK
adb version

# Run React Native doctor
npx react-native doctor
```

### Test Project Setup

```bash
# Start Metro bundler
npm start

# Test iOS (macOS only)
npm run ios

# Test Android
npm run android

# Run tests
npm test
```

### Expected Output

✅ **Success indicators:**
- Metro bundler starts without errors
- App builds successfully
- App runs on simulator/emulator
- All tests pass
- No warnings in React Native doctor

---

## 🚨 Troubleshooting

### Common Issues

#### Node.js Issues

**Problem:** `npm command not found`
```bash
# Solution: Add npm to PATH
export PATH=$PATH:/usr/local/bin/npm
```

**Problem:** `Permission denied` errors
```bash
# Solution: Fix npm permissions
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

#### iOS Issues

**Problem:** `pod install` fails
```bash
# Solution: Clean CocoaPods cache
cd ios
pod cache clean --all
pod deintegrate
pod install
```

**Problem:** Xcode build fails
```bash
# Solution: Clean Xcode build
cd ios
rm -rf build/
rm -rf DerivedData/
xcodebuild clean
```

**Problem:** Simulator not found
```bash
# Solution: Reset simulator
xcrun simctl erase all
xcrun simctl boot "iPhone 14"
```

#### Android Issues

**Problem:** `ANDROID_HOME` not set
```bash
# Solution: Set environment variable
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**Problem:** Emulator won't start
```bash
# Solution: Check virtualization
# Enable Intel VT-x/AMD-V in BIOS
# OR use ARM emulator on Apple Silicon
```

**Problem:** Build fails with Gradle errors
```bash
# Solution: Clean Gradle cache
cd android
./gradlew clean
rm -rf .gradle/
```

#### Metro Bundler Issues

**Problem:** Metro bundler won't start
```bash
# Solution: Reset Metro cache
npx react-native start --reset-cache
```

**Problem:** Port already in use
```bash
# Solution: Kill process on port 8081
lsof -ti:8081 | xargs kill -9
```

### Performance Issues

**Problem:** Slow build times
```bash
# Solution: Enable Gradle daemon
echo "org.gradle.daemon=true" >> ~/.gradle/gradle.properties
echo "org.gradle.parallel=true" >> ~/.gradle/gradle.properties
```

**Problem:** Slow simulator
```bash
# Solution: Allocate more resources
# Increase simulator RAM in Android Studio
# Close unnecessary applications
```

### Environment Specific Issues

#### macOS Apple Silicon (M1/M2)

```bash
# Install Rosetta 2
softwareupdate --install-rosetta

# Use ARM-based tools
arch -arm64 brew install watchman
arch -arm64 pod install
```

#### Windows WSL

```bash
# Install Windows Subsystem for Linux
# Use Ubuntu 20.04 LTS
# Follow Linux setup instructions
```

---

## 📋 Environment Checklist

Before starting development, ensure:

- [ ] Node.js 18+ installed
- [ ] React Native CLI installed
- [ ] Xcode installed and configured (macOS)
- [ ] Android Studio installed and configured
- [ ] Java JDK 11 installed
- [ ] Environment variables set
- [ ] Project dependencies installed
- [ ] iOS pods installed (macOS)
- [ ] Simulator/emulator working
- [ ] IDE configured with extensions
- [ ] All verification tests pass

---

## 🔄 Maintenance

### Regular Updates

```bash
# Update Node.js
nvm install node --latest-npm
nvm use node

# Update React Native CLI
npm update -g react-native-cli

# Update project dependencies
npm update

# Update CocoaPods (macOS)
sudo gem update cocoapods

# Update Android SDK
# Use Android Studio SDK Manager
```

### Cleaning Up

```bash
# Clean npm cache
npm cache clean --force

# Clean React Native cache
npx react-native start --reset-cache

# Clean iOS build (macOS)
cd ios && xcodebuild clean && cd ..

# Clean Android build
cd android && ./gradlew clean && cd ..
```

---

## 📚 Additional Resources

### Documentation
- [React Native Environment Setup](https://reactnative.dev/docs/environment-setup)
- [Android Studio Setup](https://developer.android.com/studio/install)
- [Xcode Setup](https://developer.apple.com/xcode/)

### Tools
- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
- [Flipper](https://fbflipper.com/)
- [Android Studio](https://developer.android.com/studio)

### Community
- [React Native Community](https://github.com/react-native-community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/react-native)
- [Discord](https://discord.gg/react-native)

---

## 🆘 Getting Help

If you encounter issues:

1. **Check this guide** for common solutions
2. **Run `npx react-native doctor`** for diagnostic information
3. **Search existing issues** on the project repository
4. **Create a new issue** with detailed information:
   - Operating system and version
   - Node.js version
   - React Native version
   - Complete error messages
   - Steps to reproduce

---

*Last updated: December 2024*
*Version: 1.0.0* 