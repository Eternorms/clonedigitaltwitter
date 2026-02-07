import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '../Modal'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, ...rest } = props
      void initial; void animate; void exit; void transition;
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

describe('Modal', () => {
  const defaultProps = {
    open: true,
    title: 'Test Modal',
    onClose: vi.fn(),
    children: <p>Modal content</p>,
  }

  it('renders when open', () => {
    render(<Modal {...defaultProps} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<Modal {...defaultProps} open={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<Modal {...defaultProps} onClose={onClose} />)

    const closeButton = screen.getByLabelText('Fechar')
    fireEvent.click(closeButton)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn()
    render(<Modal {...defaultProps} onClose={onClose} />)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose on Escape when closed', () => {
    const onClose = vi.fn()
    render(<Modal {...defaultProps} open={false} onClose={onClose} />)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<Modal {...defaultProps} onClose={onClose} />)

    // The backdrop is the first div rendered by motion.div with the bg-slate-900/40 class
    const backdrop = document.querySelector('.bg-slate-900\\/40')
    expect(backdrop).toBeTruthy()
    fireEvent.click(backdrop!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when clicking inside the dialog', () => {
    const onClose = vi.fn()
    render(<Modal {...defaultProps} onClose={onClose} />)

    fireEvent.click(screen.getByText('Modal content'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('has aria-modal attribute', () => {
    render(<Modal {...defaultProps} />)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('has accessible title', () => {
    render(<Modal {...defaultProps} />)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'modal-title')
    expect(screen.getByText('Test Modal')).toHaveAttribute('id', 'modal-title')
  })
})
