#!/usr/bin/env node
/**
 * setup.mjs — First-run setup for career-ops
 * Creates personal config files from examples.
 * Run: node setup.mjs
 */

import { existsSync, copyFileSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = __dirname;

const green  = s => `\x1b[32m${s}\x1b[0m`;
const yellow = s => `\x1b[33m${s}\x1b[0m`;
const red    = s => `\x1b[31m${s}\x1b[0m`;
const bold   = s => `\x1b[1m${s}\x1b[0m`;
const dim    = s => `\x1b[2m${s}\x1b[0m`;

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(r => rl.question(q, r));

function exists(rel) { return existsSync(join(root, rel)); }
function copy(src, dst) {
  if (exists(dst)) {
    console.log(yellow(`  ⚠  ${dst} already exists — skipping`));
    return false;
  }
  copyFileSync(join(root, src), join(root, dst));
  console.log(green(`  ✓  ${dst} created`));
  return true;
}

function ensureDir(rel) {
  const p = join(root, rel);
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

console.log(`\n${bold('career-ops setup')}\n${'─'.repeat(40)}`);
console.log('This script creates your personal config files.\n');

// ── Step 1: CV ────────────────────────────────
console.log(bold('1. CV (cv.md)'));
if (exists('cv.md')) {
  console.log(yellow('  ⚠  cv.md already exists — skipping'));
} else {
  copy('cv.example.md', 'cv.md');
  console.log(dim('  → Edit cv.md with your real experience before running scans.'));
}

// ── Step 2: Profile ───────────────────────────
console.log(bold('\n2. Profile (config/profile.yml)'));
ensureDir('config');
if (copy('config/profile.example.yml', 'config/profile.yml')) {
  console.log(dim('  → Edit config/profile.yml with your name, email, target roles, salary.'));
}

// ── Step 3: Portals ───────────────────────────
console.log(bold('\n3. Portal scanner (portals.yml)'));
if (copy('templates/portals.example.yml', 'portals.yml')) {
  console.log(dim('  → Edit portals.yml → title_filter to match your target roles.'));
}

// ── Step 4: Profile mode ──────────────────────
console.log(bold('\n4. Evaluation profile (modes/_profile.md)'));
if (exists('modes/_profile.template.md')) {
  copy('modes/_profile.template.md', 'modes/_profile.md');
  console.log(dim('  → Customize modes/_profile.md with your archetypes and negotiation targets.'));
} else {
  console.log(dim('  → modes/_profile.template.md not found, skipping.'));
}

// ── Step 5: Data files ────────────────────────
console.log(bold('\n5. Data files'));
ensureDir('data');

if (!exists('data/applications.md')) {
  writeFileSync(join(root, 'data/applications.md'), [
    '# Applications Tracker',
    '',
    '| # | Date | Company | Role | Score | Status | PDF | Report | Notes |',
    '|---|------|---------|------|-------|--------|-----|--------|-------|',
    '',
  ].join('\n'));
  console.log(green('  ✓  data/applications.md created'));
} else {
  console.log(yellow('  ⚠  data/applications.md already exists — skipping'));
}

if (!exists('data/pipeline.md')) {
  writeFileSync(join(root, 'data/pipeline.md'), [
    '# Pipeline — Pending URLs',
    '',
    '<!-- Add job URLs here, one per line, to evaluate with /career-ops pipeline -->',
    '<!-- Format: - [ ] https://... | Company | Role -->',
    '',
  ].join('\n'));
  console.log(green('  ✓  data/pipeline.md created'));
} else {
  console.log(yellow('  ⚠  data/pipeline.md already exists — skipping'));
}

if (!exists('data/scan-history.tsv')) {
  writeFileSync(join(root, 'data/scan-history.tsv'), 'url\tfirst_seen\tportal\ttitle\tcompany\tstatus\n');
  console.log(green('  ✓  data/scan-history.tsv created'));
} else {
  console.log(yellow('  ⚠  data/scan-history.tsv already exists — skipping'));
}

ensureDir('reports');
ensureDir('output');
ensureDir('jds');
ensureDir('batch/tracker-additions');

// ── Done ──────────────────────────────────────
rl.close();

console.log(`\n${'─'.repeat(40)}`);
console.log(bold(green('Setup complete!\n')));
console.log('Next steps:');
console.log(`  ${bold('1.')} Edit ${yellow('cv.md')} — add your real experience`);
console.log(`  ${bold('2.')} Edit ${yellow('config/profile.yml')} — name, email, target roles, salary`);
console.log(`  ${bold('3.')} Edit ${yellow('portals.yml')} — adjust title_filter keywords`);
console.log(`  ${bold('4.')} Run a scan: ${dim('/career-ops scan')} in Claude Code`);
console.log(`  ${bold('5.')} Launch dashboard: ${dim('node dashboard-server.mjs')} → http://localhost:4242`);
console.log('');
console.log(dim('Run "node doctor.mjs" to validate your setup.\n'));
