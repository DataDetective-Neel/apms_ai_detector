const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const ts = require('typescript');
const source = readFileSync(`${__dirname}/../src/lib/upload-ticket.ts`, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const moduleExports = {};
new Function('exports', 'require', compiled)(moduleExports, require);
const { signUploadTicket, verifyUploadTicket } = moduleExports;
process.env.SUPABASE_SECRET_KEY = 'test-only-secret';
const ticket = { path: 'pending/test/photo.jpg', name: 'photo.jpg', type: 'image/jpeg', size: 6 * 1024 * 1024, expires: Date.now() + 60000 };

test('large original metadata survives ticket signing', () => {
  assert.deepEqual(verifyUploadTicket(signUploadTicket(ticket)), ticket);
});

test('tampered paths and signatures are rejected', () => {
  const signed = signUploadTicket(ticket);
  const payload = Buffer.from(JSON.stringify({ ...ticket, path: 'originals/private.jpg' })).toString('base64url');
  assert.throws(() => verifyUploadTicket(`${payload}.${signed.split('.')[1]}`), /Invalid upload ticket/);
  assert.throws(() => verifyUploadTicket(`${signed}extra`), /Invalid upload ticket/);
});

test('expired and malformed tickets are rejected', () => {
  assert.throws(() => verifyUploadTicket(signUploadTicket({ ...ticket, expires: 0 })), /Upload expired/);
  assert.throws(() => verifyUploadTicket('bad'), /Invalid upload ticket/);
});

test('analysis route retrieves a 6MB original from a small JSON request and cleans staging', async () => {
  const original = Buffer.alloc(ticket.size, 7);
  let processed;
  let removed;
  const routeSource = readFileSync(`${__dirname}/../src/app/api/batch-upload/route.ts`, 'utf8');
  const routeCompiled = ts.transpileModule(routeSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const routeExports = {};
  const mocks = {
    '@/lib/upload-ticket': moduleExports,
    '@/lib/supabase/db': { db: { getAllEntries: async () => [] } },
    '@/lib/queue/job-queue': { processPhotographUpload: async (options) => {
      processed = options;
      return { entry: { id: options.entryId } };
    } },
    '@/lib/supabase/server': { supabaseAdmin: { storage: { from: () => ({
      download: async () => ({ data: new Blob([original]) }),
      remove: async (paths) => { removed = paths; return {}; },
    }) } } },
  };
  new Function('exports', 'require', routeCompiled)(routeExports, (name) => mocks[name] || require(name));
  const requestBody = JSON.stringify({ ticket: signUploadTicket(ticket), participantName: 'Test', category: 'General' });
  assert.ok(Buffer.byteLength(requestBody) < 1024);
  const response = await routeExports.POST(new Request('http://localhost/api/batch-upload', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: requestBody,
  }));
  assert.equal((await response.json()).processedCount, 1);
  assert.deepEqual(processed.fileBuffer, original);
  assert.equal(processed.originalFilename, ticket.name);
  assert.deepEqual(removed, [ticket.path]);
});
