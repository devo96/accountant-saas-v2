import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatDate, generateNumber } from '@/lib/utils';

describe('cn', () => {
  it('combines class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });
});

describe('formatCurrency', () => {
  it('formats SAR currency', () => {
    const result = formatCurrency(1000);
    expect(result).toContain('ر.س');
    expect(result).toContain('٠٠');
  });

  it('handles zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('٠');
  });
});

describe('formatDate', () => {
  it('formats date in Arabic locale', () => {
    const date = new Date(2025, 0, 15);
    const result = formatDate(date);
    expect(result).toContain('١٥');
  });
});

describe('generateNumber', () => {
  it('generates zero-padded number', () => {
    expect(generateNumber('INV', 1)).toBe('INV-00001');
  });

  it('handles large sequence', () => {
    expect(generateNumber('PO', 99999)).toBe('PO-99999');
  });
});
