import { describe, it, expect } from 'vitest';
import {
  TRAVEL_STEP_DEFS,
  getTravelStepDef,
  allTravelStepsDone,
} from './travelSteps';
import { TravelStepStatusMap } from '@/types';

describe('TRAVEL_STEP_DEFS', () => {
  it('defines exactly 4 sub-steps in order', () => {
    expect(TRAVEL_STEP_DEFS).toHaveLength(4);
    expect(TRAVEL_STEP_DEFS.map(d => d.key)).toEqual(['passport', 'visa', 'flight', 'arrival']);
  });

  it('passport step requires passportNumber and passportExpiry', () => {
    const def = getTravelStepDef('passport');
    const keys = def!.requiredFields.map(f => f.key);
    expect(keys).toEqual(expect.arrayContaining(['passportNumber', 'passportExpiry']));
  });

  it('flight step requires booking fields', () => {
    const def = getTravelStepDef('flight');
    const keys = def!.requiredFields.map(f => f.key);
    expect(keys).toEqual(expect.arrayContaining(['flightDate', 'flightNumber', 'airline']));
  });

  it('all steps notify STUDENT at minimum', () => {
    for (const def of TRAVEL_STEP_DEFS) {
      expect(def.notifyOnDone).toContain('STUDENT');
    }
  });

  it('allTravelStepsDone is true only when all 4 are DONE', () => {
    const status: TravelStepStatusMap = {
      passport: 'DONE', visa: 'DONE', flight: 'DONE', arrival: 'DONE',
    };
    expect(allTravelStepsDone(status)).toBe(true);
    expect(allTravelStepsDone({ ...status, arrival: 'IN_PROGRESS' })).toBe(false);
    expect(allTravelStepsDone(undefined)).toBe(false);
  });
});