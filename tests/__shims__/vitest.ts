// Shim: 33 test files import from `vitest` even though the project runs
// Jest. The vitest and Jest APIs are largely compatible — describe / it /
// expect / hooks are interchangeable, and `vi` mirrors the `jest` global
// (fn, mock, spyOn, clear/reset/restoreAllMocks, useFakeTimers, mocked).
//
// jest.config.ts maps `^vitest$` to this file, so `import { vi } from 'vitest'`
// resolves here without touching the test sources.

import { jest } from '@jest/globals'

// `vi` is the vitest equivalent of Jest's `jest` global. The test surface
// (vi.fn, vi.mock, vi.spyOn, vi.clearAllMocks, vi.resetAllMocks,
// vi.restoreAllMocks, vi.mocked, vi.useFakeTimers, vi.useRealTimers,
// vi.advanceTimersByTime) maps 1:1 onto Jest's API.
export const vi = jest

export {
  describe,
  it,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from '@jest/globals'
