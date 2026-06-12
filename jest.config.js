module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  moduleFileExtensions: ['js'],
  testMatch: ['**/tests/**/*.test.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/table-renderer.test.js',
    '/tests/ui-state.test.js',
    '/tests/spreadsheet-ui.test.js',
    '/tests/clipboard-utils.test.js',
    '/tests/clipboard-shortcuts.test.js',
    '/tests/font-scale.test.js',
    '/tests/cell-clear.test.js'
  ],
  collectCoverageFrom: ['shared/**/*.js'],
  coverageDirectory: 'coverage',
  verbose: true
};
