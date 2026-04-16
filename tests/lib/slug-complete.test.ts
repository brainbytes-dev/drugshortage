/**
 * Library Tests: slug.ts
 * Tests URL slug generation
 *
 * Priority: HIGH - Used for production URLs and SEO
 * Coverage Target: 100%
 */

import { describe, it, expect } from 'vitest'
import { toSlug } from '@/lib/slug'

describe('toSlug', () => {
  describe('Basic Transformations', () => {
    it('should convert to lowercase', () => {
      expect(toSlug('Aspirin Complex')).toBe('aspirin-complex')
      expect(toSlug('IBUPROFEN')).toBe('ibuprofen')
      expect(toSlug('MiXeD CaSe')).toBe('mixed-case')
    })

    it('should replace spaces with hyphens', () => {
      expect(toSlug('Aspirin 500 mg')).toBe('aspirin-500-mg')
      expect(toSlug('Multi Word Product')).toBe('multi-word-product')
    })

    it('should replace multiple consecutive spaces with single hyphen', () => {
      expect(toSlug('Aspirin    Complex')).toBe('aspirin-complex')
      expect(toSlug('Too     Many     Spaces')).toBe('too-many-spaces')
    })
  })

  describe('Special Characters', () => {
    it('should remove trademark symbols', () => {
      expect(toSlug('Aspirin® Plus')).toBe('aspirin-plus')
      expect(toSlug('Product™ Name')).toBe('product-name')
    })

    it('should convert slashes to hyphens', () => {
      expect(toSlug('Aspirin/Paracetamol')).toBe('aspirin-paracetamol')
      expect(toSlug('A/B/C')).toBe('a-b-c')
    })

    it('should remove parentheses and brackets', () => {
      expect(toSlug('Aspirin (500mg)')).toBe('aspirin-500mg')
      expect(toSlug('Product [Special]')).toBe('product-special')
    })

    it('should remove commas and periods', () => {
      expect(toSlug('Product, 500mg')).toBe('product-500mg')
      expect(toSlug('Dr. Müller')).toBe('dr-muller')
    })

    it('should remove ampersands', () => {
      expect(toSlug('Johnson & Johnson')).toBe('johnson-johnson')
      expect(toSlug('A & B & C')).toBe('a-b-c')
    })

    it('should remove plus signs', () => {
      expect(toSlug('Aspirin+C')).toBe('aspirin-c')
      expect(toSlug('Product + Extra')).toBe('product-extra')
    })
  })

  describe('German Umlauts', () => {
    it('should convert ä to ae', () => {
      expect(toSlug('Schädel')).toContain('ae')
    })

    it('should convert ö to oe', () => {
      expect(toSlug('Schöne')).toContain('oe')
    })

    it('should convert ü to ue', () => {
      expect(toSlug('Zürich')).toContain('ue')
    })

    it('should convert ß to ss', () => {
      expect(toSlug('Straße')).toContain('ss')
    })

    it('should handle mixed umlauts', () => {
      const result = toSlug('Schöne Lösung für Zürich')
      expect(result).not.toContain('ö')
      expect(result).not.toContain('ü')
    })
  })

  describe('Hyphen Handling', () => {
    it('should preserve single hyphens', () => {
      expect(toSlug('Co-Marketing')).toBe('co-marketing')
      expect(toSlug('Ultra-Thin')).toBe('ultra-thin')
    })

    it('should remove consecutive hyphens', () => {
      expect(toSlug('Aspirin - - Complex')).toBe('aspirin-complex')
      expect(toSlug('Multi---Hyphen')).toBe('multi-hyphen')
    })

    it('should trim leading hyphens', () => {
      expect(toSlug('-Aspirin')).toBe('aspirin')
      expect(toSlug('---Leading')).toBe('leading')
    })

    it('should trim trailing hyphens', () => {
      expect(toSlug('Aspirin-')).toBe('aspirin')
      expect(toSlug('Trailing---')).toBe('trailing')
    })

    it('should trim both leading and trailing hyphens', () => {
      expect(toSlug('---Aspirin---')).toBe('aspirin')
    })
  })

  describe('Numbers', () => {
    it('should preserve numbers', () => {
      expect(toSlug('Aspirin 500')).toBe('aspirin-500')
      expect(toSlug('Product 123')).toBe('product-123')
    })

    it('should handle decimal numbers', () => {
      expect(toSlug('Dosage 0.5mg')).toBe('dosage-0-5mg')
    })

    it('should handle numbers at start', () => {
      expect(toSlug('5mg Aspirin')).toBe('5mg-aspirin')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      expect(toSlug('')).toBe('')
    })

    it('should handle only special characters', () => {
      expect(toSlug('###@@@!!!')).toBe('')
    })

    it('should handle only spaces', () => {
      expect(toSlug('     ')).toBe('')
    })

    it('should handle only hyphens', () => {
      expect(toSlug('-----')).toBe('')
    })

    it('should handle single character', () => {
      expect(toSlug('A')).toBe('a')
    })

    it('should handle very long strings', () => {
      const longString = 'Very Long Product Name With Many Words '.repeat(10)
      const result = toSlug(longString)
      expect(result.length).toBeGreaterThan(0)
      expect(result).not.toContain('  ')
    })
  })

  describe('Real-World Drug Names', () => {
    it('should handle Aspirin® Complex', () => {
      expect(toSlug('Aspirin® Complex')).toBe('aspirin-complex')
    })

    it('should handle Co-Amoxicillin', () => {
      expect(toSlug('Co-Amoxicillin')).toBe('co-amoxicillin')
    })

    it('should handle Paracetamol (500mg)', () => {
      expect(toSlug('Paracetamol (500mg)')).toBe('paracetamol-500mg')
    })

    it('should handle Vitamin B12 + Folsäure', () => {
      const result = toSlug('Vitamin B12 + Folsäure')
      expect(result).toBe('vitamin-b12-folsaure')
    })

    it('should handle Schmerzmittel/Fiebermittel', () => {
      expect(toSlug('Schmerzmittel/Fiebermittel')).toBe('schmerzmittel-fiebermittel')
    })

    it('should handle Dr. Müller\'s Lösung', () => {
      const result = toSlug("Dr. Müller's Lösung")
      expect(result).not.toContain('ü')
      expect(result).not.toContain('ö')
      expect(result).not.toContain("'")
    })
  })

  describe('Idempotency', () => {
    it('should be idempotent (calling twice produces same result)', () => {
      const input = 'Aspirin® Complex (500mg)'
      const firstPass = toSlug(input)
      const secondPass = toSlug(firstPass)
      expect(firstPass).toBe(secondPass)
    })
  })

  describe('URL Safety', () => {
    it('should produce valid URL segments', () => {
      const inputs = [
        'Aspirin® 500mg',
        'Co-Marketing Produkt',
        'Zürich Apotheke',
        'Product & Service',
      ]

      inputs.forEach(input => {
        const slug = toSlug(input)
        // Slug should only contain lowercase letters, numbers, and hyphens
        expect(slug).toMatch(/^[a-z0-9-]*$/)
      })
    })

    it('should not start or end with hyphen', () => {
      const inputs = [
        '-Leading hyphen',
        'Trailing hyphen-',
        '---Multiple leading',
        'Multiple trailing---',
      ]

      inputs.forEach(input => {
        const slug = toSlug(input)
        expect(slug).not.toMatch(/^-/)
        expect(slug).not.toMatch(/-$/)
      })
    })

    it('should not contain consecutive hyphens', () => {
      const inputs = [
        'Double--hyphen',
        'Triple---hyphen',
        'Many----hyphens',
      ]

      inputs.forEach(input => {
        const slug = toSlug(input)
        expect(slug).not.toMatch(/--/)
      })
    })
  })
})
