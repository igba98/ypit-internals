import { describe, it, expect } from 'vitest';
import { canAdvance, canRevert } from './permissions';

describe('canAdvance', () => {
  it('allows FINANCE to advance PAYMENT_PENDING', () => {
    expect(canAdvance('FINANCE', 'PAYMENT_PENDING')).toBe(true);
  });

  it('blocks ADMISSIONS from advancing PAYMENT_PENDING', () => {
    expect(canAdvance('ADMISSIONS', 'PAYMENT_PENDING')).toBe(false);
  });

  it('MANAGING_DIRECTOR can advance any stage', () => {
    expect(canAdvance('MANAGING_DIRECTOR', 'PAYMENT_PENDING')).toBe(true);
    expect(canAdvance('MANAGING_DIRECTOR', 'LEAD')).toBe(true);
    expect(canAdvance('MANAGING_DIRECTOR', 'TRAVELLED')).toBe(true);
  });

  it('returns false for terminal stage (MONITORING has no forward transition)', () => {
    expect(canAdvance('OPERATIONS', 'MONITORING')).toBe(false);
    expect(canAdvance('MANAGING_DIRECTOR', 'MONITORING')).toBe(false);
  });
});

describe('canRevert', () => {
  it('only MANAGING_DIRECTOR can revert', () => {
    expect(canRevert('MANAGING_DIRECTOR')).toBe(true);
    expect(canRevert('FINANCE')).toBe(false);
    expect(canRevert('ADMISSIONS')).toBe(false);
  });
});