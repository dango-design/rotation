import { describe, expect, it } from 'vitest';
import { fromAnotherSite, rateLimited } from './safe-fetch';

const req = (headers: Record<string, string> = {}) => new Request('http://localhost/api/image?url=x', { headers });

describe('fromAnotherSite', () => {
  it('refuses requests other sites make, and allows our own and older browsers that say nothing', () => {
    expect(fromAnotherSite(req({ 'sec-fetch-site': 'cross-site' }))).toBe(true);
    expect(fromAnotherSite(req({ 'sec-fetch-site': 'same-site' }))).toBe(true);
    expect(fromAnotherSite(req({ 'sec-fetch-site': 'same-origin' }))).toBe(false);
    expect(fromAnotherSite(req())).toBe(false);
  });
});

describe('rateLimited', () => {
  it('allows up to the limit per minute for each address', () => {
    const a = req({ 'x-forwarded-for': '203.0.113.7' });
    const b = req({ 'x-forwarded-for': '198.51.100.2, 10.0.0.1' });
    for (let i = 0; i < 3; i++) expect(rateLimited(a, 'test', 3)).toBe(false);
    expect(rateLimited(a, 'test', 3)).toBe(true);
    expect(rateLimited(b, 'test', 3)).toBe(false);
  });
});
