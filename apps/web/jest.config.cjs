module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: { '^.+\.tsx?$': ['ts-jest', { tsconfig: { module: 'CommonJS', target: 'ES2022' } }] },
};
