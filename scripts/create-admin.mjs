#!/usr/bin/env node
// Interactive admin-account seeding script. Prompts for username/password so the
// plaintext password never lands in shell history, a CLI arg list, or a Claude
// transcript — run this yourself: `npm run create-admin`.
import crypto from 'node:crypto';
import readline from 'node:readline';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Must match the format produced by functions/_lib/auth.js hashPassword():
// pbkdf2$<iterations>$<saltHex>$<hashHex>
const PBKDF2_ITERATIONS = 100000;
const DB_NAME = 'vedic-astrology-db';

// Control-byte codes used by askHidden() below, kept as named constants instead of
// raw control characters in string literals (those don't survive round-tripping
// through some editors/terminals cleanly).
const BYTE_LF = 0x0a;
const BYTE_CR = 0x0d;
const BYTE_EOF = 0x04; // Ctrl+D
const BYTE_ETX = 0x03; // Ctrl+C
const BYTE_DEL = 0x7f;
const BYTE_BS = 0x08;

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function askHidden(question) {
  if (!process.stdin.isTTY) {
    throw new Error('This script needs an interactive terminal (run it directly, not piped).');
  }
  return new Promise((resolve) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    stdin.resume();
    stdin.setRawMode(true);
    let input = '';
    const onData = (chunk) => {
      const code = chunk[0];
      if (code === BYTE_LF || code === BYTE_CR || code === BYTE_EOF) {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(input);
        return;
      }
      if (code === BYTE_ETX) process.exit(1);
      if (code === BYTE_DEL || code === BYTE_BS) {
        input = input.slice(0, -1);
        return;
      }
      input += chunk.toString('utf8');
    };
    stdin.on('data', onData);
  });
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 32, 'sha256');
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

function sqlEscape(value) {
  return value.replace(/'/g, "''");
}

function runWrangler(sqlFile, target) {
  const args = ['wrangler', 'd1', 'execute', DB_NAME, `--file=${sqlFile}`, target === 'local' ? '--local' : '--remote'];
  console.log(`\nRunning: npx ${args.join(' ')}`);
  const result = spawnSync('npx', args, { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`wrangler d1 execute failed for --${target}`);
}

async function main() {
  console.log('Create the admin account for vedic-astrology-site.\n');

  const username = (await ask('Admin username: ')).trim();
  if (!username) throw new Error('Username is required.');

  const password = await askHidden('Admin password (hidden): ');
  if (!password) throw new Error('Password is required.');
  const confirmPassword = await askHidden('Confirm password (hidden): ');
  if (password !== confirmPassword) throw new Error('Passwords did not match.');

  const targetAnswer = (await ask('Apply to database: [both] / local / remote: ')).trim().toLowerCase() || 'both';
  const targets = targetAnswer === 'both' ? ['local', 'remote'] : [targetAnswer];
  if (!targets.every((t) => t === 'local' || t === 'remote')) {
    throw new Error('Choose "local", "remote", or "both".');
  }

  const passwordHash = hashPassword(password);
  const sql = `INSERT INTO users (username, password_hash, is_admin) VALUES ('${sqlEscape(username)}', '${sqlEscape(passwordHash)}', 1);\n`;

  const tmpFile = path.join(os.tmpdir(), `create-admin-${Date.now()}.sql`);
  fs.writeFileSync(tmpFile, sql, { mode: 0o600 });
  try {
    for (const target of targets) runWrangler(tmpFile, target);
    console.log(`\nAdmin account "${username}" created (${targets.join(' + ')}).`);
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
