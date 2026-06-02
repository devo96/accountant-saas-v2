import { describe, it, expect } from 'vitest';
import {
  generateZatcaUuid,
  generateZatcaQrBase64,
  generateInvoiceHash,
  generateInvoiceXml,
} from '@/lib/zatca';

describe('generateZatcaUuid', () => {
  it('generates a valid UUID v4', () => {
    const uuid = generateZatcaUuid();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it('generates unique values', () => {
    const uuids = new Set(Array.from({ length: 100 }, () => generateZatcaUuid()));
    expect(uuids.size).toBe(100);
  });
});

describe('generateZatcaQrBase64', () => {
  it('generates a base64 string', () => {
    const result = generateZatcaQrBase64({
      sellerName: 'Test Company',
      vatNumber: '1234567890',
      timestamp: new Date('2025-01-15'),
      totalWithVat: 1150,
      vatTotal: 150,
    });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('generateInvoiceHash', () => {
  it('generates a sha256 base64 hash', () => {
    const hash = generateInvoiceHash('<xml>test</xml>');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('produces different hashes for different inputs', () => {
    const hash1 = generateInvoiceHash('<xml>a</xml>');
    const hash2 = generateInvoiceHash('<xml>b</xml>');
    expect(hash1).not.toBe(hash2);
  });
});

describe('generateInvoiceXml', () => {
  it('generates valid invoice XML', () => {
    const xml = generateInvoiceXml({
      uuid: 'test-uuid',
      number: 1,
      issueDate: '2025-01-15',
      sellerName: 'Seller Co',
      vatNumber: '123',
      buyerName: 'Buyer Co',
      lines: [{ description: 'Item 1', quantity: 2, unitPrice: 100, taxRate: 15, lineTotal: 200 }],
      totalExcludingVat: 200,
      totalVat: 30,
      totalWithVat: 230,
    });
    expect(xml).toContain('test-uuid');
    expect(xml).toContain('Seller Co');
    expect(xml).toContain('Buyer Co');
    expect(xml).toContain('Item 1');
    expect(xml).toContain('230.00');
  });
});
