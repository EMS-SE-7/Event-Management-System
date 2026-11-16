const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const request = require('supertest');
const serveClient = require('../src/serveClient');

function buildApp(distDir) {
  const app = express();
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  const served = serveClient(app, distDir);
  app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND' } }));
  return { app, served };
}

describe('serveClient (production static hosting)', () => {
  let dist;

  beforeAll(() => {
    dist = fs.mkdtempSync(path.join(os.tmpdir(), 'ems-dist-'));
    fs.writeFileSync(path.join(dist, 'index.html'), '<!doctype html><div id="root"></div>');
    fs.mkdirSync(path.join(dist, 'assets'));
    fs.writeFileSync(path.join(dist, 'assets', 'app.js'), 'console.log(1)');
  });

  afterAll(() => fs.rmSync(dist, { recursive: true, force: true }));

  test('serves index.html at the root', async () => {
    const { app, served } = buildApp(dist);
    expect(served).toBe(true);
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('id="root"');
  });

  test('serves built assets', async () => {
    const { app } = buildApp(dist);
    const res = await request(app).get('/assets/app.js');
    expect(res.status).toBe(200);
    expect(res.text).toContain('console.log');
  });

  test('falls back to index.html for client-side routes', async () => {
    const { app } = buildApp(dist);
    const res = await request(app).get('/events/123');
    expect(res.status).toBe(200);
    expect(res.text).toContain('id="root"');
  });

  test('leaves /api routes to the API, including unknown ones', async () => {
    const { app } = buildApp(dist);
    expect((await request(app).get('/api/health')).body.status).toBe('ok');
    expect((await request(app).get('/api/does-not-exist')).status).toBe(404);
    expect((await request(app).get('/api')).status).toBe(404);
  });

  test('serves the API only when there is no client build', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { app, served } = buildApp(path.join(dist, 'missing'));
    expect(served).toBe(false);
    expect((await request(app).get('/')).status).toBe(404);
    warn.mockRestore();
  });
});
