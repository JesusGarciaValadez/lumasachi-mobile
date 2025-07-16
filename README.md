# Lumasachi Control - React Native Application

A mobile application for iOS and Android for order management with different functionalities according to user roles.

## 📋 Description

Lumasachi Control is an order management application where customers can request parts or send parts for repair. The system features an approval flow, change history, email notifications with QR codes, and document management.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- Yarn or npm
- React Native development environment configured
  - For iOS: Xcode 12+
  - For Android: Android Studio and Android SDK

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. For iOS, install pods:
```bash
cd ios && pod install && cd ..
```

### Running the application

#### Android
```bash
npx react-native run-android
```

#### iOS
```bash
npx react-native run-ios
```

## 🏗️ Project Structure

```
src/
├── components/      # Reusable components
├── screens/         # Application screens
├── navigation/      # Navigation configuration
├── services/        # Services and API calls
├── hooks/          # Custom hooks
├── types/          # TypeScript types and interfaces
├── utils/          # Utility functions
├── constants/      # Application constants
├── i18n/           # Internationalization
└── assets/         # Images, fonts, etc.
```

## 📱 Main Features

- **Role System**: Super Administrator, Administrator, Employee, Customer
- **Order Management**: Create, edit, and track orders
- **Change Timeline**: Complete history with attached documents
- **Notifications**: Email with QR codes for quick access
- **Data Export**: Complete export of users, orders, system logs, and analysis in PDF format
- **Multi-language Support**: English and Spanish
- **Permissions System**: Granular role-based access control
- **File Management**: Document upload and management
- **Responsive Design**: Optimized for mobile devices

### 📋 Data Export

The application supports data export in PDF format only (MVP):

- **User Data**: Export complete user information
- **Order Data**: Export order history and details
- **System Logs**: Export system activity logs
- **Analysis**: Export analytics and performance data

> **Note**: In the MVP, only PDF export is supported. For additional formats (Excel, CSV, JSON), contact the system administrator.

## 🛠️ Technology Stack

- **Frontend**: React Native + TypeScript
- **State Management**: TanStack Query
- **Navigation**: React Navigation
- **UI**: React Native Paper
- **Internationalization**: i18next
- **Forms**: React Hook Form
- **Backend**: Laravel 12 + PostgreSQL

## 🔐 Permissions System

The application implements a comprehensive role-based access control system:

- **Super Administrator**: Full access to all system functions
- **Administrator**: Manage users, orders, and system settings
- **Employee**: Create and manage orders, limited user access
- **Customer**: View and create their own orders

See `docs/PERMISSIONS_SYSTEM.md` for detailed documentation.

## 📱 Available Scripts

- `npm run start` - Start the Metro bundler
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## 📁 Key Components

### Services
- `apiPermissionsService` - API permission management
- `permissionsService` - Local permissions logic
- `fileService` - File upload and management
- `exportService` - Data export functionality
- `queryClient` - TanStack Query configuration

### Hooks
- `usePermissions` - Permission checking and validation
- `useFileUpload` - File upload functionality
- `useAuth` - Authentication management
- `useOrderStats` - Order statistics
- `useTranslationSafe` - Safe translation with error handling

## 🌍 Internationalization

The application supports multiple languages:
- English (default)
- Spanish

Language can be changed in the Settings screen and persists across app restarts.

## 🧪 Testing

The application includes comprehensive testing:
- Component tests
- Hook tests
- Service tests
- Navigation tests
- Integration tests

Run tests with:
```bash
npm run test
```

## 📖 Documentation

For more information about project requirements, see [README_PROJECT_REQUIREMENTS.md](README_PROJECT_REQUIREMENTS.md)

For React Native specific documentation, see [README_REACT_NATIVE.md](README_REACT_NATIVE.md)

## 🚀 Development

### Code Style
- Use TypeScript for type safety
- Follow React Native best practices
- Use ESLint for code quality
- Implement proper error handling
- Write comprehensive tests

### Contributing
1. Fork the project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 🔄 Status

Current version: 0.0.1
Status: Development
Last updated: December 2024