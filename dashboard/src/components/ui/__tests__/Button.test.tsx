import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('defaults to type="button"', () => {
    render(<Button>Test</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  describe('variants', () => {
    it('renders primary variant', () => {
      render(<Button variant="primary">Primary</Button>)
      const btn = screen.getByRole('button')
      expect(btn.className).toContain('bg-slate-900')
    })

    it('renders secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const btn = screen.getByRole('button')
      expect(btn.className).toContain('bg-white')
    })

    it('renders destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>)
      const btn = screen.getByRole('button')
      expect(btn.className).toContain('text-red-500')
    })

    it('renders ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const btn = screen.getByRole('button')
      expect(btn.className).toContain('text-slate-500')
    })
  })

  describe('loading state', () => {
    it('shows spinner when loading', () => {
      render(<Button loading>Save</Button>)
      const btn = screen.getByRole('button')
      expect(btn.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('is disabled when loading', () => {
      render(<Button loading>Save</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  describe('disabled state', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('applies disabled styling', () => {
      render(<Button disabled>Disabled</Button>)
      expect(screen.getByRole('button').className).toContain('opacity-50')
    })
  })

  describe('click handler', () => {
    it('calls onClick when clicked', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click</Button>)

      await user.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      render(<Button onClick={handleClick} disabled>Click</Button>)

      await user.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('does not call onClick when loading', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      render(<Button onClick={handleClick} loading>Click</Button>)

      await user.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('icon', () => {
    it('renders icon element', () => {
      const icon = <span data-testid="icon">*</span>
      render(<Button icon={icon}>With Icon</Button>)
      expect(screen.getByTestId('icon')).toBeInTheDocument()
    })

    it('replaces icon with spinner when loading', () => {
      const icon = <span data-testid="icon">*</span>
      render(<Button icon={icon} loading>Loading</Button>)
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument()
    })
  })

  describe('sizes', () => {
    it('renders small size', () => {
      render(<Button size="sm">Small</Button>)
      const btn = screen.getByRole('button')
      expect(btn.className).toContain('text-xs')
    })

    it('renders large size', () => {
      render(<Button size="lg">Large</Button>)
      const btn = screen.getByRole('button')
      expect(btn.className).toContain('px-6')
    })
  })
})
