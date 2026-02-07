import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GenerateAIModal } from '../GenerateAIModal'
import { resetMockReturnValue } from '@/test/mocks/supabase'
import { generateWithAI, fetchTweets } from '@/lib/supabase/mutations'

// Mock contexts
const mockAddToast = vi.fn()

vi.mock('@/lib/contexts/ToastContext', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}))

const mockPersonas = [
  { id: 'p1', name: 'Tech Bot', handle: '@techbot', emoji: '🤖', twitter_user_id: 'tw-123' },
  { id: 'p2', name: 'News Bot', handle: '@newsbot', emoji: '📰', twitter_user_id: null },
]

vi.mock('@/lib/contexts/PersonaContext', () => ({
  usePersona: () => ({
    personas: mockPersonas,
    activePersona: mockPersonas[0],
    setActivePersona: vi.fn(),
    addPersona: vi.fn(),
    removePersona: vi.fn(),
  }),
}))

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial: _i, animate: _a, exit: _e, transition: _t, ...rest } = props
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// Mock mutations
vi.mock('@/lib/supabase/mutations', () => ({
  generateWithAI: vi.fn().mockResolvedValue({ success: true }),
  fetchTweets: vi.fn().mockResolvedValue({ count: 5, total: 20 }),
}))

// Mock the supabase client import used directly in GenerateAIModal (line 10, 86, 116)
const mockChainableQuery = () => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    then: (resolve: (v: unknown) => void) => resolve({ data: [], error: null, count: 0 }),
  }
  return chain
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => mockChainableQuery()),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    },
  }),
}))

// Mock fetch for Google Trends
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: false,
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

const mockGenerateWithAI = vi.mocked(generateWithAI)
const mockFetchTweets = vi.mocked(fetchTweets)

describe('GenerateAIModal', () => {
  const mockOnClose = vi.fn()
  const mockOnGenerated = vi.fn()

  beforeEach(() => {
    resetMockReturnValue()
    vi.clearAllMocks()
    localStorageMock.clear()
    // Reset getItem to use store (vi.clearAllMocks removes mockImplementation)
    localStorageMock.getItem.mockImplementation((key: string) => {
      return null
    })
    mockGenerateWithAI.mockResolvedValue({ success: true })
    mockFetchTweets.mockResolvedValue({ count: 5, total: 20 })
  })

  function renderModal(open = true) {
    return render(
      <GenerateAIModal open={open} onClose={mockOnClose} onGenerated={mockOnGenerated} />
    )
  }

  it('renders modal with title when open', () => {
    renderModal()
    expect(screen.getByText('Gerar com IA')).toBeInTheDocument()
  })

  it('does not render modal content when closed', () => {
    renderModal(false)
    expect(screen.queryByText('Gerar com IA')).not.toBeInTheDocument()
  })

  it('renders persona selector with options', () => {
    renderModal()
    expect(screen.getByText('Selecione uma persona')).toBeInTheDocument()
    expect(screen.getByText(/Tech Bot/)).toBeInTheDocument()
    expect(screen.getByText(/News Bot/)).toBeInTheDocument()
  })

  it('renders tweet style toggle section when persona is selected', () => {
    renderModal()
    expect(screen.getByText('Basear no meu estilo de tweets')).toBeInTheDocument()
  })

  it('renders the switch with role="switch"', () => {
    renderModal()
    const toggle = screen.getByRole('switch')
    expect(toggle).toBeInTheDocument()
    expect(toggle.getAttribute('aria-checked')).toBe('false')
  })

  it('toggles tweet style on click for persona with Twitter connected', () => {
    renderModal()
    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-checked')).toBe('true')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('tweet_style_p1', 'true')
  })

  it('disables toggle for persona without Twitter connected', () => {
    renderModal()
    // Select persona without twitter_user_id (p2)
    const select = screen.getAllByRole('combobox')[0]
    fireEvent.change(select, { target: { value: 'p2' } })

    const toggle = screen.getByRole('switch')
    expect(toggle).toBeDisabled()
  })

  it('shows connect Twitter message for persona without Twitter', () => {
    renderModal()
    const select = screen.getAllByRole('combobox')[0]
    fireEvent.change(select, { target: { value: 'p2' } })

    expect(screen.getByText('Conecte o Twitter primeiro para usar esta funcao.')).toBeInTheDocument()
  })

  it('shows tweet count for persona with Twitter connected', async () => {
    renderModal()
    await waitFor(() => {
      const text = screen.getByText(/tweets cacheados|Nenhum tweet/)
      expect(text).toBeInTheDocument()
    })
  })

  it('shows refresh button "Atualizar" for persona with Twitter', () => {
    renderModal()
    expect(screen.getByText('Atualizar')).toBeInTheDocument()
  })

  it('calls fetchTweets when refresh button is clicked', async () => {
    renderModal()

    const refreshBtn = screen.getByText('Atualizar')
    fireEvent.click(refreshBtn)

    await waitFor(() => {
      expect(mockFetchTweets).toHaveBeenCalledWith('p1')
    })
  })

  it('shows success toast after refreshing tweets', async () => {
    mockFetchTweets.mockResolvedValueOnce({ count: 5, total: 20 })
    renderModal()

    const refreshBtn = screen.getByText('Atualizar')
    fireEvent.click(refreshBtn)

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith('5 novos tweets carregados!', 'success')
    })
  })

  it('shows error toast when fetchTweets fails', async () => {
    mockFetchTweets.mockRejectedValueOnce(new Error('API error'))
    renderModal()

    const refreshBtn = screen.getByText('Atualizar')
    fireEvent.click(refreshBtn)

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        'Erro ao buscar tweets. Verifique a conexao Twitter.',
        'error'
      )
    })
  })

  it('calls generateWithAI with useTweetStyle=true when toggled', async () => {
    renderModal()

    // Toggle tweet style ON
    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)

    // Click generate
    const generateBtn = screen.getByText('Gerar Posts')
    fireEvent.click(generateBtn)

    await waitFor(() => {
      expect(mockGenerateWithAI).toHaveBeenCalledWith(
        'p1', undefined, 3, undefined, true
      )
    })
  })

  it('calls generateWithAI with useTweetStyle=false by default', async () => {
    renderModal()

    const generateBtn = screen.getByText('Gerar Posts')
    fireEvent.click(generateBtn)

    await waitFor(() => {
      expect(mockGenerateWithAI).toHaveBeenCalledWith(
        'p1', undefined, 3, undefined, false
      )
    })
  })

  it('calls onGenerated and onClose after successful generation', async () => {
    renderModal()

    const generateBtn = screen.getByText('Gerar Posts')
    fireEvent.click(generateBtn)

    await waitFor(() => {
      expect(mockOnGenerated).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('shows error toast on generation failure', async () => {
    mockGenerateWithAI.mockRejectedValueOnce(new Error('Generation failed'))
    renderModal()

    const generateBtn = screen.getByText('Gerar Posts')
    fireEvent.click(generateBtn)

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        'Erro ao gerar posts com IA. Verifique a configuração.',
        'error'
      )
    })
  })

  it('shows error toast when no persona is selected', () => {
    renderModal()

    // Deselect persona
    const select = screen.getAllByRole('combobox')[0]
    fireEvent.change(select, { target: { value: '' } })

    const generateBtn = screen.getByText('Gerar Posts')
    fireEvent.click(generateBtn)

    expect(mockAddToast).toHaveBeenCalledWith('Selecione uma persona.', 'error')
  })

  it('persists tweet style preference to localStorage', () => {
    renderModal()

    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)

    expect(localStorageMock.setItem).toHaveBeenCalledWith('tweet_style_p1', 'true')

    fireEvent.click(toggle)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('tweet_style_p1', 'false')
  })

  it('loads tweet style preference from localStorage on persona change', () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'tweet_style_p1') return 'true'
      return null
    })

    renderModal()

    const toggle = screen.getByRole('switch')
    expect(toggle.getAttribute('aria-checked')).toBe('true')
  })

  it('allows changing post count', () => {
    renderModal()
    const countSelect = screen.getByDisplayValue('3 posts')
    fireEvent.change(countSelect, { target: { value: '5' } })
    expect(countSelect).toHaveValue('5')
  })

  it('allows entering a custom topic', () => {
    renderModal()
    const topicInput = screen.getByPlaceholderText(/inteligência artificial/)
    fireEvent.change(topicInput, { target: { value: 'blockchain' } })
    expect(topicInput).toHaveValue('blockchain')
  })

  it('passes topic to generateWithAI when provided', async () => {
    renderModal()

    // Wait for initial effects to settle
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/inteligência artificial/)).toBeInTheDocument()
    })

    const topicInput = screen.getByPlaceholderText(/inteligência artificial/)
    fireEvent.change(topicInput, { target: { value: 'blockchain' } })
    expect(topicInput).toHaveValue('blockchain')

    const generateBtn = screen.getByText('Gerar Posts')
    fireEvent.click(generateBtn)

    await waitFor(() => {
      expect(mockGenerateWithAI).toHaveBeenCalled()
    })

    const lastCall = mockGenerateWithAI.mock.calls[0]
    expect(lastCall[0]).toBe('p1')
    expect(lastCall[1]).toBe('blockchain')
    expect(lastCall[2]).toBe(3)
  })

  it('hides tweet style section when no persona selected', () => {
    renderModal()
    const select = screen.getAllByRole('combobox')[0]
    fireEvent.change(select, { target: { value: '' } })

    expect(screen.queryByText('Basear no meu estilo de tweets')).not.toBeInTheDocument()
  })
})
