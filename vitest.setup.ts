import '@testing-library/jest-dom'
import { server } from './tests/mocks/server'
import { beforeAll, afterEach, afterAll } from 'vitest'

// Headless UI v2 uses ResizeObserver, which jsdom does not implement.
// A no-op stub is sufficient since tests don't need real resize measurements.
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
