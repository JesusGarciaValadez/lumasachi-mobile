# Lumasachi Control - React Native Application

Aplicación móvil para iOS y Android para gestión de órdenes con diferentes funcionalidades según el rol del usuario.

## 📋 Descripción

Lumasachi Control es una aplicación de gestión de órdenes donde los clientes pueden solicitar piezas o enviar piezas para reparación. El sistema cuenta con un flujo de aprobación, historial de cambios, notificaciones por email con códigos QR y gestión de documentos.

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js >= 18
- Yarn o npm
- React Native development environment configurado
  - Para iOS: Xcode 12+
  - Para Android: Android Studio y Android SDK

### Instalación

1. Instalar dependencias:
```bash
npm install
# o
yarn install
```

2. Para iOS, instalar pods:
```bash
cd ios && pod install && cd ..
```

### Ejecutar la aplicación

#### Android
```bash
npx react-native run-android
```

#### iOS
```bash
npx react-native run-ios
```

## 🏗️ Estructura del Proyecto

```
src/
├── components/      # Componentes reutilizables
├── screens/         # Pantallas de la aplicación
├── navigation/      # Configuración de navegación
├── services/        # Servicios y llamadas API
├── hooks/          # Custom hooks
├── types/          # TypeScript types e interfaces
├── utils/          # Funciones utilitarias
├── constants/      # Constantes de la aplicación
└── assets/         # Imágenes, fuentes, etc.
```

## 📱 Funcionalidades Principales

- **Sistema de Roles**: Super Administrator, Administrator, Employee, Customer
- **Gestión de Órdenes**: Crear, editar, y seguimiento de órdenes
- **Timeline de Cambios**: Historial completo con documentos adjuntos
- **Notificaciones**: Email con QR codes para acceso rápido
- **Exportación PDF**: Timeline exportable a PDF

## 🛠️ Stack Tecnológico

- **Frontend**: React Native + TypeScript
- **Estado**: TanStack Query
- **Navegación**: React Navigation
- **UI**: React Native Paper
- **Backend**: Laravel 12 + PostgreSQL

## 📖 Documentación

Para más información sobre los requerimientos del proyecto, consulta [README_PROJECT_REQUIREMENTS.md](README_PROJECT_REQUIREMENTS.md)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al Branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request