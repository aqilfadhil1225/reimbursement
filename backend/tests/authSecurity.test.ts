import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import test from 'node:test';
import express from 'express';
import { getJwtSecret } from '../src/config';
import authRateLimit from '../src/middleware/authRateLimit';
import { isTrustedOrigin } from '../src/middleware/requireTrustedOrigin';

test('requires a JWT secret with at least 32 bytes', () => {
  const previousSecret = process.env.JWT_SECRET;

  try {
    delete process.env.JWT_SECRET;
    assert.throws(() => getJwtSecret(), /at least 32 bytes/);

    process.env.JWT_SECRET = 'x'.repeat(31);
    assert.throws(() => getJwtSecret(), /at least 32 bytes/);

    const secret = randomBytes(32).toString('hex');
    process.env.JWT_SECRET = secret;
    assert.equal(getJwtSecret(), secret);
  } finally {
    if (previousSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = previousSecret;
    }
  }
});

test('allows only configured origins for cookie-authenticated writes', () => {
  assert.equal(isTrustedOrigin('http://localhost:3000'), true);
  assert.equal(isTrustedOrigin('https://untrusted.example'), false);
  assert.equal(isTrustedOrigin(undefined), false);
});

test('rate limits authentication endpoints after ten attempts per window', async () => {
  const app = express();
  app.post('/auth', authRateLimit, (_req, res) => res.sendStatus(204));
  const server = createServer(app);

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const responses: Response[] = [];

    for (let attempt = 0; attempt < 11; attempt += 1) {
      responses.push(await fetch(`http://127.0.0.1:${address.port}/auth`, { method: 'POST' }));
    }

    assert.ok(responses.slice(0, 10).every((response) => response.status === 204));
    assert.equal(responses[10].status, 429);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
