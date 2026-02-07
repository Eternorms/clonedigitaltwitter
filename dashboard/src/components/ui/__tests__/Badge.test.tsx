import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '../Badge'

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Pending</Badge>)
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  describe('variants', () => {
    it('renders default variant', () => {
      render(<Badge>Default</Badge>)
      const badge = screen.getByText('Default').closest('span')
      expect(badge?.className).toContain('bg-slate-100')
    })

    it('renders pending variant', () => {
      render(<Badge variant="pending">Pending</Badge>)
      const badge = screen.getByText('Pending').closest('span')
      expect(badge?.className).toContain('bg-amber-100')
      expect(badge?.className).toContain('text-amber-700')
    })

    it('renders scheduled variant', () => {
      render(<Badge variant="scheduled">Scheduled</Badge>)
      const badge = screen.getByText('Scheduled').closest('span')
      expect(badge?.className).toContain('bg-emerald-100')
    })

    it('renders published variant', () => {
      render(<Badge variant="published">Published</Badge>)
      const badge = screen.getByText('Published').closest('span')
      expect(badge?.className).toContain('bg-sky-100')
    })

    it('renders rejected variant', () => {
      render(<Badge variant="rejected">Rejected</Badge>)
      const badge = screen.getByText('Rejected').closest('span')
      expect(badge?.className).toContain('bg-red-100')
    })
  })

  describe('pulse animation', () => {
    it('shows pulse dot when pulse is true', () => {
      render(<Badge pulse>Active</Badge>)
      const badge = screen.getByText('Active').closest('span')
      const pulseDot = badge?.querySelector('.animate-pulse')
      expect(pulseDot).toBeInTheDocument()
    })

    it('does not show pulse dot by default', () => {
      render(<Badge>Inactive</Badge>)
      const badge = screen.getByText('Inactive').closest('span')
      const pulseDot = badge?.querySelector('.animate-pulse')
      expect(pulseDot).not.toBeInTheDocument()
    })
  })

  it('accepts additional className', () => {
    render(<Badge className="custom-class">Custom</Badge>)
    const badge = screen.getByText('Custom').closest('span')
    expect(badge?.className).toContain('custom-class')
  })
})
