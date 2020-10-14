// jest.config.js
// Copyright 2018-2020 Leo C. Singleton IV <leo@leosingleton.com>

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/'],
  testMatch: ['**/__tests__/**/*.(test|node).ts'],
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'build/',
      outputName: './results-node.xml',
    }]
  ],
  collectCoverage: true,
  coverageReporters: ['none'],
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json'
    }
  }
};
