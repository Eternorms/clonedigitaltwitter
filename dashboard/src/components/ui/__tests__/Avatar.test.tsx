import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Avatar } from '../Avatar'

describe('Avatar', () => {
  describe('with image src', () => {
    it('renders an img element', () => {
      render(<Avatar src="https://example.com/photo.jpg" alt="User photo" />)
      const img = screen.getByRole('img')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
      expect(img).toHaveAttribute('alt', 'User photo')
    })

    it('applies size styles to img', () => {
      render(<Avatar src="https://example.com/photo.jpg" alt="User" size="lg" />)
      const img = screen.getByRole('img')
      expect(img.className).toContain('w-14')
    })

    it('uses empty alt by default', () => {
      const { container } = render(<Avatar src="https://example.com/photo.jpg" />)
      const img = container.querySelector('img')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('alt', '')
    })
  })

  describe('with emoji', () => {
    it('renders emoji in a div', () => {
      render(<Avatar emoji="🤖" />)
      expect(screen.getByText('🤖')).toBeInTheDocument()
    })

    it('applies dark background for emoji', () => {
      render(<Avatar emoji="🤖" />)
      const container = screen.getByText('🤖')
      expect(container.className).toContain('bg-slate-900')
    })

    it('prefers emoji over initials', () => {
      render(<Avatar emoji="🤖" initials="AB" />)
      expect(screen.getByText('🤖')).toBeInTheDocument()
      expect(screen.queryByText('AB')).not.toBeInTheDocument()
    })
  })

  describe('with initials', () => {
    it('renders initials text', () => {
      render(<Avatar initials="JD" />)
      expect(screen.getByText('JD')).toBeInTheDocument()
    })

    it('applies light background for initials', () => {
      render(<Avatar initials="JD" />)
      const container = screen.getByText('JD')
      expect(container.className).toContain('bg-slate-200')
    })
  })

  describe('sizes', () => {
    it('renders small size', () => {
      render(<Avatar initials="SM" size="sm" />)
      const el = screen.getByText('SM')
      expect(el.className).toContain('w-10')
    })

    it('renders medium size by default', () => {
      render(<Avatar initials="MD" />)
      const el = screen.getByText('MD')
      expect(el.className).toContain('w-12')
    })

    it('renders large size', () => {
      render(<Avatar initials="LG" size="lg" />)
      const el = screen.getByText('LG')
      expect(el.className).toContain('w-14')
    })
  })

  it('accepts additional className', () => {
    render(<Avatar initials="CC" className="custom-class" />)
    const el = screen.getByText('CC')
    expect(el.className).toContain('custom-class')
  })

  describe('priority: src > emoji > initials', () => {
    it('prefers src over emoji and initials', () => {
      const { container } = render(<Avatar src="https://example.com/photo.jpg" emoji="🤖" initials="AB" />)
      expect(container.querySelector('img')).toBeInTheDocument()
      expect(screen.queryByText('🤖')).not.toBeInTheDocument()
      expect(screen.queryByText('AB')).not.toBeInTheDocument()
    })
  })
})
