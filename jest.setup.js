// Global test setup
import '@testing-library/jest-dom';

// Mock any global objects or functions needed for tests
global.console = {
  ...console,
  // Override console methods here if needed
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};

// Add any global test setup here
