import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PostCard } from '../PostCard'
import type { Post } from '@/types'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, ...rest } = props
      void initial; void animate; void exit; void transition
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// Mock ToastContext
const mockAddToast = vi.fn()
vi.mock('@/lib/contexts/ToastContext', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}))

// Mock mutations
const mockApprovePost = vi.fn().mockResolvedValue({ error: null })
const mockRejectPost = vi.fn().mockResolvedValue({ error: null })
const mockPublishToTwitter = vi.fn().mockResolvedValue({ success: true })
vi.mock('@/lib/supabase/mutations', () => ({
  approvePost: (...args: unknown[]) => mockApprovePost(...args),
  rejectPost: (...args: unknown[]) => mockRejectPost(...args),
  publishToTwitter: (...args: unknown[]) => mockPublishToTwitter(...args),
  updatePostContent: vi.fn().mockResolvedValue({ error: null }),
}))

// Mock EditPostModal to simplify PostCard tests
vi.mock('@/components/queue/EditPostModal', () => ({
  EditPostModal: () => null,
}))

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 'post-1',
    persona_id: 'persona-1',
    content: 'Hello world! #test',
    status: 'pending',
    source: 'claude_ai',
    source_name: 'Claude AI',
    author: {
      name: 'Tech Bot',
      handle: '@techbot',
      avatarEmoji: '🤖',
    },
    created_at: new Date().toISOString(),
    scheduled_at: null,
    published_at: null,
    image_url: null,
    hashtags: ['#test'],
    impressions: 0,
    engagements: 0,
    likes: 0,
    retweets: 0,
    ...overrides,
  }
}

describe('PostCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('pending state', () => {
    it('shows "Aprovacao Necessaria" badge', () => {
      render(<PostCard post={makePost()} />)
      expect(screen.getByText('Aprovação Necessária')).toBeInTheDocument()
    })

    it('shows approve button', () => {
      render(<PostCard post={makePost()} />)
      expect(screen.getByText('Aprovar Post')).toBeInTheDocument()
    })

    it('shows edit button', () => {
      render(<PostCard post={makePost()} />)
      expect(screen.getByText('Editar Texto')).toBeInTheDocument()
    })

    it('shows discard button', () => {
      render(<PostCard post={makePost()} />)
      expect(screen.getByText('Descartar')).toBeInTheDocument()
    })

    it('shows post content with hashtag highlighting', () => {
      render(<PostCard post={makePost()} />)
      expect(screen.getByText('#test')).toBeInTheDocument()
      expect(screen.getByText('#test').className).toContain('text-sky-500')
    })

    it('shows author info', () => {
      render(<PostCard post={makePost()} />)
      expect(screen.getByText('Tech Bot')).toBeInTheDocument()
      expect(screen.getByText('@techbot')).toBeInTheDocument()
    })

    it('shows source name', () => {
      render(<PostCard post={makePost()} />)
      expect(screen.getByText('Claude AI')).toBeInTheDocument()
    })

    it('calls approvePost and onStatusChange when approve is clicked', async () => {
      const user = userEvent.setup()
      const onStatusChange = vi.fn()
      render(<PostCard post={makePost()} onStatusChange={onStatusChange} />)

      await user.click(screen.getByText('Aprovar Post'))
      expect(mockApprovePost).toHaveBeenCalledWith('post-1')
      expect(onStatusChange).toHaveBeenCalledWith('post-1', 'approved')
    })

    it('shows confirm dialog when discard is clicked', async () => {
      const user = userEvent.setup()
      render(<PostCard post={makePost()} />)

      await user.click(screen.getByText('Descartar'))
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      expect(screen.getByText('Descartar Post')).toBeInTheDocument()
    })

    it('shows image preview placeholder when image_url is set', () => {
      render(<PostCard post={makePost({ image_url: 'https://example.com/img.jpg' })} />)
      expect(screen.getByText('Preview da Imagem')).toBeInTheDocument()
    })
  })

  describe('approved state', () => {
    it('shows "Aprovado" badge', () => {
      render(<PostCard post={makePost({ status: 'approved' })} />)
      expect(screen.getByText('Aprovado')).toBeInTheDocument()
    })

    it('shows publish button', () => {
      render(<PostCard post={makePost({ status: 'approved' })} />)
      expect(screen.getByText('Publicar no Twitter')).toBeInTheDocument()
    })

    it('shows edit button', () => {
      render(<PostCard post={makePost({ status: 'approved' })} />)
      expect(screen.getByText('Editar Texto')).toBeInTheDocument()
    })

    it('does not show approve or discard buttons', () => {
      render(<PostCard post={makePost({ status: 'approved' })} />)
      expect(screen.queryByText('Aprovar Post')).not.toBeInTheDocument()
      expect(screen.queryByText('Descartar')).not.toBeInTheDocument()
    })

    it('shows confirm dialog when publish is clicked', async () => {
      const user = userEvent.setup()
      render(<PostCard post={makePost({ status: 'approved' })} />)

      await user.click(screen.getByText('Publicar no Twitter'))
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      expect(screen.getByText('Publicar no Twitter', { selector: 'h3' })).toBeInTheDocument()
    })

    it('shows scheduled time when scheduled_at is set', () => {
      render(<PostCard post={makePost({ status: 'scheduled', scheduled_at: '2026-01-20T14:30:00Z' })} />)
      // The scheduled time badge should be visible
      const timeBadge = document.querySelector('.bg-emerald-100')
      expect(timeBadge).toBeInTheDocument()
    })
  })

  describe('published state', () => {
    it('shows "Publicado" text', () => {
      render(<PostCard post={makePost({ status: 'published', published_at: '2026-01-15T12:00:00Z' })} />)
      expect(screen.getByText('Publicado')).toBeInTheDocument()
    })

    it('does not show action buttons', () => {
      render(<PostCard post={makePost({ status: 'published', published_at: '2026-01-15T12:00:00Z' })} />)
      expect(screen.queryByText('Aprovar Post')).not.toBeInTheDocument()
      expect(screen.queryByText('Publicar no Twitter')).not.toBeInTheDocument()
      expect(screen.queryByText('Descartar')).not.toBeInTheDocument()
    })

    it('shows post content', () => {
      render(<PostCard post={makePost({ status: 'published', published_at: '2026-01-15T12:00:00Z' })} />)
      expect(screen.getByText(/Hello world!/)).toBeInTheDocument()
    })

    it('has reduced opacity styling', () => {
      const { container } = render(
        <PostCard post={makePost({ status: 'published', published_at: '2026-01-15T12:00:00Z' })} />
      )
      const card = container.firstElementChild as HTMLElement
      expect(card.className).toContain('opacity-80')
    })
  })

  describe('error handling', () => {
    it('shows error toast when approve fails', async () => {
      const user = userEvent.setup()
      mockApprovePost.mockResolvedValueOnce({ error: new Error('fail') })
      render(<PostCard post={makePost()} />)

      await user.click(screen.getByText('Aprovar Post'))
      expect(mockAddToast).toHaveBeenCalledWith('Erro ao aprovar o post. Tente novamente.', 'error')
    })
  })
})
