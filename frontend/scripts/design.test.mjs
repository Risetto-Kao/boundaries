import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

// Pure presentation logic: explicit acceptance examples from design spec §2.1.
const source = readFileSync(new URL('../lib/design.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { disagreementScore, disagreementBackground, detectSurveyLanguage } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('disagreement matches the two- and six-person acceptance examples', () => {
  for (const [answers, expected] of [
    [[], 0], [['yes'], 0], [['yes', 'yes'], 0], [['yes', 'no'], .75],
    [['yes', 'yes', 'yes', 'no', 'no', 'no'], .75],
    [['yes', 'yes', 'yes', 'yes', 'no', 'no'], .5],
    [['yes', 'yes', 'yes', 'yes', 'yes', 'no'], .25],
    [['yes', 'yes', 'depends', 'depends', 'no', 'no'], 1],
  ]) assert.ok(Math.abs(disagreementScore(answers) - expected) < 1e-10);
  assert.equal(disagreementBackground(['yes', undefined]), '#FFFFFF');
  assert.equal(disagreementScore(['yes', undefined, 'no']), .75);
  assert.equal(disagreementBackground(['yes', 'no']), 'rgba(104, 54, 239, 0.2)');
  assert.equal(disagreementBackground(['yes', 'depends', 'no']), 'rgba(104, 54, 239, 0.25)');
});

test('language badges use actual title and question content', () => {
  assert.equal(detectSurveyLanguage('Travel preferences'), 'en');
  assert.equal(detectSurveyLanguage('生活習慣'), 'zh-Hant');
  assert.equal(detectSurveyLanguage('生活・習慣', [{ text: '可以臨時改行程嗎？' }]), 'zh-Hant');
  assert.equal(detectSurveyLanguage('旅行', [{ text: '朝ごはんを食べますか？' }]), 'ja');
  assert.equal(detectSurveyLanguage('Trip', [{ text: '함께 계획할까요?' }]), 'ko');
});
