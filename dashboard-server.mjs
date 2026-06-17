#!/usr/bin/env node
// dashboard-server.mjs — Dynamic QA Job Dashboard Server
// Usage: node dashboard-server.mjs
// Then open: http://localhost:4242

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 4242;
const REPORTS_DIR = path.join(__dirname, 'reports');

// ─────────────────────────────────────────────
// URL → stable ID
// ─────────────────────────────────────────────
function urlToId(url) {
  return url
    .replace(/https?:\/\//, '')
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .substring(0, 90);
}

// ─────────────────────────────────────────────
// Load scan-history.tsv → Map<url, firstSeen>
// ─────────────────────────────────────────────
function loadScanHistory() {
  const histPath = path.join(__dirname, 'data', 'scan-history.tsv');
  const map = new Map();
  if (!fs.existsSync(histPath)) return map;
  const lines = fs.readFileSync(histPath, 'utf8').split('\n');
  for (const line of lines) {
    const cols = line.split('\t');
    if (cols.length < 2 || cols[0] === 'url') continue;
    const url = cols[0].trim();
    const date = cols[1].trim();
    if (url && date) map.set(url, date);
  }
  return map;
}

// ─────────────────────────────────────────────
// Detect portal from URL
// ─────────────────────────────────────────────
function detectPortal(url) {
  if (url.includes('ashbyhq.com'))         return 'Ashby';
  if (url.includes('greenhouse.io'))       return 'Greenhouse';
  if (url.includes('lever.co'))            return 'Lever';
  if (url.includes('weworkremotely.com'))  return 'WeWorkRemotely';
  if (url.includes('remotive.com'))        return 'Remotive';
  if (url.includes('himalayas.app'))       return 'Himalayas';
  if (url.includes('wellfound.com'))       return 'Wellfound';
  if (url.includes('glassdoor.com'))       return 'Glassdoor';
  if (url.includes('remote.io'))           return 'Remote.io';
  if (url.includes('linkedin.com'))        return 'LinkedIn';
  if (url.includes('torre.ai'))            return 'Torre';
  if (url.includes('getonbrd.com'))        return 'GetOnBrd';
  if (url.includes('dice.com'))            return 'Dice';
  if (url.includes('workatastartup.com'))  return 'YC';
  if (url.includes('workingnomads.com'))   return 'WorkingNomads';
  if (url.includes('indeed.com'))          return 'Indeed';
  if (url.includes('bamboohr.com'))        return 'BambooHR';
  return 'Other';
}

// ─────────────────────────────────────────────
// Parse a manual-qa-jobs-*.md file
// Supports both table rows and list item formats
// ─────────────────────────────────────────────
function parseManualQaFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const jobs = [];
  let region = 'world';
  const seenUrls = new Set();

  for (const line of lines) {
    // ── Region detection ──
    if (line.startsWith('#')) {
      if (line.includes('🌎') || /latam|mexico/i.test(line)) region = 'latam';
      else if (line.includes('🌍') || /worldwide|remote/i.test(line)) region = 'world';
      continue;
    }

    // ── Table row format ──
    // | 🆕🖐️ | Company Name | Role Title | [Apply](https://...) |
    const tableMatch = line.match(/^\|\s*([^|]*?)\|\s*([^|]+?)\|\s*([^|]+?)\|\s*\[Apply\]\(([^)]+)\)/);
    if (tableMatch) {
      const flags   = tableMatch[1];
      const company = tableMatch[2].trim();
      const role    = tableMatch[3].trim();
      const url     = tableMatch[4].trim();

      if (!company || company === 'Company' || company.includes('---') || company.includes('===')) continue;
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);

      jobs.push({
        id:     urlToId(url),
        company,
        role,
        region,
        portal: detectPortal(url),
        url,
        isNew:  flags.includes('🆕'),
      });
      continue;
    }

    // ── List item format ──
    // - 🆕 🖐️ [Role Title](url) — **Company** · Portal · notes
    const listMatch = line.match(/^-\s+([🆕🖐️⚠️\s]*)\[([^\]]+)\]\(([^)]+)\)\s*[—–-]+\s*\*\*([^*]+)\*\*/);
    if (listMatch) {
      const flags   = listMatch[1];
      const role    = listMatch[2].trim();
      const url     = listMatch[3].trim();
      const company = listMatch[4].trim();

      if (seenUrls.has(url)) continue;
      seenUrls.add(url);

      jobs.push({
        id:     urlToId(url),
        company,
        role,
        region,
        portal: detectPortal(url),
        url,
        isNew:  flags.includes('🆕'),
      });
    }
  }

  return jobs;
}

// ─────────────────────────────────────────────
// Find latest manual-qa-jobs-*.md
// ─────────────────────────────────────────────
function getLatestManualQaFile() {
  if (!fs.existsSync(REPORTS_DIR)) return null;
  const files = fs.readdirSync(REPORTS_DIR)
    .filter(f => f.startsWith('manual-qa-jobs') && f.endsWith('.md'))
    .sort()
    .reverse();
  return files.length > 0 ? path.join(REPORTS_DIR, files[0]) : null;
}

// ─────────────────────────────────────────────
// HTTP Server
// ─────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  // CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  // GET /api/jobs — return parsed jobs as JSON
  if (url === '/api/jobs') {
    try {
      const file = getLatestManualQaFile();
      if (!file) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No manual-qa-jobs-*.md found in reports/' }));
        return;
      }
      const jobs = parseManualQaFile(file);
      const history = loadScanHistory();
      for (const job of jobs) {
        job.firstSeen = history.get(job.url) || null;
      }
      const meta = { file: path.basename(file), count: jobs.length, ts: new Date().toISOString() };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ meta, jobs }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // GET /api/dead-jobs — return dead job IDs from liveness check
  if (url === '/api/dead-jobs') {
    const deadPath = path.join(REPORTS_DIR, 'dead-jobs.json');
    if (!fs.existsSync(deadPath)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ids: [], ts: null }));
      return;
    }
    try {
      const data = JSON.parse(fs.readFileSync(deadPath, 'utf8'));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // GET / — serve dashboard.html
  if (url === '/' || url === '/dashboard' || url === '/dashboard.html') {
    const htmlPath = path.join(REPORTS_DIR, 'dashboard.html');
    if (fs.existsSync(htmlPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(htmlPath));
    } else {
      res.writeHead(404);
      res.end('dashboard.html not found in reports/');
    }
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\n🎯 QA Dashboard running at → http://localhost:${PORT}`);
  console.log(`📦 Jobs API             → http://localhost:${PORT}/api/jobs`);
  const file = getLatestManualQaFile();
  if (file) {
    const jobs = parseManualQaFile(file);
    console.log(`📄 Loaded: ${path.basename(file)} (${jobs.length} jobs)`);
  } else {
    console.log(`⚠️  No manual-qa-jobs-*.md found in reports/`);
  }
  console.log('\nPress Ctrl+C to stop.\n');
});
