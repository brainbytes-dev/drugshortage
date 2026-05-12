import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup-env.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // 33 test files import from `vitest`; map to a Jest-globals shim so
    // they run under the existing Jest setup without touching test sources.
    '^vitest$': '<rootDir>/tests/__shims__/vitest.ts',
  },
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx'],
  transformIgnorePatterns: [
    'node_modules/.pnpm/(?!(jose@|next-intl@|use-intl@))',
  ],
}

export default config
