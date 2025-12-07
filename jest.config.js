module.exports = {
  testEnvironment: 'node',
  testTimeout: 10000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  forceExit: true,
  maxWorkers: 1,
  detectOpenHandles: true,
  // Show test results in a clear format
  verbose: true,
  // Don't run tests in parallel (they might interfere with each other)
  runInBand: true
};