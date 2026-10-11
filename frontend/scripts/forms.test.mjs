import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, symlinkSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.BOUNDARIES_TEST_DATABASE_URL;
assert.ok(connectionString, 'Set BOUNDARIES_TEST_DATABASE_URL to an isolated localhost test DB');
const url = new URL(connectionString);
assert.ok(['localhost', '127.0.0.1'].includes(url.hostname) && url.pathname === '/boundaries_forms_test', 'Refusing to write outside the isolated local test database');
process.env.FORM_ACCESS_KEY = 'ab'.repeat(32); // Ephemeral test key, never a deployed credential.
const frontend = fileURLToPath(new URL('../', import.meta.url));
const output = mkdtempSync(join(tmpdir(), 'boundaries-forms-test-'));
const program = ts.createProgram(['form-service.ts', 'form-validation.ts'].map(p => join(frontend, 'lib', p)), { rootDir: join(frontend, 'lib'), outDir: output, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, skipLibCheck: true });
assert.equal(program.emit().emitSkipped, false);
symlinkSync(join(frontend, 'node_modules'), join(output, 'node_modules'), 'dir');
const require = createRequire(import.meta.url);
const { FormService, FormError } = require(join(output, 'form-service.js'));
const { formSchemas } = require(join(output, 'form-validation.js'));
const { revealInvite, hashToken, guestLifetime } = require(join(output, 'form-tokens.js'));
const pool = new pg.Pool({ connectionString });
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const forms = new FormService(db);
after(async () => { await db.$disconnect(); await pool.end(); rmSync(output, { recursive: true, force: true }); });

// This destructive cleanup is limited by the explicit localhost + database-name
// check above. No real Supabase credentials are read by this script.
await pool.query(`DROP TABLE IF EXISTS boundary_submission_answers, boundary_submissions, boundary_guest_sessions, boundary_form_questions, boundary_forms, boundary_template_questions, boundary_templates CASCADE;
DROP FUNCTION IF EXISTS boundary_guard_form_question(), boundary_guard_submission_answer(), boundary_check_complete_submission(), boundary_guard_submission() CASCADE;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users(id uuid PRIMARY KEY);
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF; IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF; END $$;`);
if (!(await pool.query("SELECT to_regclass('public.surveys') AS name")).rows[0].name) await pool.query(readFileSync(join(frontend, 'supabase/schema.sql'), 'utf8'));
const legacyCount = (await pool.query('SELECT count(*)::int AS count FROM surveys')).rows[0].count;
await pool.query(readFileSync(join(frontend, 'supabase/template-forms.sql'), 'utf8'));
const owner = randomUUID(), participant = randomUUID(), outsider = randomUUID();
await pool.query('INSERT INTO auth.users(id) VALUES ($1),($2),($3)', [owner, participant, outsider]);
const actor = id => ({ userId: id });
const guest = { userId: null };
const templateInput = { title: 'Travel 旅行', description: 'Independent snapshots', questions: Array.from({ length: 20 }, (_, i) => `Question ${i + 1}`) };
const denied = (operation, key) => assert.rejects(operation, error => error instanceof FormError && (!key || error.key === key));
async function invitation(id) { const data = await db.fillableForm.findUniqueOrThrow({ where: { id } }); return revealInvite(data.inviteEncrypted); }
async function submission(id, who, options = {}) { const invite = await invitation(id); const questions = await db.formQuestion.findMany({ where: { formId: id }, orderBy: { orderIndex: 'asc' } }); const input = { requestKey: randomUUID(), nickname: 'Same name', invite, answers: questions.map(q => ({ questionId: q.id, value: 'yes' })), ...options }; return { input, result: await forms.submit(id, who, input) }; }
async function manage(id, action, extras = {}) { const current = await db.fillableForm.findUniqueOrThrow({ where: { id } }); return forms.manage(id, owner, { action, updatedAt: current.updatedAt.toISOString(), ...extras }); }

const template = await forms.createTemplate(owner, 'Author', templateInput);
const form = await forms.generateForm(owner, template.id);
const other = await forms.generateForm(owner, template.id);

test('only authenticated users create/copy/generate; ownership and official attribution are server controlled', async () => {
  await denied(() => forms.createTemplate(null, null, templateInput), 'loginRequired');
  await denied(() => forms.copyTemplate(null, null, template.id), 'loginRequired');
  await denied(() => forms.generateForm(null, template.id), 'loginRequired');
  assert.equal(formSchemas().template.safeParse({ ...templateInput, ownerType: 'OFFICIAL' }).success, false);
  assert.equal(await forms.canEditTemplate(template.id, outsider), false);
  await denied(() => forms.updateTemplate(outsider, template.id, { ...templateInput, updatedAt: template.updatedAt.toISOString() }));
  const official = await db.template.create({ data: { ownerType: 'OFFICIAL', title: 'Official', questions: { create: { orderIndex: 1, text: 'Official question' } } } });
  assert.equal(await forms.canEditTemplate(official.id, owner), false);
  await denied(() => forms.deleteTemplate(owner, official.id));
  const copy = await forms.copyTemplate(outsider, 'Copy author', official.id);
  const copied = await db.template.findUniqueOrThrow({ where: { id: copy.id } });
  assert.equal(copied.ownerId, outsider); assert.equal(copied.ownerType, 'USER'); assert.equal(copied.sourceId, official.id);
  const publicTemplate = await forms.template(template.id); assert.equal('ownerId' in publicTemplate, false);
});

test('owner and template author gain no result privilege; invitation alone contains no completed qualification', async () => {
  await denied(() => forms.matrix(form.id, actor(owner)), 'resultsLocked');
  await denied(() => forms.matrix(form.id, actor(outsider)));
  await denied(() => forms.access(form.id, guest));
  const access = await forms.questions(form.id, guest, await invitation(form.id));
  assert.equal(access.canResults, false); assert.equal(access.questions.length, 20);
  const authoredForm = await forms.generateForm(outsider, template.id);
  await denied(() => forms.management(authoredForm.id, owner));
  await denied(() => forms.matrix(authoredForm.id, actor(owner)));
  const management = await forms.management(form.id, owner);
  assert.equal('answers' in management, false); assert.equal(management.submissions.length, 0);
  await denied(() => forms.management(form.id, outsider));
  await denied(async () => forms.renewResults(form.id, guest, await invitation(form.id)), 'resultsLocked');
});

let loggedSubmission, guestSubmission, guestActor;
test('full submission, duplicate nicknames and server-verified guest proof; retries are idempotent', async () => {
  loggedSubmission = await submission(form.id, actor(participant));
  const replay = await forms.submit(form.id, actor(participant), loggedSubmission.input); assert.equal(replay.id, loggedSubmission.result.id);
  await denied(() => forms.submit(form.id, actor(participant), { ...loggedSubmission.input, nickname: 'Changed' }), 'submitConflict');
  await denied(() => forms.submit(form.id, actor(outsider), loggedSubmission.input), 'submitConflict');
  await denied(() => forms.submit(form.id, actor(participant), { ...loggedSubmission.input, requestKey: randomUUID() }), 'alreadySubmitted');
  guestSubmission = await submission(form.id, guest); guestActor = { userId: null, guestToken: guestSubmission.result.guestToken };
  assert.equal(guestSubmission.result.guestToken.length, 43);
  assert.ok(Math.abs(guestSubmission.result.guestExpiresAt.getTime() - Date.now() - guestLifetime * 1000) < 3000);
  const recovered = await forms.submit(form.id, guest, guestSubmission.input); assert.equal(recovered.guestToken, guestActor.guestToken);
  const matrix = await forms.matrix(form.id, guestActor); assert.equal(matrix.participants.length, 2); assert.equal(matrix.participants[0].nickname, matrix.participants[1].nickname);
  await denied(() => forms.matrix(form.id, { userId: null, guestToken: 'x'.repeat(43) }));
  await denied(() => forms.matrix(other.id, guestActor));
  const retained = await submission(other.id, guestActor); assert.equal(retained.result.guestToken, guestActor.guestToken);
  assert.equal((await forms.matrix(form.id, guestActor)).participants.length, 2);
  assert.equal((await forms.matrix(other.id, guestActor)).participants.length, 1);
  // A logged-in actor can retain browser guest access, but no answer is adopted.
  assert.equal((await forms.matrix(form.id, { ...guestActor, userId: outsider })).participants.length, 2);
  assert.equal(await db.submission.count({ where: { userId: outsider } }), 0);
  await denied(() => forms.matrix(form.id, actor(outsider)));
});

test('replacing all 20 template questions preserves existing form snapshots, question IDs and answers', async () => {
  const before = await forms.matrix(form.id, actor(participant));
  const changed = await forms.updateTemplate(owner, template.id, { title: 'Updated', questions: ['New question'], updatedAt: template.updatedAt.toISOString() });
  assert.equal(changed.questions.length, 1); assert.ok(!template.questions.some(q => q.id === changed.questions[0].id));
  assert.deepEqual(await forms.matrix(form.id, actor(participant)), before);
  assert.equal((await forms.questions(other.id, actor(owner))).questions.length, 20);
  const newer = await forms.generateForm(owner, template.id); assert.equal((await forms.questions(newer.id, actor(owner))).questions.length, 1);
  await denied(() => forms.updateTemplate(owner, template.id, { ...templateInput, updatedAt: template.updatedAt.toISOString() }), 'surveyChanged');
  await forms.deleteTemplate(owner, template.id); assert.equal(await forms.template(template.id), null);
  assert.deepEqual(await forms.matrix(form.id, actor(participant)), before);
  assert.equal((await forms.templates()).some(row => row.id === template.id), false);
});

test('incomplete, duplicate, foreign or invalid answers fail atomically; two concurrent submits produce one submission', async () => {
  const questions = await db.formQuestion.findMany({ where: { formId: other.id } });
  const answers = questions.map(q => ({ questionId: q.id, value: 'no' }));
  const input = { nickname: 'Same name', requestKey: randomUUID(), invite: await invitation(other.id), answers };
  for (const bad of [answers.slice(1), answers.map(() => answers[0]), [{ questionId: randomUUID(), value: 'yes' }, ...answers.slice(1)], answers.map(a => ({ ...a, value: 'evil' }))]) await denied(() => forms.submit(other.id, actor(participant), { ...input, answers: bad }), 'answersMismatch');
  assert.equal(await db.submission.count({ where: { formId: other.id, userId: participant } }), 0);
  const results = await Promise.all([forms.submit(other.id, actor(participant), input), forms.submit(other.id, actor(participant), input)]);
  assert.equal(results[0].id, results[1].id); assert.equal(await db.submission.count({ where: { formId: other.id, userId: participant } }), 1);
  assert.equal(formSchemas().management.safeParse({ action: 'metadata', title: 'Changed', questions: [], updatedAt: new Date().toISOString() }).success, false);
  await denied(() => manage(form.id, 'deleteSubmission'), 'invalidInput');
  const third = await forms.generateForm(owner, (await forms.templates())[0].id);
  const guestQuestions = await db.formQuestion.findMany({ where: { formId: third.id } });
  const guestInput = { nickname: 'Same name', requestKey: randomUUID(), invite: await invitation(third.id), answers: guestQuestions.map(q => ({ questionId: q.id, value: 'yes' })) };
  const guestRetries = await Promise.all([forms.submit(third.id, guest, guestInput), forms.submit(third.id, guest, guestInput)]);
  assert.equal(guestRetries[0].id, guestRetries[1].id); assert.equal(guestRetries[0].guestToken, guestRetries[1].guestToken);
  assert.equal(await db.submission.count({ where: { formId: third.id } }), 1);
  await assert.rejects(pool.query('UPDATE boundary_form_questions SET text=$1 WHERE form_id=$2', ['Mutated', form.id]), /immutable/);
  await assert.rejects(pool.query('UPDATE boundary_submission_answers SET value=$1 WHERE submission_id=$2', ['no', loggedSubmission.result.id]), /immutable/);
  await assert.rejects(pool.query('UPDATE boundary_submissions SET nickname=$1 WHERE id=$2', ['Changed', loggedSubmission.result.id]), /immutable/);
});

test('close keeps completed results; reset revokes old links and proofs, new link restores only completed participants', async () => {
  await manage(form.id, 'close'); await denied(() => submission(form.id, actor(outsider)), 'formClosed');
  assert.equal((await forms.matrix(form.id, actor(participant))).participants.length, 2);
  const oldInvite = await invitation(form.id); await manage(form.id, 'reset'); const newInvite = await invitation(form.id); assert.notEqual(newInvite, oldInvite);
  await denied(() => forms.access(form.id, guest, oldInvite));
  await denied(() => forms.matrix(form.id, actor(participant))); await denied(() => forms.matrix(form.id, guestActor));
  await denied(() => forms.renewResults(form.id, actor(outsider), newInvite), 'resultsLocked');
  await denied(() => forms.renewResults(form.id, actor(participant), oldInvite));
  await forms.renewResults(form.id, actor(participant), newInvite); await forms.renewResults(form.id, guestActor, newInvite);
  assert.equal((await forms.matrix(form.id, actor(participant))).participants.length, 2); assert.equal((await forms.matrix(form.id, guestActor)).participants.length, 2);
  await manage(form.id, 'open');
});

test('deleting a submission revokes access and permits resubmission; removing a form does not affect other forms', async () => {
  await manage(form.id, 'deleteSubmission', { submissionId: loggedSubmission.result.id });
  await denied(() => forms.matrix(form.id, actor(participant)));
  await submission(form.id, actor(participant));
  assert.equal((await forms.matrix(form.id, actor(participant))).participants.length, 2);
  await manage(other.id, 'delete'); assert.equal(await db.fillableForm.findUnique({ where: { id: other.id } }), null);
  assert.equal((await forms.matrix(form.id, actor(participant))).participants.length, 2);
});

test('expired guest cookies deny results and a fresh completed guest session can be issued; RLS blocks browser roles', async () => {
  await db.guestSession.update({ where: { tokenHash: hashToken(guestActor.guestToken) }, data: { expiresAt: new Date(Date.now() - 1000) } });
  await denied(() => forms.matrix(form.id, guestActor));
  const fresh = await submission(form.id, guestActor); assert.notEqual(fresh.result.guestToken, guestActor.guestToken);
  assert.equal((await forms.matrix(form.id, { userId: null, guestToken: fresh.result.guestToken })).participants.length, 3);
  const client = await pool.connect();
  try { await client.query('BEGIN'); await client.query('SET LOCAL ROLE anon'); await assert.rejects(client.query('SELECT * FROM boundary_submission_answers'), /permission denied/); await client.query('ROLLBACK');
    await client.query('BEGIN'); await client.query('GRANT SELECT ON boundary_submission_answers TO anon'); await client.query('SET LOCAL ROLE anon'); assert.equal((await client.query('SELECT * FROM boundary_submission_answers')).rowCount, 0); await client.query('ROLLBACK');
  } finally { client.release(); }
  assert.equal((await pool.query('SELECT count(*)::int AS count FROM surveys')).rows[0].count, legacyCount);
});
