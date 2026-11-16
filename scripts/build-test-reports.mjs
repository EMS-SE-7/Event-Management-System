#!/usr/bin/env node
// Builds the test documents in docs/ from the latest test run:
//   docs/Unit_Test_Report.pdf, docs/Integration_Test_Report.pdf, docs/System_Test_Report.pdf,
//   docs/Code_and_Branch_Coverage_Report.pdf, plus their Markdown sources, line-by-line HTML
//   coverage and raw results in docs/test-reports/.
// Run scripts/generate-test-reports.sh, which runs every test suite first and then this file.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.join(root, 'docs');
const outDir = path.join(docsDir, 'test-reports');
const fromSystemTests = createRequire(path.join(root, 'system-tests', 'package.json'));

const SOURCES = {
  server: path.join(root, 'server', 'coverage'),
  client: path.join(root, 'client', 'coverage'),
  system: path.join(root, 'system-tests', 'results'),
};

// Requirement IDs and features from section 3 of the Test Plan (docs/Test_Plan.pdf).
const PLAN_FEATURES = [
  ['AUTH-01', 'Registered user sign-in'],
  ['AUTH-05', 'Role-based access control for students and organizers'],
  ['AUTH-06', 'Prevent students from accessing organizer-only functionality'],
  ['AUTH-07', 'Reject invalid login credentials'],
  ['EVENT-01', 'Organizer creates an event'],
  ['EVENT-02', 'Validate mandatory event information'],
  ['EVENT-05', 'Organizer cancels an event they manage'],
  ['EVENT-07', 'Prevent unauthorized event modification'],
  ['EVENT-08', 'Reject invalid event dates and capacity values'],
  ['DISC-01', 'Browse available events'],
  ['DISC-02', 'Search for available events'],
  ['REG-01', 'Authenticated student registers for an event'],
  ['REG-03', 'Prevent duplicate registration'],
  ['REG-04', 'Prevent registration after the registration deadline'],
  ['REG-05', 'Prevent registration when event capacity is reached'],
  ['HIST-01', 'Student views registration history'],
  ['PART-01', 'Organizer views registered participants'],
  ['ATT-01', 'Organizer marks attendance'],
  ['ATT-03', 'Store attendance information'],
  ['STATUS-02', 'Detect when event capacity is reached'],
  ['STATUS-03', 'Prevent registration for full events'],
  ['REP-01', 'Generate registration statistics'],
  ['REP-03', 'Display total registration information'],
  ['PERF-01', 'NFR Performance: API response time of 2 seconds or less'],
  ['SEC-01', 'NFR Security: password protection'],
];

const MODULES = {
  AUTH: 'Authentication and Role Management',
  EVENT: 'Event Creation and Management',
  DISC: 'Event Discovery and Search',
  REG: 'Event Registration',
  HIST: 'Registration History',
  PART: 'Participation Management',
  ATT: 'Attendance',
  STATUS: 'Event Status and Capacity',
  REP: 'Reporting',
  PERF: 'Non-functional: Performance',
  SEC: 'Non-functional: Security',
  INFRA: 'Server set-up and hosting',
};

// Module for tests whose names carry no requirement ID, from the test file name.
const FILE_MODULES = [
  [/attendance/i, 'ATT'],
  [/report/i, 'REP'],
  [/auth|App\.test/i, 'AUTH'],
  [/eventStatus/i, 'STATUS'],
  [/event\.model|events\.(create|manage)|eventForm|CreateEvent|EditEvent|MyEvents/i, 'EVENT'],
  [/events\.read|BrowseEvents|EventDetails/i, 'DISC'],
  [/registrations/i, 'REG'],
  [/health|serveClient/i, 'INFRA'],
];

// Test levels. Server levels come from the Jest projects in server/package.json, client levels
// from the Vitest projects in client/vite.config.js; keep these in step with those files.
const LEVEL_RULES = {
  server: [
    [/^server\/tests\/unit\/|^server\/tests\/(eventStatus|event\.model|serveClient)\.test\.js$/, 'Unit'],
    [/./, 'Integration'],
  ],
  client: [
    [/^client\/src\/utils\//, 'Unit'],
    [/./, 'Integration'],
  ],
};

// ---------- helpers ----------
const readJson = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null);
const rel = (p) => path.relative(root, p).split(path.sep).join('/');
const ms = (n) => (n >= 1000 ? `${(n / 1000).toFixed(2)} s` : `${Math.round(n)} ms`);
const pct = (n, d) => (d ? `${((100 * n) / d).toFixed(1)}%` : 'n/a');
const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const RESULT = { passed: 'Pass', failed: 'Fail', skipped: 'Skipped', pending: 'Skipped', todo: 'Skipped' };
const sh = (cmd, fallback = 'unknown') => {
  try {
    return execSync(cmd, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return fallback;
  }
};
const pkgVersion = (dir, name) => {
  try {
    return createRequire(path.join(root, dir, 'package.json'))(`${name}/package.json`).version;
  } catch {
    return 'not installed';
  }
};

function requirementsOf(text) {
  const ids = new Set();
  const re = /\b(?:TC-)?(AUTH|EVENT|DISC|REG|HIST|PART|ATT|STATUS|REP|SEC|PERF)-(\d{2})(?:\s+to\s+(?:TC-)?\1-(\d{2}))?\b/g;
  for (const m of text.matchAll(re)) {
    const [from, to] = [Number(m[2]), Number(m[3] || m[2])];
    for (let n = from; n <= to; n += 1) ids.add(`${m[1]}-${String(n).padStart(2, '0')}`);
  }
  return [...ids];
}

function moduleOf(reqs, file) {
  if (reqs.length) return reqs[0].split('-')[0];
  const hit = FILE_MODULES.find(([re]) => re.test(file));
  return hit ? hit[1] : 'INFRA';
}

const table = (head, rows) =>
  [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.map(esc).join(' | ')} |`)].join('\n');

// ---------- collect results ----------
const cases = [];
const runs = {};

for (const part of ['server', 'client']) {
  const results = readJson(path.join(SOURCES[part], 'test-results.json'));
  if (!results) continue;
  runs[part] = results;
  for (const file of results.testResults) {
    const fileRel = rel(file.name);
    const level = LEVEL_RULES[part].find(([re]) => re.test(fileRel))[1];
    for (const a of file.assertionResults) {
      const reqs = requirementsOf(a.fullName);
      cases.push({
        part: part === 'server' ? 'Server' : 'Client',
        level,
        file: fileRel,
        title: a.fullName,
        status: RESULT[a.status] || a.status,
        duration: a.duration ?? 0,
        reqs,
        module: moduleOf(reqs, fileRel),
        failure: (a.failureMessages || []).join('\n'),
      });
    }
  }
}

const systemRun = readJson(path.join(SOURCES.system, 'test-results.json'));
if (systemRun) {
  const walk = (suite, file) => {
    for (const spec of suite.specs || []) {
      const t = spec.tests[0];
      const r = t.results[t.results.length - 1] || {};
      const reqs = requirementsOf(spec.title);
      cases.push({
        part: 'Full system',
        level: 'System',
        file: `system-tests/tests/${file}`,
        id: (spec.title.match(/TC-SYS-\d+/) || [''])[0],
        title: spec.title.replace(/^TC-SYS-\d+\s*(\([^)]*\))?:\s*/, '').replace(/^./, (ch) => ch.toUpperCase()),
        status: r.status === 'passed' ? 'Pass' : r.status === 'skipped' ? 'Skipped' : 'Fail',
        duration: r.duration ?? 0,
        reqs,
        module: moduleOf(reqs, file),
        steps: (r.steps || []).map((s) => s.title),
        notes: [...new Set([...(t.annotations || []), ...(r.annotations || [])].map((n) => n.description))],
        failure: (r.errors || []).map((e) => e.message).join('\n'),
      });
    }
    for (const child of suite.suites || []) walk(child, file);
  };
  for (const s of systemRun.suites) walk(s, s.file);
}

if (!cases.length) {
  console.error('No test results found. Run scripts/generate-test-reports.sh.');
  process.exit(1);
}

// Stable test case IDs per level: UT-001, IT-001; system tests keep their TC-SYS IDs.
for (const [level, prefix] of [['Unit', 'UT'], ['Integration', 'IT']]) {
  cases
    .filter((c) => c.level === level)
    .sort((a, b) => b.part.localeCompare(a.part) || a.file.localeCompare(b.file))
    .forEach((c, i) => (c.id = `${prefix}-${String(i + 1).padStart(3, '0')}`));
}

// ---------- shared document parts ----------
const commit = process.env.GITHUB_SHA || sh('git rev-parse HEAD');
const branch = process.env.GITHUB_REF_NAME || sh('git rev-parse --abbrev-ref HEAD');
// Code changes not yet committed (the generated docs themselves do not count).
const dirty = sh("git status --porcelain -- . ':!docs'", '') !== '';
const now = new Date();
const dateText = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
const versions = {
  node: process.version,
  jest: pkgVersion('server', 'jest'),
  supertest: pkgVersion('server', 'supertest'),
  mms: pkgVersion('server', 'mongodb-memory-server'),
  mongoose: pkgVersion('server', 'mongoose'),
  express: pkgVersion('server', 'express'),
  vitest: pkgVersion('client', 'vitest'),
  rtl: pkgVersion('client', '@testing-library/react'),
  react: pkgVersion('client', 'react'),
  playwright: pkgVersion('system-tests', '@playwright/test'),
};

function header(title, purpose) {
  return [
    `# ${title}`,
    '',
    '**Event Management System (PESU-EMS)**',
    '',
    table(
      ['Item', 'Detail'],
      [
        ['Project', 'Event Management System'],
        ['Team', 'Team 7 (Shayna Zaidi Gupta, Shaurya Ishan, Shriya C Rao, Sham Santosh)'],
        ['Date of test run', dateText],
        ['Build tested', `commit ${commit.slice(0, 7)} on branch ${branch}${dirty ? ', with uncommitted changes' : ''}`],
        ['References', 'Software Requirement Specification (SRS), Software Test Plan (STP), SASD'],
      ],
    ),
    '',
    '## 1. Purpose',
    '',
    purpose,
    '',
  ].join('\n');
}

function summaryRows(list) {
  const groups = {};
  for (const c of list) (groups[c.part] ||= []).push(c);
  const rows = Object.entries(groups).map(([part, cs]) => {
    const pass = cs.filter((c) => c.status === 'Pass').length;
    const fail = cs.filter((c) => c.status === 'Fail').length;
    return [part, new Set(cs.map((c) => c.file)).size, cs.length, pass, fail, cs.length - pass - fail, pct(pass, cs.length), ms(cs.reduce((s, c) => s + c.duration, 0))];
  });
  const pass = list.filter((c) => c.status === 'Pass').length;
  const fail = list.filter((c) => c.status === 'Fail').length;
  rows.push(['**Total**', new Set(list.map((c) => c.file)).size, list.length, pass, fail, list.length - pass - fail, pct(pass, list.length), ms(list.reduce((s, c) => s + c.duration, 0))]);
  return table(['Part', 'Test files', 'Test cases', 'Passed', 'Failed', 'Skipped', 'Pass rate', 'Test time'], rows);
}

function moduleRows(list) {
  const groups = {};
  for (const c of list) (groups[c.module] ||= []).push(c);
  return table(
    ['Module', 'Test cases', 'Passed', 'Failed'],
    Object.keys(MODULES)
      .filter((m) => groups[m])
      .map((m) => [MODULES[m], groups[m].length, groups[m].filter((c) => c.status === 'Pass').length, groups[m].filter((c) => c.status === 'Fail').length]),
  );
}

function caseTables(list) {
  const out = [];
  const files = [...new Set(list.map((c) => c.file))];
  for (const file of files) {
    const cs = list.filter((c) => c.file === file);
    out.push(`**${file}** (${MODULES[cs[0].module]})`, '');
    out.push(table(['ID', 'Test case', 'Requirement', 'Result', 'Time'], cs.map((c) => [c.id, c.title, c.reqs.join(', ') || '-', c.status, ms(c.duration)])), '');
  }
  return out.join('\n');
}

function defects(list) {
  const failed = list.filter((c) => c.status === 'Fail');
  if (!failed.length) return 'No test case failed in this run, so no defects were raised from it.';
  return failed.map((c) => `- **${c.id}** ${c.title} (\`${c.file}\`)\n\n  \`\`\`\n  ${c.failure.split('\n').slice(0, 6).join('\n  ')}\n  \`\`\``).join('\n');
}

function exitCriteria(list) {
  const failed = list.filter((c) => c.status === 'Fail').length;
  const skipped = list.filter((c) => c.status === 'Skipped').length;
  return table(
    ['Exit criterion (Test Plan section 5)', 'Status'],
    [
      ['All planned test cases at this level executed', skipped ? `Not met: ${skipped} skipped` : `Met: ${list.length} of ${list.length} executed`],
      ['No critical or high-severity defects open', failed ? `Not met: ${failed} failing test case(s)` : 'Met: no failing test cases'],
    ],
  );
}

function reproduce(commands) {
  return ['```bash', ...commands, '```'].join('\n');
}

const docs = {};

// ---------- Unit Test Report ----------
{
  const list = cases.filter((c) => c.level === 'Unit');
  docs.Unit_Test_Report = [
    header(
      'Unit Test Report',
      'This report records the results of unit testing, the first test level in the Test Plan (section 5, "Unit tests: module-level: Express route handlers, Mongoose schema validation"). A unit test checks one function, controller, model or utility on its own, with everything it depends on either replaced by a test double or kept to the minimum.',
    ),
    '## 2. Scope and approach',
    '',
    table(
      ['Unit under test', 'How it is isolated', 'Test files'],
      [
        ['Utility functions (event status, report statistics)', 'Pure functions called directly with prepared inputs, including boundary values (full event, zero registrations, missing capacity)', 'server/tests/eventStatus.test.js, server/tests/unit/reportStats.test.js'],
        ['Express controllers (attendance, reports)', 'Controller functions called with fake request and response objects; the Mongoose models are replaced with Jest mocks, so no database or HTTP is involved', 'server/tests/unit/attendanceController.test.js, server/tests/unit/reportController.test.js'],
        ['Mongoose schema validation (Event model)', "The model's validators run against a throwaway in-memory MongoDB, with no Express layer", 'server/tests/event.model.test.js'],
        ['Static hosting helper', 'A minimal Express app with a temporary folder in place of the real client build', 'server/tests/serveClient.test.js'],
        ['Client form helpers', 'Pure functions that convert between form values and the API payload', 'client/src/utils/eventForm.test.js'],
      ],
    ),
    '',
    'Techniques used: equivalence partitioning (valid and invalid inputs), boundary value analysis (capacity, dates, zero and full counts), and error-path testing (missing records, malformed ids, database failure).',
    '',
    '## 3. Test environment',
    '',
    table(
      ['Item', 'Value'],
      [
        ['Operating system', `${os.type()} ${os.release()} (also run on ubuntu-latest in GitHub Actions on every push)`],
        ['Runtime', `Node.js ${versions.node}`],
        ['Server test framework', `Jest ${versions.jest}, mongodb-memory-server ${versions.mms} (in-memory MongoDB), Mongoose ${versions.mongoose}`],
        ['Client test framework', `Vitest ${versions.vitest}`],
        ['Test data', 'Created inside each test and removed after it; no shared database'],
      ],
    ),
    '',
    '## 4. Summary of results',
    '',
    summaryRows(list),
    '',
    '### Results by module',
    '',
    moduleRows(list),
    '',
    '## 5. Test cases and results',
    '',
    caseTables(list),
    '## 6. Defects',
    '',
    defects(list),
    '',
    '## 7. Exit criteria',
    '',
    exitCriteria(list),
    '',
    '## 8. How to reproduce',
    '',
    reproduce(['cd server && npm ci && npm run test:unit', 'cd client && npm ci && npm run test:unit']),
    '',
  ].join('\n');
}

// ---------- Integration Test Report ----------
{
  const list = cases.filter((c) => c.level === 'Integration');
  docs.Integration_Test_Report = [
    header(
      'Integration Test Report',
      'This report records the results of integration testing, the second test level in the Test Plan (section 5, "Integration tests: React frontend - Express REST API; Express - MongoDB via Mongoose"). An integration test checks that several real components work together through their real interfaces.',
    ),
    '## 2. Scope and approach',
    '',
    table(
      ['Interface tested', 'What runs for real', 'Test files'],
      [
        ['Express REST API with MongoDB (auth, events, registrations, history, participants)', 'HTTP requests (Supertest) go through the real routes, JWT authentication middleware, role checks, controllers, Mongoose models and validation into an in-memory MongoDB', 'server/src/auth.test.js, server/src/health.test.js, server/tests/events.*.test.js, server/tests/registrations*.test.js'],
        ['Express REST API for attendance and reports', 'Real routes, middleware and controllers over HTTP; only the Mongoose model layer is mocked', 'server/tests/integration/*.test.js'],
        ['React pages with the API client', 'Real pages, React Router, login context and API module rendered in jsdom; the HTTP calls to the Express API are answered with recorded responses', 'client/src/**/*.test.jsx'],
      ],
    ),
    '',
    'Each server test file starts its own empty in-memory MongoDB, so results do not depend on the shared Atlas database.',
    '',
    '## 3. Test environment',
    '',
    table(
      ['Item', 'Value'],
      [
        ['Operating system', `${os.type()} ${os.release()} (also run on ubuntu-latest in GitHub Actions on every push)`],
        ['Runtime', `Node.js ${versions.node}`],
        ['Server', `Express ${versions.express}, Mongoose ${versions.mongoose}, Jest ${versions.jest}, Supertest ${versions.supertest}, mongodb-memory-server ${versions.mms}`],
        ['Client', `React ${versions.react}, Vitest ${versions.vitest}, React Testing Library ${versions.rtl}, jsdom`],
        ['Test data', 'Users, events and registrations created by each test through the models or the API'],
      ],
    ),
    '',
    '## 4. Summary of results',
    '',
    summaryRows(list),
    '',
    '### Results by module',
    '',
    moduleRows(list),
    '',
    '## 5. Test cases and results',
    '',
    caseTables(list),
    '## 6. Defects',
    '',
    defects(list),
    '',
    '## 7. Exit criteria',
    '',
    exitCriteria(list),
    '',
    '## 8. How to reproduce',
    '',
    reproduce(['cd server && npm ci && npm run test:integration', 'cd client && npm ci && npm run test:integration']),
    '',
  ].join('\n');
}

// ---------- System Test Report ----------
{
  const list = cases.filter((c) => c.level === 'System').sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  const timings = list.flatMap((c) => (c.notes || []).filter((n) => /ms$/.test(n)));
  const detail = list
    .map((c) =>
      [
        `### ${c.id}: ${c.title}`,
        '',
        table(
          ['Field', 'Detail'],
          [
            ['Requirement', c.reqs.join(', ') || '-'],
            ['Module', MODULES[c.module]],
            ['Test script', c.file],
            ['Result', `${c.status} (${ms(c.duration)})`],
          ],
        ),
        '',
        '**Steps and expected results**',
        '',
        ...(c.steps || []).map((s, i) => `${i + 1}. ${s}`),
        ...(c.notes || []).length ? ['', '**Measured**', '', ...c.notes.map((n) => `- ${n}`)] : [],
        '',
      ].join('\n'),
    )
    .join('\n');

  docs.System_Test_Report = [
    header(
      'System Test Report',
      'This report records the results of system testing, the third test level in the Test Plan (section 5, "System tests: end-to-end flows across modules, e.g. student registers - organizer views participant - organizer marks attendance"). System tests treat the application as a black box: a real web browser uses the finished product the way a student or organizer would, and the tests check only what the user sees and what the public API returns.',
    ),
    '## 2. System under test',
    '',
    'The complete application is started exactly as it runs when deployed: the production build of the React client, served by the Express server with `NODE_ENV=production`, connected to its own MongoDB database. The database starts empty for every run and is seeded with two organizer and two student accounts, so each run is repeatable.',
    '',
    table(
      ['Item', 'Value'],
      [
        ['Browser', `Chromium (desktop), driven by Playwright ${versions.playwright}`],
        ['Front end', `Production build of the React ${versions.react} client (vite build)`],
        ['Back end', `Express ${versions.express} on Node.js ${versions.node}, NODE_ENV=production`],
        ['Database', `Fresh MongoDB started by mongodb-memory-server ${versions.mms}, seeded by system-tests/test-server.js`],
        ['Test accounts', '2 organizers, 2 students (system-tests/tests/accounts.js); one more student signs up during the run'],
        ['Operating system', `${os.type()} ${os.release()} (also run on ubuntu-latest in GitHub Actions on every push)`],
      ],
    ),
    '',
    '## 3. Test types covered',
    '',
    table(
      ['Type (Test Plan section 5)', 'System test cases'],
      [
        ['Functional', list.filter((c) => !['PERF', 'SEC'].includes(c.module)).map((c) => c.id).join(', ')],
        ['Performance (TC-PERF-01)', list.filter((c) => c.module === 'PERF').map((c) => c.id).join(', ') || '-'],
        ['Security validation (section 5.1, TC-SEC-01)', list.filter((c) => c.module === 'SEC' || c.reqs.includes('AUTH-06')).map((c) => c.id).join(', ') || '-'],
        ['Regression', 'All of the above run automatically on every push and pull request (GitHub Actions)'],
      ],
    ),
    '',
    'The main flow (TC-SYS-07 to TC-SYS-16) runs in order on the same event: an organizer creates it, a student finds it and registers, the organizer sees the participant, marks attendance and reads the report, then cancels the event.',
    '',
    '## 4. Summary of results',
    '',
    summaryRows(list),
    '',
    table(
      ['ID', 'Test case', 'Requirement', 'Result', 'Time'],
      list.map((c) => [c.id, c.title, c.reqs.join(', ') || '-', c.status, ms(c.duration)]),
    ),
    '',
    ...(timings.length ? ['**Performance measurements (TC-SYS-18)**', '', ...timings.map((t) => `- ${t}`), ''] : []),
    '## 5. Test case details',
    '',
    detail,
    '## 6. Defects',
    '',
    defects(list),
    '',
    '## 7. Exit criteria',
    '',
    exitCriteria(list),
    '',
    '## 8. How to reproduce',
    '',
    reproduce(['npm ci --prefix server && npm ci --prefix client && npm run build --prefix client', 'cd system-tests && npm ci && npx playwright install chromium', 'npm test']),
    '',
  ].join('\n');
}

// ---------- Code & Branch Coverage Report ----------
function lineRanges(lines) {
  const sorted = [...new Set(lines)].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i += 1) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j += 1;
    out.push(i === j ? `${sorted[i]}` : `${sorted[i]}-${sorted[j]}`);
    i = j;
  }
  return out.join(', ');
}

function uncovered(finalJson) {
  const result = {};
  for (const [file, d] of Object.entries(finalJson || {})) {
    const stmt = Object.entries(d.s).filter(([, n]) => n === 0).map(([k]) => d.statementMap[k]?.start?.line).filter(Boolean);
    const br = [];
    for (const [k, counts] of Object.entries(d.b)) {
      counts.forEach((n, i) => {
        const line = d.branchMap[k].locations?.[i]?.start?.line ?? d.branchMap[k].loc?.start?.line;
        if (n === 0 && line) br.push(line);
      });
    }
    result[path.resolve(file)] = { lines: lineRanges(stmt), branches: lineRanges(br) };
  }
  return result;
}

{
  const parts = [];
  for (const part of ['server', 'client']) {
    const summary = readJson(path.join(SOURCES[part], 'coverage-summary.json'));
    if (!summary) continue;
    parts.push({ part, summary, gaps: uncovered(readJson(path.join(SOURCES[part], 'coverage-final.json'))) });
  }
  const m = (x) => `${x.pct.toFixed(2)}% (${x.covered}/${x.total})`;
  const totals = parts.map(({ part, summary: { total: t } }) => [part === 'server' ? 'Server (Express API)' : 'Client (React)', m(t.statements), m(t.branches), m(t.functions), m(t.lines)]);
  const sum = (key) => parts.reduce((a, p) => ({ covered: a.covered + p.summary.total[key].covered, total: a.total + p.summary.total[key].total }), { covered: 0, total: 0 });
  const comb = (key) => {
    const s = sum(key);
    return `${((100 * s.covered) / s.total).toFixed(2)}% (${s.covered}/${s.total})`;
  };
  if (parts.length > 1) totals.push(['**Whole code base**', comb('statements'), comb('branches'), comb('functions'), comb('lines')]);

  const perFile = parts
    .map(({ part, summary, gaps }) => {
      const rows = Object.entries(summary)
        .filter(([k]) => k !== 'total')
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([file, x]) => [`\`${rel(file).replace(/^(server|client)\//, '')}\``, `${x.statements.pct.toFixed(1)}%`, `${x.branches.pct.toFixed(1)}%`, `${x.functions.pct.toFixed(1)}%`, `${x.lines.pct.toFixed(1)}%`, gaps[path.resolve(file)]?.branches || '-']);
      return [`### ${part === 'server' ? 'Server' : 'Client'}`, '', table([`File (in ${part}/)`, 'Statements', 'Branches', 'Functions', 'Lines', 'Lines with an untaken branch'], rows), ''].join('\n');
    })
    .join('\n');

  const low = parts.flatMap(({ part, summary }) =>
    Object.entries(summary)
      .filter(([k, x]) => k !== 'total' && x.branches.total > 0 && x.branches.pct < 50)
      .map(([file, x]) => [rel(file), `${x.branches.pct.toFixed(1)}%`, part]),
  );

  docs.Code_and_Branch_Coverage_Report = [
    header(
      'Code & Branch Coverage Report',
      'This report measures how much of the source code the automated unit and integration tests execute. It supports the Test Plan metrics in section 14 and shows which parts of the code still need tests.',
    ),
    '## 2. Coverage measures',
    '',
    table(
      ['Measure', 'Meaning'],
      [
        ['Statement coverage', 'Share of executable statements run at least once by the tests'],
        ['Branch coverage', 'Share of decision outcomes taken: both sides of every if/else, each case of a ternary (a ? b : c), and the short-circuit outcomes of &&, || and ??'],
        ['Function coverage', 'Share of functions called at least once'],
        ['Line coverage', 'Share of source lines with at least one statement run'],
      ],
    ),
    '',
    'Code coverage is the statement and line figures; branch coverage is the stricter measure, because a line can run while one of its decision outcomes never happens.',
    '',
    '## 3. Tools and method',
    '',
    table(
      ['Part', 'Tool', 'Tests measured', 'Files measured'],
      [
        ['Server', `Jest ${versions.jest} with the Istanbul (babel-plugin-istanbul) instrumenter`, 'All server unit and integration tests', 'server/src/**/*.js, except test files and the seed scripts in src/scripts/ (one-off command-line tools)'],
        ['Client', `Vitest ${versions.vitest} with the V8 coverage provider`, 'All client unit and integration tests', 'client/src/**/*.{js,jsx}, except test files, src/test/ helpers, src/main.jsx (the browser entry point) and src/api/mock*.js (sample data used only when VITE_USE_MOCK=true during development)'],
      ],
    ),
    '',
    'System tests run in a real browser against the production build and are not instrumented, so they are not counted here. Several client pages with low coverage below (attendance, reports, participants, registration history, sign-up) are exercised end to end by the system tests (see the System Test Report).',
    '',
    '## 4. Overall coverage',
    '',
    table(['Part', 'Statements', 'Branches', 'Functions', 'Lines'], totals),
    '',
    '## 5. Coverage by file',
    '',
    'The last column lists the source lines that contain a branch outcome no test takes. Open `docs/test-reports/coverage-html/server/index.html (or client)` in a browser to see every line highlighted.',
    '',
    perFile,
    '## 6. Gaps and recommendations',
    '',
    low.length
      ? ['Files with branch coverage below 50%:', '', table(['File', 'Branch coverage', 'Part'], low), ''].join('\n')
      : 'Every file has at least 50% branch coverage.',
    '',
    '- `server/src/index.js` lines that start the database connection and listen on a port run only when the server is started directly, never under test.',
    '- `server/src/config/db.js` is used only by the seed scripts, which are not run by the tests.',
    '- Client pages without their own component tests should get React Testing Library tests in the next sprint; until then the system tests cover their main paths.',
    '',
    '## 7. How to reproduce',
    '',
    reproduce(['cd server && npm ci && npm run test:ci   # writes server/coverage/', 'cd client && npm ci && npm run test:ci   # writes client/coverage/']),
    '',
  ].join('\n');
}

// ---------- index with every level and the traceability matrix ----------
{
  const levelCount = (level) => {
    const l = cases.filter((c) => c.level === level);
    return [l.length, l.filter((c) => c.status === 'Pass').length];
  };
  const [u, up] = levelCount('Unit');
  const [it, ip] = levelCount('Integration');
  const [st, sp] = levelCount('System');
  const trace = PLAN_FEATURES.map(([id, name]) => {
    const hits = cases.filter((c) => c.reqs.includes(id));
    const by = (lvl) => hits.filter((c) => c.level === lvl).length || '-';
    const status = !hits.length ? 'No automated test' : hits.every((c) => c.status === 'Pass') ? 'Pass' : 'Fail';
    return [id, name, by('Unit'), by('Integration'), by('System'), status];
  });

  docs.README = [
    '# Testing: levels, reports and how to run them',
    '',
    `Results below are from the run on ${dateText} (commit \`${commit.slice(0, 7)}\`). Regenerate everything with \`bash scripts/generate-test-reports.sh\`.`,
    '',
    '## Documents',
    '',
    table(
      ['Document', 'PDF', 'Source'],
      [
        ['Software Requirement Specification', '[Software_Requirement_Specification.pdf](../Software_Requirement_Specification.pdf)', '-'],
        ['Software Test Plan', '[Test_Plan.pdf](../Test_Plan.pdf)', '-'],
        ['SASD', '[SASD.pdf](../SASD.pdf)', '-'],
        ['Unit Test Report', '[Unit_Test_Report.pdf](../Unit_Test_Report.pdf)', '[Unit_Test_Report.md](Unit_Test_Report.md)'],
        ['Integration Test Report', '[Integration_Test_Report.pdf](../Integration_Test_Report.pdf)', '[Integration_Test_Report.md](Integration_Test_Report.md)'],
        ['System Test Report', '[System_Test_Report.pdf](../System_Test_Report.pdf)', '[System_Test_Report.md](System_Test_Report.md)'],
        ['Code & Branch Coverage Report', '[Code_and_Branch_Coverage_Report.pdf](../Code_and_Branch_Coverage_Report.pdf)', '[Code_and_Branch_Coverage_Report.md](Code_and_Branch_Coverage_Report.md)'],
      ],
    ),
    '',
    'Line-by-line coverage: [server](coverage-html/server/index.html), [client](coverage-html/client/index.html). Raw results: [raw/](raw/).',
    '',
    '## Test levels',
    '',
    table(
      ['Level', 'What it checks', 'Tools', 'Where', 'Run with', 'Result'],
      [
        ['Unit', 'One function, controller or model on its own, dependencies mocked', 'Jest, Vitest', 'server/tests/unit, server/tests/{eventStatus,event.model,serveClient}.test.js, client/src/utils', '`npm run test:unit` in server/ and client/', `${up}/${u} passed`],
        ['Integration', 'Real components together: HTTP API through middleware and Mongoose into MongoDB; React pages with router, login state and API client', 'Jest + Supertest + in-memory MongoDB, Vitest + React Testing Library', 'server/tests, server/src/*.test.js, client/src/**/*.test.jsx', '`npm run test:integration` in server/ and client/', `${ip}/${it} passed`],
        ['System', 'The whole deployed product end to end in a real browser, plus performance and security checks', 'Playwright (Chromium)', 'system-tests/', '`npm test` in system-tests/', `${sp}/${st} passed`],
        ['Acceptance', 'The Product Owner confirms each feature meets its SRS acceptance criteria (UAT, Test Plan section 7)', 'Manual, on the deployed site', 'docs/demo-script.md', 'By hand', 'Recorded by the Product Owner'],
      ],
    ),
    '',
    'Every push and pull request runs the unit, integration and system tests automatically in GitHub Actions (`.github/workflows/ci.yml`), which is the regression testing in Test Plan section 5. The site is deployed only when all of them pass.',
    '',
    '## Traceability: Test Plan features to automated tests',
    '',
    'Number of test cases at each level whose name cites the requirement ID.',
    '',
    table(['Req. ID', 'Feature', 'Unit', 'Integration', 'System', 'Status'], trace),
    '',
  ].join('\n');
}

// ---------- write files ----------
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, 'raw'), { recursive: true });

// Absolute paths from the machine that ran the tests become repo-relative.
const stripRoot = (text) => text.split(root + path.sep).join('').split(JSON.stringify(root + path.sep).slice(1, -1)).join('');
for (const [part, dir] of Object.entries(SOURCES)) {
  for (const name of ['test-results.json', 'coverage-summary.json']) {
    const f = path.join(dir, name);
    if (fs.existsSync(f)) fs.writeFileSync(path.join(outDir, 'raw', `${part}-${name}`), stripRoot(fs.readFileSync(f, 'utf8')));
  }
  if (part !== 'system' && fs.existsSync(path.join(dir, 'index.html'))) {
    fs.cpSync(dir, path.join(outDir, 'coverage-html', part), {
      recursive: true,
      filter: (f) => !/\.json$|lcov\.info$|clover\.xml$|[\\/]lcov-report$/.test(f),
    });
  }
}

for (const [name, md] of Object.entries(docs)) fs.writeFileSync(path.join(outDir, `${name}.md`), md);

// ---------- PDFs ----------
const { marked } = fromSystemTests('marked');
const { chromium } = fromSystemTests('@playwright/test');
const css = `
  @page { size: A4; margin: 18mm 14mm; }
  body { font-family: "Segoe UI", Arial, sans-serif; font-size: 10.5pt; color: #1b2a41; line-height: 1.45; }
  h1 { font-size: 22pt; margin: 0 0 4px; color: #1b2a41; }
  h2 { font-size: 14pt; margin-top: 22px; border-bottom: 2px solid #e8492a; padding-bottom: 3px; }
  h3 { font-size: 11.5pt; margin-top: 16px; }
  table { border-collapse: collapse; width: 100%; margin: 6px 0 12px; font-size: 8.8pt; page-break-inside: auto; }
  tr { page-break-inside: avoid; }
  th, td { border: 1px solid #c9ced6; padding: 4px 6px; text-align: left; vertical-align: top; word-break: break-word; }
  th { background: #eef1f5; white-space: nowrap; }
  td code { white-space: nowrap; background: none; padding: 0; }
  td:only-child { word-break: normal; }
  code { font-family: Consolas, monospace; font-size: 8.8pt; background: #f3f4f6; padding: 0 3px; border-radius: 3px; }
  pre { background: #f3f4f6; padding: 8px; font-size: 8.5pt; white-space: pre-wrap; }
  a { color: #1b2a41; }
`;
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, md] of Object.entries(docs)) {
  if (name === 'README') continue;
  // Keep figures such as "100.0%" and IDs such as "TC-SYS-01" on one line.
  const body = marked.parse(md).replace(/(?<![\w-])(\d+(?:\.\d+)?%|(?:TC-SYS|UT|IT)-\d+)/g, '<span style="white-space:nowrap">$1</span>');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`;
  await page.setContent(html, { waitUntil: 'load' });
  await page.pdf({
    path: path.join(docsDir, `${name}.pdf`),
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `<div style="font-size:8px;width:100%;text-align:center;color:#666">${name.replace(/_/g, ' ').replace(' and ', ' & ')} · page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
    margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
  });
}
await browser.close();

const failed = cases.filter((c) => c.status === 'Fail').length;
console.log(`Wrote ${Object.keys(docs).length - 1} reports (PDF in docs/, Markdown in docs/test-reports/) from ${cases.length} test cases, ${failed} failed.`);
