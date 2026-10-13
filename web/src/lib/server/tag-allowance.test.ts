import { describe, expect, it } from 'vitest';
import { readClaim } from './tag-allowance';

describe('readClaim', () => {
  it('lets approved accounts and people with tags left through', () => {
    expect(readClaim({ allowed: true, approved: true })).toEqual({ allowed: true, approved: true, left: undefined });
    expect(readClaim({ allowed: true, approved: false, left: 4 })).toEqual({ allowed: true, approved: false, left: 4 });
  });

  it('says why a tag was refused', () => {
    expect(readClaim({ allowed: false, reason: 'person', limit: 10 })).toMatchObject({ allowed: false, status: 429, error: expect.stringContaining('10 photo tags') });
    expect(readClaim({ allowed: false, reason: 'everyone' })).toMatchObject({ allowed: false, status: 429 });
  });

  it('treats a missing or unreadable answer as signed out', () => {
    expect(readClaim(null)).toMatchObject({ allowed: false, status: 401 });
    expect(readClaim({ allowed: false, reason: 'signed-out' })).toMatchObject({ allowed: false, status: 401 });
  });
});
