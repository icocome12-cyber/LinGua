const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const app = require('../src/app');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('serves the original landing page at the root', async () => {
  const response = await fetch(baseUrl);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Opening LinGua/);
});

test('serves original screens at friendly routes', async () => {
  const response = await fetch(`${baseUrl}/learn`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /<title>Learn — LinGua<\/title>/);
});

test('keeps original screen and image paths available', async () => {
  const pageResponse = await fetch(
    `${baseUrl}/lingua_home_stage_map_stage_1_alphabet_elevated/code.html`
  );
  const imageResponse = await fetch(
    `${baseUrl}/lingua_home_stage_map_stage_1_alphabet_elevated/screen.png`
  );

  assert.equal(pageResponse.status, 200);
  assert.equal(imageResponse.status, 200);
  assert.match(imageResponse.headers.get('content-type'), /image\/png/);
});

test('reports application health', async () => {
  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: 'ok',
    aiAvailable: Boolean(process.env.GEMINI_API_KEY)
  });
});

test('asks Gemini for a tutor response without exposing the API key', async () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.GEMINI_API_KEY;
  let geminiRequest;
  process.env.GEMINI_API_KEY = 'test-key';

  global.fetch = async (url, options) => {
    geminiRequest = { url: String(url), options };
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'Akwaaba means welcome.' }] } }]
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };

  try {
    const response = await originalFetch(`${baseUrl}/api/tutor`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'What does Akwaaba mean?', language: 'twi' })
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { reply: 'Akwaaba means welcome.' });
    assert.equal(geminiRequest.options.headers['x-goog-api-key'], 'test-key');
    assert.equal(geminiRequest.url.includes('test-key'), false);
  } finally {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalApiKey;
  }
});

test('validates tutor messages before sending them to Gemini', async () => {
  const response = await fetch(`${baseUrl}/api/tutor`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: '   ', language: 'twi' })
  });

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /Message must contain/);
});

test('reports when Gemini has not been configured', async () => {
  const originalApiKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const response = await fetch(`${baseUrl}/api/tutor`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Help me practice.', language: 'twi' })
    });

    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /GEMINI_API_KEY/);
  } finally {
    if (originalApiKey !== undefined) process.env.GEMINI_API_KEY = originalApiKey;
  }
});

test('returns 404 for unknown pages', async () => {
  const response = await fetch(`${baseUrl}/not-a-page`);

  assert.equal(response.status, 404);
  assert.equal(await response.text(), 'Page not found');
});
