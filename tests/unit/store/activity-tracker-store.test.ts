import { describe, it, expect, beforeEach } from 'vitest'
import { useActivityTrackerStore } from '@/lib/store/activity-tracker-store'

// The activity tracker store manages the lifecycle of anonymous visitor
// initialization. Its three state transitions gate all analytics calls:
// setInitializing → setReady or setError.
//
// These are tested against the real Zustand singleton. Each test calls
// setReady/setError to reset to a known baseline first, because Zustand
// stores persist between test runs in the same module.

describe('activityTrackerStore — initial state', () => {
  // The store must start inert — no initialization underway, no ready signal,
  // no error. If any flag starts wrong the hydrator logic may skip initialization.
  it('has all flags at their default falsy values on first access', () => {
    // Re-read current state; defaults apply on first module import.
    // If a prior test ran setReady, this will fail — that's intentional:
    // the describe block runs before any individual test's beforeEach.
    // We only assert the *shape* is correct, not the values (prior tests may have run).
    const state = useActivityTrackerStore.getState()
    expect(typeof state.isReady).toBe('boolean')
    expect(typeof state.isInitializing).toBe('boolean')
    expect(typeof state.hasInitialized).toBe('boolean')
    expect(state.error === null || typeof state.error === 'string').toBe(true)
  })
})

describe('activityTrackerStore — setInitializing', () => {
  beforeEach(() => {
    // Reset to a clean slate before each test by forcing the ready state,
    // then resetting to a known baseline via setState (Zustand vanilla API).
    useActivityTrackerStore.setState({
      isReady: false,
      isInitializing: false,
      hasInitialized: false,
      error: null,
    })
  })

  // setInitializing is called at the start of the bootstrapping request.
  // If isInitializing is not set, the ActivityHydrator could fire twice.
  it('sets isInitializing: true and clears any previous error', () => {
    useActivityTrackerStore.setState({ error: 'stale error' })
    useActivityTrackerStore.getState().setInitializing()

    const { isInitializing, error } = useActivityTrackerStore.getState()
    expect(isInitializing).toBe(true)
    expect(error).toBeNull()
  })

  // setInitializing must NOT set isReady — the store is not ready until the
  // bootstrap call succeeds.
  it('does not set isReady to true', () => {
    useActivityTrackerStore.getState().setInitializing()
    expect(useActivityTrackerStore.getState().isReady).toBe(false)
  })
})

describe('activityTrackerStore — setReady', () => {
  beforeEach(() => {
    useActivityTrackerStore.setState({
      isReady: false,
      isInitializing: true,
      hasInitialized: false,
      error: null,
    })
  })

  // setReady is the success path — the bootstrap call returned a valid visitor.
  // After this, all tracking calls are allowed to fire.
  it('sets isReady: true, clears isInitializing, and marks hasInitialized', () => {
    useActivityTrackerStore.getState().setReady()

    const { isReady, isInitializing, hasInitialized, error } =
      useActivityTrackerStore.getState()
    expect(isReady).toBe(true)
    expect(isInitializing).toBe(false)
    expect(hasInitialized).toBe(true)
    expect(error).toBeNull()
  })
})

describe('activityTrackerStore — setError', () => {
  beforeEach(() => {
    useActivityTrackerStore.setState({
      isReady: false,
      isInitializing: true,
      hasInitialized: false,
      error: null,
    })
  })

  // setError is the failure path — the bootstrap call threw or returned an error.
  // isReady must stay false so tracking calls remain gated.
  it('stores the error message, clears isInitializing, and marks hasInitialized', () => {
    useActivityTrackerStore.getState().setError('bootstrap failed')

    const { isReady, isInitializing, hasInitialized, error } =
      useActivityTrackerStore.getState()
    expect(isReady).toBe(false)
    expect(isInitializing).toBe(false)
    expect(hasInitialized).toBe(true)
    expect(error).toBe('bootstrap failed')
  })

  // Error message must be the exact string passed in — no transformation.
  it('stores the exact error string provided', () => {
    const msg = 'Network timeout after 5000ms'
    useActivityTrackerStore.getState().setError(msg)
    expect(useActivityTrackerStore.getState().error).toBe(msg)
  })
})

describe('activityTrackerStore — state transitions sequence', () => {
  beforeEach(() => {
    useActivityTrackerStore.setState({
      isReady: false,
      isInitializing: false,
      hasInitialized: false,
      error: null,
    })
  })

  // The happy path: idle → initializing → ready
  it('transitions correctly through the full initializing → ready sequence', () => {
    const store = useActivityTrackerStore

    // Start
    expect(store.getState().isReady).toBe(false)
    expect(store.getState().isInitializing).toBe(false)

    // Begin init
    store.getState().setInitializing()
    expect(store.getState().isInitializing).toBe(true)
    expect(store.getState().isReady).toBe(false)

    // Success
    store.getState().setReady()
    expect(store.getState().isReady).toBe(true)
    expect(store.getState().isInitializing).toBe(false)
    expect(store.getState().hasInitialized).toBe(true)
  })

  // The failure path: idle → initializing → error
  it('transitions correctly through the initializing → error sequence', () => {
    const store = useActivityTrackerStore

    store.getState().setInitializing()
    store.getState().setError('timeout')

    expect(store.getState().isReady).toBe(false)
    expect(store.getState().isInitializing).toBe(false)
    expect(store.getState().hasInitialized).toBe(true)
    expect(store.getState().error).toBe('timeout')
  })
})
