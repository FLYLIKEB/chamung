#!/usr/bin/env node
/*
 * Seed tea flavor tags from public/data/tea_flavor_tags_v1.csv into the tags table.
 * Idempotent: existing rows are kept and marked category='flavor'.
 */
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  values.push(current);
  return values;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL or LOCAL_DATABASE_URL is required');
  }
  return new URL(url);
}

async function main() {
  const csvPath = path.resolve(__dirname, '../../public/data/tea_flavor_tags_v1.csv');
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const names = [...new Set(rows.map((row) => row.tag_ko).filter(Boolean))];
  if (names.length !== 99) {
    throw new Error(`Expected 99 flavor tags, got ${names.length}`);
  }
  if (process.argv.includes('--dry-run')) {
    console.log(`Validated ${names.length} flavor tags from ${path.relative(process.cwd(), csvPath)}`);
    return;
  }

  const url = getDatabaseUrl();
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: url.password ? decodeURIComponent(url.password) : undefined,
    database: url.pathname.slice(1),
    ssl: process.env.DB_SSL_ENABLED === 'true'
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : undefined,
  });

  try {
    for (const name of names) {
      await connection.execute(
        'INSERT INTO `tags` (`name`, `category`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `category` = VALUES(`category`)',
        [name, 'flavor'],
      );
    }
    const [countRows] = await connection.execute(
      'SELECT COUNT(*) AS count FROM `tags` WHERE `category` = ? AND `name` IN (?)',
      ['flavor', names],
    );
    console.log(`Seeded/verified ${countRows[0].count} flavor tags from ${path.relative(process.cwd(), csvPath)}`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
