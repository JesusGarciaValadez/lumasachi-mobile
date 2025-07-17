import React from 'react';
import { render } from '@testing-library/react-native';

// Simplified custom render function without providers that are already mocked
export const customRender = (ui: React.ReactElement, options?: any) => {
  // Since all providers are mocked to just render children,
  // we don't need to wrap the component in tests
  return render(ui, options);
};

// Re-export everything from testing library
export * from '@testing-library/react-native';
export { customRender as render };
