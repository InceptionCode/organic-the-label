import { describe, expect, test } from 'bun:test'
import { cn } from '~/ui/cn'
import { buttonClasses } from '~/ui/button'

describe('cn', () => {
  test('later conflicting utilities win', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  test('drops falsy values and merges conditionals', () => {
    expect(cn('text-sm', false && 'hidden', null, undefined, { 'font-medium': true, italic: false })).toBe('text-sm font-medium')
  })

  test('caller className overrides button size and variant classes', () => {
    const classes = buttonClasses({ size: 'sm', className: 'h-8 w-8' }).split(' ')
    expect(classes).toContain('h-8')
    expect(classes).not.toContain('h-9')
  })
})

describe('cn with ported custom utilities', () => {
  test('keeps a custom type-scale class next to a custom text color', () => {
    expect(cn('text-body-s text-muted')).toBe('text-body-s text-muted')
  })

  test('custom type-scale classes still conflict with each other', () => {
    expect(cn('text-body-s', 'text-body-m')).toBe('text-body-m')
  })

  test('custom shadows and surfaces merge in their own groups', () => {
    expect(cn('shadow-sm-premium', 'shadow-glow')).toBe('shadow-glow')
    expect(cn('bg-surface-2', 'bg-surface-3')).toBe('bg-surface-3')
  })
})
