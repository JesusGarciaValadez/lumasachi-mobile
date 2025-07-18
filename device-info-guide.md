# React Native Device Info - Optional Installation Guide

## When You Might Need react-native-device-info

React Native's built-in `Platform` module provides basic device information:
- OS (iOS/Android)
- OS Version
- Platform-specific styling

However, you might need `react-native-device-info` if you require:
- Device manufacturer (e.g., Samsung, Apple)
- Device model (e.g., iPhone 14 Pro, Galaxy S23)
- Unique device ID
- Device name
- System name
- Brand
- Build number
- Bundle ID
- Carrier information
- Battery level
- Memory usage
- Storage information
- And many more detailed device properties

## Installation (Only if needed)

### Using npm:
```bash
npm install react-native-device-info
```

### Using yarn:
```bash
yarn add react-native-device-info
```

## Platform-specific Setup

### iOS Setup
After installation, you need to run:
```bash
cd ios && pod install
```

### Android Setup
For React Native 0.60+, the library should auto-link. For older versions, manual linking is required.

## Basic Usage Example

```typescript
import DeviceInfo from 'react-native-device-info';

// Example usage
const deviceId = DeviceInfo.getDeviceId(); // e.g., "iPhone7,2"
const brand = DeviceInfo.getBrand(); // e.g., "Apple"
const model = DeviceInfo.getModel(); // e.g., "iPhone 6"
const systemName = DeviceInfo.getSystemName(); // e.g., "iOS"
const systemVersion = DeviceInfo.getSystemVersion(); // e.g., "14.5"
const uniqueId = await DeviceInfo.getUniqueId(); // unique device identifier

// Compare with Platform module (built-in)
import { Platform } from 'react-native';

const os = Platform.OS; // "ios" or "android"
const version = Platform.Version; // OS version
```

## Decision Guide

### Use React Native's Platform module if you only need:
- To check if the app is running on iOS or Android
- Basic OS version information
- Platform-specific styling or code

### Install react-native-device-info if you need:
- Detailed hardware information
- Unique device identifiers
- Manufacturer/brand details
- Advanced system information
- Device capabilities information

## Important Note
Only add this dependency if you actually need the extended information. Adding unnecessary packages increases your app's bundle size and complexity.
