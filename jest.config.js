module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  moduleFileExtensions: ['js'],
  testMatch: ['**/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/table-renderer.test.js'],
  collectCoverageFrom: ['shared/**/*.js'],
  coverageDirectory: 'coverage',
  verbose: true
};
