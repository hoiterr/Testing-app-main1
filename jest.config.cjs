module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'],
  moduleNameMapper: {
    '^@/(.*)$": './src/$1',
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};
