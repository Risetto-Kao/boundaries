import assert from 'node:assert/strict';
import { test } from 'node:test';
import { authProviders, safeReturnTo, isSameOrigin, isAuthConfigured, isAccountHistoryEnabled } from '../lib/auth/config.ts';

test('keeps internal form destinations and normalizes paths', () => {
  assert.equal(safeReturnTo('/surveys/abc?tab=answers#question'), '/surveys/abc?tab=answers#question');
  assert.equal(safeReturnTo('/create'), '/create');
  assert.equal(safeReturnTo('/a/../account'), '/account');
});

test('rejects external, protocol-relative, backslash and control-character redirects', () => {
  for (const input of [undefined, null, '', 'https://evil.example', '//evil.example', '/\\evil.example', '/\n/evil.example', 'javascript:alert(1)']) {
    assert.equal(safeReturnTo(input), '/account');
  }
});

test('prevents redirect loops into login or auth endpoints after path normalization', () => {
  for (const input of ['/login?next=/login', '/login/', '/auth', '/auth/signout', '/auth/callback?code=bad', '/a/../auth/signin', '/%61uth/callback', '/%6cogin']) {
    assert.equal(safeReturnTo(input), '/account');
  }
});

test('accepts only browser mutations from the exact same origin', () => {
  const url = 'https://boundaries.example/api/surveys';
  assert.equal(isSameOrigin(new Request(url, { headers: { origin: 'https://boundaries.example' } })), true);
  for (const origin of ['https://evil.example', 'http://boundaries.example', 'https://boundaries.example.evil', 'null']) {
    assert.equal(isSameOrigin(new Request(url, { headers: { origin } })), false);
  }
  assert.equal(isSameOrigin(new Request(url)), false);
});

test('exposes only Google until additional providers are configured', () => {
  assert.deepEqual(authProviders.map(({ id, provider }) => [id, provider]), [['google', 'google']]);
});

test('placeholder and missing auth configuration keep guest mode available', () => {
  const previousEnabled = process.env.ACCOUNT_HISTORY_ENABLED;
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  try {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    assert.equal(isAuthConfigured(), false);
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://your-project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'your-anon-key';
    assert.equal(isAuthConfigured(), false);
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://development.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'public-test-key';
    delete process.env.ACCOUNT_HISTORY_ENABLED;
    assert.equal(isAccountHistoryEnabled(), false);
    assert.equal(isAuthConfigured(), false);
    process.env.ACCOUNT_HISTORY_ENABLED = "false";
    assert.equal(isAuthConfigured(), false);
    process.env.ACCOUNT_HISTORY_ENABLED = "true";
    assert.equal(isAuthConfigured(), true);
  } finally {
    if (previousEnabled === undefined) delete process.env.ACCOUNT_HISTORY_ENABLED;
    else process.env.ACCOUNT_HISTORY_ENABLED = previousEnabled;
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousKey;
  }
});
