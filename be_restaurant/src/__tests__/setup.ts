// Setup file for Jest tests
// Mock environment variables
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_secret_key_for_jwt";
process.env.JWT_EXPIRES_IN = "1h";

// Suppress console logs during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
