module.exports = {
  rootDir: '.',
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  modulePathIgnorePatterns: ['<rootDir>/dist'],
  errorOnDeprecated: true,
  // setupFilesAfterEnv: ['jest-extended/all'],
};
