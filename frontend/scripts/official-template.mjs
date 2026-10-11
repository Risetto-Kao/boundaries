// Trusted operator tool, not an HTTP endpoint. Explicit target and confirmation
// prevent accidental use of the app's runtime/production environment settings.
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
const [command, file, expectedHost] = process.argv.slice(2);
if (!['create', 'update', 'retire'].includes(command) || !file || !expectedHost || !process.env.BOUNDARIES_ADMIN_DATABASE_URL) throw new Error('Usage: BOUNDARIES_ADMIN_DATABASE_URL=... node scripts/official-template.mjs create|update|retire file.json exact-hostname');
let url; try { url = new URL(process.env.BOUNDARIES_ADMIN_DATABASE_URL); } catch { throw new Error("Invalid operator database URL"); }
if (url.hostname !== expectedHost) throw new Error('Database host does not match confirmation');
const data = JSON.parse(readFileSync(file, 'utf8'));
if (command !== 'retire' && (typeof data.title !== 'string' || !data.title.trim() || data.title.length > 200 || !Array.isArray(data.questions) || data.questions.length < 1 || data.questions.length > 20 || data.questions.some(q => typeof q !== 'string' || !q.trim()) || (data.description !== undefined && (typeof data.description !== 'string' || data.description.length > 1000)))) throw new Error('Invalid template content');
if (command !== 'create' && (typeof data.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(data.id))) throw new Error('An official template ID is required');
const client = new pg.Client({ connectionString: url.href });
try {
  await client.connect(); await client.query('BEGIN'); const id = command === 'create' ? randomUUID() : data.id;
  if (command === 'create') await client.query("INSERT INTO boundary_templates(id,owner_type,title,description,updated_at) VALUES ($1,'OFFICIAL',$2,$3,now())", [id, data.title.trim(), data.description?.trim() || null]);
  else {
    const existing = await client.query("SELECT id FROM boundary_templates WHERE id=$1 AND owner_type='OFFICIAL' AND deleted_at IS NULL FOR UPDATE", [id]);
    if (existing.rowCount !== 1) throw new Error('Active official template not found');
    if (command === 'retire') await client.query('UPDATE boundary_templates SET deleted_at=now(),updated_at=now() WHERE id=$1', [id]);
    else { await client.query('UPDATE boundary_templates SET title=$2,description=$3,updated_at=now() WHERE id=$1', [id, data.title.trim(), data.description?.trim() || null]); await client.query('DELETE FROM boundary_template_questions WHERE template_id=$1', [id]); }
  }
  if (command !== 'retire') await client.query('INSERT INTO boundary_template_questions(id,template_id,order_index,text) SELECT item.id,$1,item.position,item.text FROM jsonb_to_recordset($2::jsonb) AS item(id text,position integer,text text)', [id, JSON.stringify(data.questions.map((text, index) => ({ id: randomUUID(), position: index + 1, text: text.trim() })))]);
  await client.query('COMMIT'); console.log(`Official template ${command} complete: ${id}`);
} catch (error) { await client.query('ROLLBACK').catch(() => {}); console.error('Official template operation failed', error instanceof Error ? error.name : 'unknown'); process.exitCode = 1; }
finally { await client.end(); }
