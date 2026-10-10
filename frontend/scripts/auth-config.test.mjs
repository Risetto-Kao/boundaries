import assert from 'node:assert/strict';
import { test } from 'node:test';
import { authProviders, safeReturnTo, isSameOrigin, isAuthConfigured, isAccountHistoryEnabled, getEnabledAuthProviders } from '../lib/auth/config.ts';
import { getAccountDisplayName, resolveResponseNickname } from '../lib/auth/display-name.ts';

test('uses only valid display names, without exposing email or account identifiers', () => {
  assert.equal(getAccountDisplayName({ full_name: '  小明  ', name: 'Other name' }), '小明');
  assert.equal(getAccountDisplayName({ full_name: ' ', name: 42, display_name: '旅行夥伴' }), '旅行夥伴');
  assert.equal(getAccountDisplayName({ full_name: {}, name: ['private'], email: 'private@example.invalid', id: 'private-id' }), null);
  assert.equal(getAccountDisplayName(undefined), null);
  assert.equal(getAccountDisplayName({ name: '名'.repeat(51) }), '名'.repeat(50));
});

test('blank authenticated nicknames use account names while custom names and invalid input stay intact', () => {
  const metadata = { full_name: '  帳號名稱  ' };
  for (const input of [undefined, '', ' ', '\u3000']) assert.equal(resolveResponseNickname(input, metadata), '帳號名稱');
  assert.equal(resolveResponseNickname('  自訂暱稱  ', metadata), '  自訂暱稱  ');
  for (const input of [null, 42, {}, []]) assert.equal(resolveResponseNickname(input, metadata), input);
  assert.equal(resolveResponseNickname(undefined, null), '');
  assert.equal(resolveResponseNickname(' ', { email: 'private@example.invalid' }), '');
});

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

test('registers LINE with its own verified OAuth identity and minimal scopes', () => {
  assert.deepEqual(authProviders.map(({ id, provider }) => [id, provider]), [['google', 'google'], ['line', 'custom:line']]);
  assert.equal(authProviders.find(({ id }) => id === 'line').scopes, 'openid profile');
});

test('hides disabled providers and prevents sign-in before schema configuration is enabled', () => {
  const keys = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'ACCOUNT_HISTORY_ENABLED', 'AUTH_GOOGLE_ENABLED', 'AUTH_LINE_ENABLED'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://development.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'public-test-key';
    process.env.ACCOUNT_HISTORY_ENABLED = 'true';
    delete process.env.AUTH_GOOGLE_ENABLED;
    delete process.env.AUTH_LINE_ENABLED;
    assert.deepEqual(getEnabledAuthProviders().map(({ id }) => id), ['google']);
    process.env.AUTH_LINE_ENABLED = 'true';
    assert.deepEqual(getEnabledAuthProviders().map(({ id }) => id), ['google', 'line']);
    process.env.AUTH_GOOGLE_ENABLED = 'false';
    assert.deepEqual(getEnabledAuthProviders().map(({ id }) => id), ['line']);
    process.env.ACCOUNT_HISTORY_ENABLED = 'false';
    assert.deepEqual(getEnabledAuthProviders(), []);
    process.env.ACCOUNT_HISTORY_ENABLED = 'true';
    process.env.AUTH_LINE_ENABLED = 'TRUE';
    assert.deepEqual(getEnabledAuthProviders(), []);
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
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
