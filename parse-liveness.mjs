#!/usr/bin/env node
// parse-liveness.mjs — Convert liveness-*.log → reports/dead-jobs.json
// Usage: node parse-liveness.mjs reports/liveness-2026-05-11.log

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function urlToId(url) {
  return url
    .replace(/https?:\/\//, '')
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .substring(0, 90);
}

const logFile = process.argv[2];
if (!logFile) {
  console.error('Usage: node parse-liveness.mjs <log-file>');
  process.exit(1);
}

const lines = readFileSync(logFile, 'utf8').split('\n');
const dead = [];
const active = [];
const uncertain = [];

for (const line of lines) {
  const expiredMatch = line.match(/^❌\s+expired\s+(https?:\/\/\S+)/);
  const activeMatch  = line.match(/^✅\s+active\s+(https?:\/\/\S+)/);
  const uncertMatch  = line.match(/^⚠️\s+uncertain\s+(https?:\/\/\S+)/);

  if (expiredMatch) dead.push(expiredMatch[1]);
  else if (activeMatch) active.push(activeMatch[1]);
  else if (uncertMatch) uncertain.push(uncertMatch[1]);
}

const ids = dead.map(url => urlToId(url));
const out = {
  ids,
  urls: dead,
  ts: new Date().toISOString(),
  stats: { dead: dead.length, active: active.length, uncertain: uncertain.length, total: dead.length + active.length + uncertain.length }
};

const outPath = path.join(__dirname, 'reports', 'dead-jobs.json');
writeFileSync(outPath, JSON.stringify(out, null, 2));

console.log(`✅ dead-jobs.json written`);
console.log(`   Dead:      ${dead.length}`);
console.log(`   Active:    ${active.length}`);
console.log(`   Uncertain: ${uncertain.length}`);
console.log(`   Total:     ${out.stats.total}`);
