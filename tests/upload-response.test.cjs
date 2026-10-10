const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const ts = require('typescript');

const source = readFileSync(`${__dirname}/../src/lib/upload-response.ts`, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const moduleExports = {};
new Function('exports', compiled)(moduleExports);
const { readUploadResponse } = moduleExports;

test('plain-text size rejection gives an actionable error', async () => {
  await assert.rejects(
    readUploadResponse(new Response('Request Entity Too Large', { status: 413 })),
    /exceeds the server upload limit/
  );
});

test('HTML and empty responses do not leak JSON parser errors', async () => {
  for (const body of ['<html>Bad Gateway</html>', '']) {
    await assert.rejects(
      readUploadResponse(new Response(body, { status: 502 })),
      /invalid response \(HTTP 502\)/
    );
  }
});

test('JSON failures preserve the API error', async () => {
  await assert.rejects(
    readUploadResponse(Response.json({ success: false, error: 'Storage unavailable' }, { status: 500 })),
    /Storage unavailable/
  );
});

test('successful responses preserve per-file failures for the uploader', async () => {
  const data = { success: true, processedCount: 0, errors: [{ filename: 'photo.jpg', error: 'Failed' }] };
  assert.deepEqual(await readUploadResponse(Response.json(data)), data);
});

test('invalid JSON payload shapes fail cleanly', async () => {
  await assert.rejects(readUploadResponse(Response.json(null)), /Upload request failed/);
});
