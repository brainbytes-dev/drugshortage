import { cn } from '@/lib/utils'

describe('cn (className utility)', () => {
  test('merges single class name', () => {
    expect(cn('text-red-500')).toBe('text-red-500')
  })

  test('merges multiple class names', () => {
    const result = cn('text-red-500', 'bg-blue-200')
    expect(result).toContain('text-red-500')
    expect(result).toContain('bg-blue-200')
  })

  test('handles conditional class names with clsx', () => {
    const isActive = true
    const result = cn('base-class', isActive && 'active-class')
    expect(result).toContain('base-class')
    expect(result).toContain('active-class')
  })

  test('handles false conditional class names', () => {
    const isActive = false
    const result = cn('base-class', isActive && 'active-class')
    expect(result).toBe('base-class')
  })

  test('merges conflicting Tailwind classes (tailwind-merge)', () => {
    // tailwind-merge should keep the last conflicting class
    const result = cn('p-4', 'p-8')
    expect(result).toBe('p-8')
  })

  test('handles arrays of class names', () => {
    const result = cn(['text-sm', 'font-bold'])
    expect(result).toContain('text-sm')
    expect(result).toContain('font-bold')
  })

  test('filters out undefined and null values', () => {
    const result = cn('base', undefined, 'active', null)
    expect(result).toContain('base')
    expect(result).toContain('active')
    expect(result).not.toContain('undefined')
    expect(result).not.toContain('null')
  })

  test('handles empty input', () => {
    expect(cn()).toBe('')
  })

  test('handles complex objects with boolean keys', () => {
    const result = cn({
      'text-red-500': true,
      'bg-blue-200': false,
      'font-bold': true,
    })
    expect(result).toContain('text-red-500')
    expect(result).toContain('font-bold')
    expect(result).not.toContain('bg-blue-200')
  })

  test('combines all input types', () => {
    const isError = true
    const result = cn(
      'base-class',
      ['array-class-1', 'array-class-2'],
      { 'conditional-class': isError },
      isError && 'error-class',
      'p-2 p-4', // conflicting
    )
    expect(result).toContain('base-class')
    expect(result).toContain('array-class-1')
    expect(result).toContain('conditional-class')
    expect(result).toContain('error-class')
    expect(result).toContain('p-4')
    expect(result).not.toContain('p-2')
  })
})