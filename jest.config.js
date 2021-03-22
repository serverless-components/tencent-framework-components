const { join } = require('path');
require('dotenv').config({ path: join(__dirname, '.env.test') });

const config = {
  verbose: true,
  silent: false,
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testTimeout: 600000,
  testEnvironment: 'node',
  testRegex: '/__tests__/.*\\.(test|spec)\\.(js|ts)$',
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/lib/', '/examples/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

module.exports = config;
