import { describe, expect, it } from 'vitest';

import { resolveReturnTo } from './return-to';

describe('resolveReturnTo', () => {
  it('sends the user back to the page they asked for', () => {
    expect(resolveReturnTo({ returnTo: '/document/abc-123' })).toBe('/document/abc-123');
  });

  it('keeps the query string', () => {
    expect(resolveReturnTo({ returnTo: '/document/abc?tab=merges' })).toBe(
      '/document/abc?tab=merges'
    );
  });

  it('falls back to the document list when there is nothing to return to', () => {
    expect(resolveReturnTo(undefined)).toBe('/document');
    expect(resolveReturnTo({})).toBe('/document');
  });

  // returnTo survives a round trip through Auth0, so it must never be able to
  // send someone to another origin after they sign in.
  it('refuses an absolute URL', () => {
    expect(resolveReturnTo({ returnTo: 'https://evil.example/steal' })).toBe('/document');
  });

  it('refuses a protocol-relative URL', () => {
    expect(resolveReturnTo({ returnTo: '//evil.example/steal' })).toBe('/document');
  });

  it('refuses a path that is not rooted', () => {
    expect(resolveReturnTo({ returnTo: 'document/abc' })).toBe('/document');
  });
});
