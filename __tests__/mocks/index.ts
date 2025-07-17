// Mock Auth Service
export const mockAuthService = {
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  refreshToken: jest.fn(),
  updateProfile: jest.fn(),
  changePassword: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
};

// Mock Order Service
export const mockOrderService = {
  getOrders: jest.fn(),
  getOrderById: jest.fn(),
  createOrder: jest.fn(),
  updateOrder: jest.fn(),
  deleteOrder: jest.fn(),
  getOrderStats: jest.fn(),
  exportOrders: jest.fn(),
};

// Mock User Service
export const mockUserService = {
  getUsers: jest.fn(),
  getUserById: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  getUserStats: jest.fn(),
  exportUsers: jest.fn(),
};

// Mock File Service
export const mockFileService = {
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  getFileUrl: jest.fn(),
  downloadFile: jest.fn(),
};

// Reset all mocks
export const resetAllMocks = () => {
  Object.values(mockAuthService).forEach(mock => mock.mockReset());
  Object.values(mockOrderService).forEach(mock => mock.mockReset());
  Object.values(mockUserService).forEach(mock => mock.mockReset());
  Object.values(mockFileService).forEach(mock => mock.mockReset());
};
