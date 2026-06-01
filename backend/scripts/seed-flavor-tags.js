#!/usr/bin/env node
/*
 * Seeds all issue #311 tea flavor tags into the tags table as category='flavor'.
 * Usage:
 *   DATABASE_URL=mysql://... node backend/scripts/seed-flavor-tags.js
 */
const mysql = require('mysql2/promise');
const fs = require('node:fs');
const path = require('node:path');

const csvPath = path.resolve(__dirname, '../../public/data/tea_flavor_tags_v1.csv');

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
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

function readFlavorTagNames() {
  const lines = fs.readFileSync(csvPath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  const headers = parseCsvLine(lines[0]);
  const tagKoIndex = headers.indexOf('tag_ko');
  if (tagKoIndex === -1) throw new Error('CSV is missing tag_ko column');
  return lines.slice(1).map((line) => parseCsvLine(line)[tagKoIndex]).filter(Boolean);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required');

  const names = readFlavorTagNames();
  const connection = await mysql.createConnection(databaseUrl);
  try {
    let insertedOrUpdated = 0;
    for (const name of names) {
      const [result] = await connection.execute(
        'INSERT INTO `tags` (`name`, `category`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `category` = VALUES(`category`)',
        [name, 'flavor'],
      );
      if (result.affectedRows > 0) insertedOrUpdated += 1;
    }
    console.log(`Seeded ${names.length} tea flavor tags (${insertedOrUpdated} inserted/updated).`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
