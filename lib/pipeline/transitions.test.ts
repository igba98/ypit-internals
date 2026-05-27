import { describe, it, expect } from 'vitest';
import { TRANSITIONS, getTransition, listTransitionsFrom } from './transitions';
import { PIPELINE_ORDER } from '@/types';

describe('TRANSITIONS table', () => {
  it('defines exactly 8 forward transitions', () => {
    expect(TRANSITIONS).toHaveLength(8);
  });

  it('covers every stage except MONITORING as a source', () => {
    const sources = new Set(TRANSITIONS.map(t => t.from));
    expect(sources.size).toBe(8);
    expect(sources.has('MONITORING')).toBe(false);
  });

  it('every transition moves exactly one step forward in PIPELINE_ORDER', () => {
    for (const t of TRANSITIONS) {
      const fromIdx = PIPELINE_ORDER.indexOf(t.from);
      const toIdx = PIPELINE_ORDER.indexOf(t.to);
      expect(toIdx).toBe(fromIdx + 1);
    }
  });

  it('every transition has at least one allowed role and one required field OR explicit zero', () => {
    for (const t of TRANSITIONS) {
      expect(t.allowedRoles.length).toBeGreaterThan(0);
      expect(Array.isArray(t.requiredFields)).toBe(true);
      expect(t.notify.length).toBeGreaterThan(0);
      expect(typeof t.messageTemplate).toBe('function');
    }
  });

  it('transition 1 LEAD->COUNSELING allows marketing roles', () => {
    const t = getTransition('LEAD');
    expect(t).toBeDefined();
    expect(t!.to).toBe('COUNSELING');
    expect(t!.allowedRoles).toEqual(
      expect.arrayContaining(['MARKETING_STAFF', 'SUB_AGENT', 'MARKETING_MANAGER'])
    );
    expect(t!.requiredFields.find(f => f.key === 'counselorAssigneeId')).toBeDefined();
  });

  it('transition 3 PAYMENT_PENDING->PAYMENT_CONFIRMED allows FINANCE only', () => {
    const t = getTransition('PAYMENT_PENDING');
    expect(t!.allowedRoles).toEqual(['FINANCE']);
    expect(t!.requiredFields.find(f => f.key === 'receiptNumber')).toBeDefined();
    expect(t!.requiredFields.find(f => f.key === 'amountReceived')).toBeDefined();
  });

  it('transition 5 APPLICATION_SUBMITTED->UNIVERSITY_ACCEPTED notifies ALL_PARENTS', () => {
    const t = getTransition('APPLICATION_SUBMITTED');
    expect(t!.notify).toEqual(expect.arrayContaining(['ALL_PARENTS']));
    expect(t!.requiredFields.find(f => f.key === 'offerLetterUrl')).toBeDefined();
  });

  it('messageTemplate substitutes context variables', () => {
    const t = getTransition('APPLICATION_SUBMITTED');
    const msg = t!.messageTemplate({
      studentName: 'John Doe',
      university: 'University of Manchester',
      capturedData: { offerLetterUrl: 'https://example.com/offer.pdf' },
    });
    expect(msg).toContain('University of Manchester');
  });

  it('listTransitionsFrom returns 1 transition for a non-terminal stage and 0 for MONITORING', () => {
    expect(listTransitionsFrom('LEAD')).toHaveLength(1);
    expect(listTransitionsFrom('MONITORING')).toHaveLength(0);
  });
});