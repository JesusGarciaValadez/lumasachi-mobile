# API Documentation - Lumasachi Control

This document provides comprehensive documentation for all implemented APIs, services, and hooks in the Lumasachi Control React Native application.

## 📋 Table of Contents

- [Services](#services)
  - [apiPermissionsService](#apipermissionsservice)
  - [permissionsService](#permissionsservice)
  - [fileService](#fileservice)
  - [exportService](#exportservice)
  - [queryClient](#queryclient)
- [Hooks](#hooks)
  - [usePermissions](#usepermissions)
  - [useFileUpload](#usefileupload)
  - [useAuth](#useauth)
  - [useOrderStats](#useorderstats)
  - [useTranslationSafe](#usetranslationsafe)
- [HTTP Client](#http-client)
- [Type Definitions](#type-definitions)

---

## 🔧 Services

### apiPermissionsService

Handles API communication for permissions management and synchronization with the backend.

#### Methods

##### `syncPermissions()`
```typescript
syncPermissions(): Promise<PermissionMatrix>
```

Synchronizes permissions from the backend API.

**Returns:** Promise resolving to `PermissionMatrix`

**Example:**
```typescript
const permissions = await apiPermissionsService.syncPermissions();
```

##### `getCachedPermissions()`
```typescript
getCachedPermissions(): PermissionMatrix | null
```

Retrieves cached permissions from local storage.

**Returns:** `PermissionMatrix` or `null` if not cached

##### `clearPermissionsCache()`
```typescript
clearPermissionsCache(): Promise<void>
```

Clears the local permissions cache.

##### `validatePermissionWithAPI()`
```typescript
validatePermissionWithAPI(userId: string, permission: string): Promise<boolean>
```

Validates a specific permission against the API.

**Parameters:**
- `userId`: User ID to validate
- `permission`: Permission string to validate

**Returns:** Promise resolving to boolean

---

### permissionsService

Core permissions logic and validation service.

#### Methods

##### `hasPermission()`
```typescript
hasPermission(userRole: string, permission: string): boolean
```

Checks if a user role has a specific permission.

**Parameters:**
- `userRole`: User role (SUPER_ADMIN, ADMIN, EMPLOYEE, CUSTOMER)
- `permission`: Permission string

**Returns:** Boolean indicating if permission is granted

**Example:**
```typescript
const canRead = permissionsService.hasPermission('ADMIN', 'users.read');
```

##### `getUserPermissions()`
```typescript
getUserPermissions(userRole: string): string[]
```

Gets all permissions for a specific user role.

**Parameters:**
- `userRole`: User role string

**Returns:** Array of permission strings

##### `canAccessScreen()`
```typescript
canAccessScreen(userRole: string, screenName: string): boolean
```

Checks if a user can access a specific screen.

**Parameters:**
- `userRole`: User role string
- `screenName`: Screen name to check

**Returns:** Boolean indicating access permission

---

### fileService

Handles file operations including upload, download, and management.

#### Methods

##### `uploadFile()`
```typescript
uploadFile(file: FileUpload, options?: UploadOptions): Promise<UploadResult>
```

Uploads a file to the server.

**Parameters:**
- `file`: File object to upload
- `options`: Optional upload configuration

**Returns:** Promise resolving to `UploadResult`

**Example:**
```typescript
const result = await fileService.uploadFile(file, {
  onProgress: (progress) => console.log(`Upload progress: ${progress}%`)
});
```

##### `downloadFile()`
```typescript
downloadFile(fileId: string, filename: string): Promise<string>
```

Downloads a file from the server.

**Parameters:**
- `fileId`: File ID to download
- `filename`: Desired filename

**Returns:** Promise resolving to local file path

##### `deleteFile()`
```typescript
deleteFile(fileId: string): Promise<void>
```

Deletes a file from the server.

**Parameters:**
- `fileId`: File ID to delete

##### `getFileInfo()`
```typescript
getFileInfo(fileId: string): Promise<FileInfo>
```

Gets file information and metadata.

**Parameters:**
- `fileId`: File ID to get info for

**Returns:** Promise resolving to `FileInfo`

##### `validateFile()`
```typescript
validateFile(file: FileUpload): ValidationResult
```

Validates a file before upload.

**Parameters:**
- `file`: File to validate

**Returns:** `ValidationResult` with validation status

---

### exportService

Manages data export functionality in various formats.

#### Methods

##### `exportToPDF()`
```typescript
exportToPDF(data: ExportData, options: ExportOptions): Promise<string>
```

Exports data to PDF format.

**Parameters:**
- `data`: Data to export
- `options`: Export configuration options

**Returns:** Promise resolving to file path

**Example:**
```typescript
const pdfPath = await exportService.exportToPDF(userData, {
  title: 'User Report',
  includeHeaders: true
});
```

##### `exportUsers()`
```typescript
exportUsers(users: User[], format: 'pdf'): Promise<string>
```

Exports user data in specified format.

**Parameters:**
- `users`: Array of user objects
- `format`: Export format (currently only 'pdf')

**Returns:** Promise resolving to file path

##### `exportOrders()`
```typescript
exportOrders(orders: Order[], format: 'pdf'): Promise<string>
```

Exports order data in specified format.

**Parameters:**
- `orders`: Array of order objects
- `format`: Export format (currently only 'pdf')

**Returns:** Promise resolving to file path

##### `exportSystemLogs()`
```typescript
exportSystemLogs(logs: SystemLog[], format: 'pdf'): Promise<string>
```

Exports system logs in specified format.

**Parameters:**
- `logs`: Array of system log objects
- `format`: Export format (currently only 'pdf')

**Returns:** Promise resolving to file path

---

### queryClient

TanStack Query client configuration for API state management.

#### Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});
```

#### Methods

##### `invalidateQueries()`
```typescript
queryClient.invalidateQueries(queryKey: string[])
```

Invalidates cached queries.

##### `setQueryData()`
```typescript
queryClient.setQueryData(queryKey: string[], data: any)
```

Sets data for a specific query.

---

## 🪝 Hooks

### usePermissions

Custom hook for permission management and checking.

#### Usage

```typescript
const permissions = usePermissions();
```

#### Returns

```typescript
interface UsePermissionsReturn {
  hasPermission: (permission: string) => boolean;
  loading: boolean;
  error: string | null;
  userRole: string | null;
  refreshPermissions: () => Promise<void>;
}
```

#### Methods

##### `hasPermission(permission: string): boolean`

Checks if current user has a specific permission.

##### `refreshPermissions(): Promise<void>`

Refreshes permissions from the API.

#### Example

```typescript
const { hasPermission, loading, userRole } = usePermissions();

if (loading) return <LoadingSpinner />;

if (hasPermission('users.create')) {
  return <CreateUserButton />;
}
```

---

### useFileUpload

Custom hook for file upload functionality with progress tracking.

#### Usage

```typescript
const fileUpload = useFileUpload();
```

#### Returns

```typescript
interface UseFileUploadReturn {
  uploadFile: (file: FileUpload) => Promise<UploadResult>;
  uploadProgress: number;
  isUploading: boolean;
  uploadError: string | null;
  clearError: () => void;
}
```

#### Methods

##### `uploadFile(file: FileUpload): Promise<UploadResult>`

Uploads a file with progress tracking.

##### `clearError(): void`

Clears any upload errors.

#### Example

```typescript
const { uploadFile, uploadProgress, isUploading, uploadError } = useFileUpload();

const handleUpload = async (file) => {
  try {
    const result = await uploadFile(file);
    console.log('Upload successful:', result);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

---

### useAuth

Custom hook for authentication management.

#### Usage

```typescript
const auth = useAuth();
```

#### Returns

```typescript
interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
```

#### Methods

##### `login(credentials: LoginCredentials): Promise<void>`

Authenticates user with credentials.

##### `logout(): Promise<void>`

Logs out the current user.

##### `refreshUser(): Promise<void>`

Refreshes user data from API.

#### Example

```typescript
const { user, loading, login, logout } = useAuth();

const handleLogin = async (email, password) => {
  try {
    await login({ email, password });
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

---

### useOrderStats

Custom hook for order statistics and analytics.

#### Usage

```typescript
const orderStats = useOrderStats();
```

#### Returns

```typescript
interface UseOrderStatsReturn {
  stats: OrderStats | null;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}
```

#### Properties

##### `stats: OrderStats | null`

Current order statistics data.

##### `loading: boolean`

Loading state indicator.

##### `error: string | null`

Error message if any.

#### Methods

##### `refreshStats(): Promise<void>`

Refreshes statistics from the API.

#### Example

```typescript
const { stats, loading, error } = useOrderStats();

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} />;

return (
  <View>
    <Text>Total Orders: {stats?.totalOrders}</Text>
    <Text>Pending Orders: {stats?.pendingOrders}</Text>
  </View>
);
```

---

### useTranslationSafe

Custom hook for safe translation with error handling.

#### Usage

```typescript
const { t, changeLanguage } = useTranslationSafe();
```

#### Returns

```typescript
interface UseTranslationSafeReturn {
  t: (key: string, options?: any) => string;
  changeLanguage: (language: string) => Promise<void>;
  currentLanguage: string;
  loading: boolean;
}
```

#### Methods

##### `t(key: string, options?: any): string`

Translates a key with safe error handling.

##### `changeLanguage(language: string): Promise<void>`

Changes the application language.

#### Example

```typescript
const { t, changeLanguage, currentLanguage } = useTranslationSafe();

return (
  <View>
    <Text>{t('welcome.title')}</Text>
    <Button onPress={() => changeLanguage('es')}>
      {t('settings.language.spanish')}
    </Button>
  </View>
);
```

---

## 🌐 HTTP Client

### httpClient

Configured HTTP client for API communication.

#### Configuration

```typescript
const httpClient = axios.create({
  baseURL: 'https://api.lumasachi.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

#### Interceptors

##### Request Interceptor
Adds authentication tokens to requests.

##### Response Interceptor
Handles common response errors and token refresh.

#### Methods

##### `get<T>(url: string, config?: AxiosRequestConfig): Promise<T>`

Makes a GET request.

##### `post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>`

Makes a POST request.

##### `put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>`

Makes a PUT request.

##### `delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>`

Makes a DELETE request.

#### Example

```typescript
import httpClient from '../utils/httpClient';

const fetchUsers = async (): Promise<User[]> => {
  const response = await httpClient.get<User[]>('/users');
  return response.data;
};
```

---

## 📝 Type Definitions

### Core Types

#### User
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER';
  phone?: string;
  company?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Order
```typescript
interface Order {
  id: string;
  customerId: string;
  title: string;
  description: string;
  status: OrderStatus;
  priority: 'low' | 'medium' | 'high';
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}
```

#### Permission
```typescript
interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}
```

#### FileUpload
```typescript
interface FileUpload {
  uri: string;
  type: string;
  name: string;
  size: number;
}
```

#### UploadResult
```typescript
interface UploadResult {
  success: boolean;
  fileId?: string;
  url?: string;
  error?: string;
}
```

### API Response Types

#### ApiResponse
```typescript
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
}
```

#### PaginatedResponse
```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

## 🔄 Error Handling

### Standard Error Format

```typescript
interface ApiError {
  message: string;
  code: string;
  details?: any;
  timestamp: string;
}
```

### Error Codes

- `AUTH_REQUIRED`: Authentication required
- `PERMISSION_DENIED`: Insufficient permissions
- `VALIDATION_ERROR`: Request validation failed
- `NOT_FOUND`: Resource not found
- `SERVER_ERROR`: Internal server error

### Usage Example

```typescript
try {
  const result = await apiService.getData();
} catch (error) {
  if (error.code === 'AUTH_REQUIRED') {
    // Handle authentication error
  } else if (error.code === 'PERMISSION_DENIED') {
    // Handle permission error
  } else {
    // Handle general error
  }
}
```

---

## 📊 Performance Considerations

### Caching Strategy

1. **Query Caching**: TanStack Query handles automatic caching
2. **Permissions Caching**: Local storage for permissions
3. **File Caching**: Temporary file storage for uploads

### Optimization Tips

1. Use `React.memo` for expensive components
2. Implement proper loading states
3. Use pagination for large datasets
4. Implement proper error boundaries
5. Use debouncing for search inputs

---

## 🧪 Testing

### Testing Utilities

Each service and hook includes comprehensive tests:

- Unit tests for individual methods
- Integration tests for API communication
- Mock implementations for development
- Error handling tests

### Example Test

```typescript
describe('usePermissions', () => {
  it('should return user permissions', async () => {
    const { result } = renderHook(() => usePermissions());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.hasPermission('users.read')).toBe(true);
  });
});
```

---

*Last updated: December 2024*
*Version: 1.0.0* 