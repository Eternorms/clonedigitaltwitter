import { vi } from 'vitest'

type MockReturnData = { data: unknown; error: unknown; count?: number | null }

let mockReturnValue: MockReturnData = { data: null, error: null }

function createChainableMock(): Record<string, unknown> {
  const chain: Record<string, unknown> = {}

  const self = new Proxy(chain, {
    get(_target, prop) {
      if (prop === 'then') return undefined
      // Terminal methods return the mock data
      if (prop === 'single') return () => Promise.resolve(mockReturnValue)
      if (prop === 'maybeSingle') return () => Promise.resolve(mockReturnValue)
      // Default: return a function that continues the chain
      return (..._args: unknown[]) => {
        // When the chain resolves as a promise (e.g., await supabase.from(...).select(...))
        // The Proxy itself becomes thenable through the .then check above being undefined,
        // so Promises treat it as a regular value. We need the chain to resolve.
        const result = new Proxy({}, {
          get(_, p) {
            if (p === 'then') {
              return (resolve: (v: unknown) => void) => resolve(mockReturnValue)
            }
            if (p === 'single') return () => Promise.resolve(mockReturnValue)
            if (p === 'maybeSingle') return () => Promise.resolve(mockReturnValue)
            return (..._a: unknown[]) => result
          }
        })
        return result
      }
    },
  })

  return self
}

const mockAuth = {
  getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@test.com' } }, error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
}

const mockFunctions = {
  invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
}

const mockSupabaseClient = {
  from: vi.fn(() => createChainableMock()),
  auth: mockAuth,
  functions: mockFunctions,
}

export function setMockReturnValue(value: MockReturnData) {
  mockReturnValue = value
}

export function resetMockReturnValue() {
  mockReturnValue = { data: null, error: null }
}

export function getMockSupabaseClient() {
  return mockSupabaseClient
}

export function getMockAuth() {
  return mockAuth
}

export function getMockFunctions() {
  return mockFunctions
}

// Mock both client and server createClient
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabaseClient,
}))
