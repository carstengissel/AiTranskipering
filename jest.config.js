module.exports = {
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  testEnvironment: 'node',
  transformIgnorePatterns: [
    'node_modules/(?!(axios)/)',
  ],
  moduleNameMapper: {
    '^axios$': require.resolve('axios'),
  },
  setupFiles: ['./src/tests/setupTests.js'],
};
