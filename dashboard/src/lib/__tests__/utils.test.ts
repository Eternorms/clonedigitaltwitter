import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cn, formatRelativeTime, formatScheduledTime, getSourceLabel } from '../utils'

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('filters falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b')
  })

  it('returns empty string when no truthy values', () => {
    expect(cn(false, null, undefined)).toBe('')
  })
})

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "agora" for less than a minute ago', () => {
    const tenSecondsAgo = new Date('2026-01-15T11:59:50Z').toISOString()
    expect(formatRelativeTime(tenSecondsAgo)).toBe('agora')
  })

  it('returns minutes ago', () => {
    const fiveMinAgo = new Date('2026-01-15T11:55:00Z').toISOString()
    expect(formatRelativeTime(fiveMinAgo)).toBe('5 min atrás')
  })

  it('returns hours ago', () => {
    const threeHoursAgo = new Date('2026-01-15T09:00:00Z').toISOString()
    expect(formatRelativeTime(threeHoursAgo)).toBe('3h atrás')
  })

  it('returns days ago', () => {
    const twoDaysAgo = new Date('2026-01-13T12:00:00Z').toISOString()
    expect(formatRelativeTime(twoDaysAgo)).toBe('2d atrás')
  })

  it('returns 59 min for 59 minutes', () => {
    const fiftyNineMin = new Date('2026-01-15T11:01:00Z').toISOString()
    expect(formatRelativeTime(fiftyNineMin)).toBe('59 min atrás')
  })

  it('returns 1h for 60 minutes', () => {
    const oneHour = new Date('2026-01-15T11:00:00Z').toISOString()
    expect(formatRelativeTime(oneHour)).toBe('1h atrás')
  })
})

describe('formatScheduledTime', () => {
  it('formats time in pt-BR 24h format', () => {
    const result = formatScheduledTime('2026-01-15T14:30:00Z')
    // The exact output depends on timezone, but it should contain digits and colon
    expect(result).toMatch(/\d{2}:\d{2}/)
  })
})

describe('getSourceLabel', () => {
  it('maps claude-ai to Claude AI', () => {
    expect(getSourceLabel('claude-ai')).toBe('Claude AI')
  })

  it('maps rss to RSS Feed', () => {
    expect(getSourceLabel('rss')).toBe('RSS Feed')
  })

  it('maps manual to Manual', () => {
    expect(getSourceLabel('manual')).toBe('Manual')
  })

  it('maps template to Template', () => {
    expect(getSourceLabel('template')).toBe('Template')
  })

  it('returns original string for unknown sources', () => {
    expect(getSourceLabel('unknown')).toBe('unknown')
  })
})
