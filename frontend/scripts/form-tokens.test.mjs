import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createInvite, FormAccessConfigurationError, matchesInvite, revealInvite, submissionGuestToken } from '../lib/form-tokens.ts';

const original = process.env.FORM_ACCESS_KEY;
after(() => {
  if (original === undefined) delete process.env.FORM_ACCESS_KEY;
  else process.env.FORM_ACCESS_KEY = original;
});

test('invite encryption and guest retries preserve the key with surrounding whitespace', () => {
  const key = 'ab'.repeat(32); // Disposable test key, never a deployed credential.
  process.env.FORM_ACCESS_KEY = key;
  const invite = createInvite();
  const retryToken = submissionGuestToken('test-request');
  process.env.FORM_ACCESS_KEY = ` \n${key}\r\n `;
  const token = revealInvite(invite.inviteEncrypted);
  assert.equal(matchesInvite(token, invite.inviteHash), true);
  assert.equal(submissionGuestToken('test-request'), retryToken);
  assert.equal(matchesInvite(revealInvite(createInvite().inviteEncrypted), invite.inviteHash), false);
});

test('missing and malformed keys fail with safe diagnostics without disclosing their values', () => {
  for (const value of [undefined, '', '   ', 'ab'.repeat(31), 'not-a-secret', `a${' '.repeat(62)}b`]) {
    if (value === undefined) delete process.env.FORM_ACCESS_KEY;
    else process.env.FORM_ACCESS_KEY = value;
    assert.throws(createInvite, error => {
      assert.ok(error instanceof FormAccessConfigurationError);
      assert.equal(error.reason, value?.trim() ? 'invalid' : 'missing');
      assert.equal(error.message, `FORM_ACCESS_KEY configuration is ${error.reason}`);
      return true;
    });
  }
});
