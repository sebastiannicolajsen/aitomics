export default {
  transform: {},
  moduleNameMapper: {
    '^../src/(.*)$': '<rootDir>/src/$1',
    '^yaml-schema-validator$': '<rootDir>/tests/__mocks__/yaml-schema-validator.js'
  },
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json'],
  transformIgnorePatterns: [
    '/node_modules/'
  ],
}; 