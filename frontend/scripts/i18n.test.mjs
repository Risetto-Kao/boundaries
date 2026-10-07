import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import ts from 'typescript';
import { mkdtempSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Compile only the pure language/validation modules; no Next server or DB needed.
const require = createRequire(import.meta.url);
const frontend = fileURLToPath(new URL('../', import.meta.url));
const output = mkdtempSync(join(tmpdir(), 'boundaries-i18n-'));
after(() => rmSync(output, { recursive: true, force: true }));
const program = ts.createProgram([join(frontend, 'lib/validations.ts')], {
  outDir: output, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  esModuleInterop: true, skipLibCheck: true,
});
assert.equal(program.emit().emitSkipped, false);
symlinkSync(join(frontend, 'node_modules'), join(output, 'node_modules'), 'dir');
const { languages, defaultLocale, isLocale, negotiateLocale, createTranslator } = require(join(output, 'i18n/config.js'));
const { createValidationSchemas } = require(join(output, 'validations.js'));
const id = 'a42b9c6a-086c-4a86-9946-62bdd3d546eb';

test('negotiates region tags, quality weights and unsupported languages safely', () => {
  assert.equal(negotiateLocale('en-US,en;q=0.9'), 'en');
  assert.equal(negotiateLocale('ja-JP'), 'ja');
  assert.equal(negotiateLocale('ko-KR'), 'ko');
  assert.equal(negotiateLocale('zh-TW'), 'zh-Hant');
  assert.equal(negotiateLocale('fr;q=1,ja;q=0.7,en;q=0.8'), 'en');
  assert.equal(negotiateLocale('ko;q=0,en;q=0.5'), 'en');
  for (const header of [null, '', 'fr-FR', '*', 'ja;q=NaN', 'en;q=-1']) {
    assert.equal(negotiateLocale(header), defaultLocale);
  }
  for (const value of ['__proto__', 'constructor', 'fr', undefined]) assert.equal(isLocale(value), false);
});

test('every catalog supplies nonempty translations and matching interpolation variables', () => {
  const reference = languages[defaultLocale].messages;
  for (const { messages } of Object.values(languages)) {
    assert.deepEqual(Object.keys(messages).sort(), Object.keys(reference).sort());
    for (const [key, value] of Object.entries(messages)) {
      assert.ok(value.trim());
      assert.deepEqual((value.match(/\{\w+\}/g) ?? []).sort(), (reference[key].match(/\{\w+\}/g) ?? []).sort(), key);
    }
  }
  assert.equal(createTranslator('en')('resultsTitle', { title: '旅遊 {title} 여행' }), '旅遊 {title} 여행 - Results');
});

test('accepts and preserves multilingual titles, descriptions, questions and nicknames', () => {
  for (const locale of Object.keys(languages)) {
    const { createSurveySchema, submitResponseSchema } = createValidationSchemas(locale);
    for (const text of ['Travel preferences', '旅行の好み', '여행 취향', '旅行偏好', 'Café – 여행 🌏']) {
      const survey = { title: text, description: text, questions: [text] };
      assert.deepEqual(createSurveySchema.parse(survey), survey);
      const response = { surveyId: id, nickname: text, answers: [{ questionId: id, value: 'depends' }] };
      assert.deepEqual(submitResponseSchema.parse(response), response);
    }
  }
});

test('rejects whitespace-only input and retains existing length and question limits', () => {
  const { createSurveySchema, nicknameSchema } = createValidationSchemas('ja');
  for (const title of ['', '  ', '\u3000']) assert.equal(createSurveySchema.safeParse({ title, questions: ['Question'] }).success, false);
  assert.equal(createSurveySchema.safeParse({ title: 'Title', questions: ['\u3000'] }).success, false);
  assert.equal(nicknameSchema.safeParse(' '.repeat(3)).success, false);
  assert.equal(nicknameSchema.safeParse('가'.repeat(50)).success, true);
  assert.equal(nicknameSchema.safeParse('가'.repeat(51)).success, false);
  assert.equal(createSurveySchema.safeParse({ title: 'Title', questions: Array(21).fill('Question') }).success, false);
});

test('request-local validation does not leak another user’s language or translate answer values', () => {
  const english = createValidationSchemas('en');
  const japanese = createValidationSchemas('ja');
  const korean = createValidationSchemas('ko');
  assert.equal(english.nicknameSchema.safeParse('').error.issues[0].message, 'Enter a nickname');
  assert.equal(japanese.nicknameSchema.safeParse('').error.issues[0].message, 'ニックネームを入力してください');
  assert.equal(korean.nicknameSchema.safeParse('').error.issues[0].message, '닉네임을 입력하세요');
  for (const value of ['yes', 'no', 'depends']) assert.equal(japanese.answerValueSchema.parse(value), value);
  assert.equal(japanese.answerValueSchema.safeParse('はい').success, false);
});
