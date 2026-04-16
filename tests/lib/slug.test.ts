/**
 * Library Tests: slug.ts
 * Tests URL slug generation
 */

import { toSlug } from '@/lib/slug'

describe('toSlug', () => {
  describe('German Umlauts', () => {
    test('converts ä to ae', () => {
      expect(toSlug('Schäfer')).toBe('schaefer')
    })

    test('converts ö to oe', () => {
      expect(toSlug('Österreich')).toBe('oesterreich')
    })

    test('converts ü to ue', () => {
      expect(toSlug('Müller')).toBe('mueller')
    })

    test('converts Ä to ae', () => {
      expect(toSlug('ÄPFEL')).toBe('aepfel')
    })

    test('converts Ö to oe', () => {
      expect(toSlug('ÖSTERREICH')).toBe('oesterreich')
    })

    test('converts Ü to ue', () => {
      expect(toSlug('ÜBER')).toBe('ueber')
    })

    test('converts ß to ss', () => {
      expect(toSlug('Straße')).toBe('strasse')
    })
  })

  describe('Special Characters', () => {
    test('removes spaces', () => {
      expect(toSlug('Test Medication')).toBe('test-medication')
    })

    test('removes punctuation', () => {
      expect(toSlug('Test, Med. 500mg!')).toBe('test-med-500mg')
    })

    test('removes slashes', () => {
      expect(toSlug('Test/Med')).toBe('test-med')
    })

    test('removes parentheses', () => {
      expect(toSlug('Test (Med)')).toBe('test-med')
    })

    test('removes quotes', () => {
      expect(toSlug(`Test "Med"`)).toBe('test-med')
    })

    test('removes trademark symbols', () => {
      expect(toSlug('Test™ Med®')).toBe('test-med')
    })
  })

  describe('Multiple Dashes', () => {
    test('replaces consecutive spaces with single dash', () => {
      expect(toSlug('Test   Med')).toBe('test-med')
    })

    test('collapses multiple dashes', () => {
      expect(toSlug('Test---Med')).toBe('test-med')
    })

    test('removes leading dashes', () => {
      expect(toSlug('---Test')).toBe('test')
    })

    test('removes trailing dashes', () => {
      expect(toSlug('Test---')).toBe('test')
    })

    test('removes both leading and trailing dashes', () => {
      expect(toSlug('---Test---')).toBe('test')
    })
  })

  describe('Edge Cases', () => {
    test('handles empty string', () => {
      expect(toSlug('')).toBe('')
    })

    test('handles only special characters', () => {
      expect(toSlug('!@#$%^&*()')).toBe('')
    })

    test('handles numbers', () => {
      expect(toSlug('Test 500mg')).toBe('test-500mg')
    })

    test('handles mixed case', () => {
      expect(toSlug('TeSt MeD')).toBe('test-med')
    })

    test('handles unicode characters (non-German)', () => {
      expect(toSlug('Test 日本語')).toBe('test')
    })

    test('handles very long strings', () => {
      const long = 'a'.repeat(500)
      const slug = toSlug(long)
      expect(slug).toBe(long)
    })

    test('handles real medication name', () => {
      expect(toSlug('Paracetamol Mepha 500mg')).toBe('paracetamol-mepha-500mg')
    })

    test('handles complex real name', () => {
      expect(toSlug('Aspirin® Cardio 100mg (Bayer)')).toBe('aspirin-cardio-100mg-bayer')
    })
  })

  describe('Lowercase Conversion', () => {
    test('converts all uppercase to lowercase', () => {
      expect(toSlug('TEST MEDICATION')).toBe('test-medication')
    })

    test('converts mixed case to lowercase', () => {
      expect(toSlug('Test MeDiCaTiOn')).toBe('test-medication')
    })
  })

  describe('Accented Characters', () => {
    test('handles é, è, ê', () => {
      expect(toSlug('Médication')).toBe('m-dication')
    })

    test('handles à, á, â', () => {
      expect(toSlug('Cañón')).toBe('ca-n')
    })
  })
})
