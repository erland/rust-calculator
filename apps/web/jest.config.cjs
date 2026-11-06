module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  transform: { '^.+\.tsx?$': ['ts-jest', { tsconfig: { module: 'CommonJS', target: 'ES2022' } }] },
};
