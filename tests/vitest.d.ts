/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

// Rozšírenie Vitest expect matcherov o jest-dom matchery
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

declare module 'vitest' {
  interface Assertion<T = unknown> extends TestingLibraryMatchers<T, void> {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<unknown, void> {}
}
