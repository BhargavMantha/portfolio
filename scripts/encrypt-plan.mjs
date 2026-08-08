#!/usr/bin/env node
/**
 * Builds public/plan/index.html — a password gate wrapped around an encrypted
 * copy of the page.
 *
 * The plaintext lives in plan-source/ (gitignored). Only ciphertext is
 * committed, so the repo never carries the page content or the password.
 *
 *   PLAN_USER='…' PLAN_PASS='…' node scripts/encrypt-plan.mjs
 *
 * The username is folded into the key derivation, so both halves are required
 * and neither is stored anywhere.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { randomBytes, pbkdf2Sync, createCipheriv } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Measured ~57ms for 600k via WebCrypto on a modern desktop — fast for the
// owner, but equally fast for anyone brute-forcing the downloadable ciphertext.
// 2M lands around 200ms on desktop / ~1s on a low-end phone.
const ITERATIONS = 2_000_000;
const TITLE = 'The Gentle Plan';

const user = process.env.PLAN_USER;
const pass = process.env.PLAN_PASS;

if (!user || !pass) {
  console.error('Set PLAN_USER and PLAN_PASS in the environment.');
  process.exit(1);
}

const content = readFileSync(resolve(root, 'plan-source/content.html'), 'utf8');
const behaviour = readFileSync(resolve(root, 'plan-source/behaviour.js'), 'utf8');
const template = readFileSync(resolve(root, 'scripts/plan-gate.template.html'), 'utf8');

const salt = randomBytes(16);
const iv = randomBytes(12);

// Must mirror the browser: PBKDF2-SHA256 over "username\npassword".
const key = pbkdf2Sync(
  `${user.trim().toLowerCase()}\n${pass}`, salt, ITERATIONS, 32, 'sha256');

const cipher = createCipheriv('aes-256-gcm', key, iv);
const ciphertext = Buffer.concat([
  cipher.update(content, 'utf8'),
  cipher.final(),
  cipher.getAuthTag(), // WebCrypto expects the tag appended to the ciphertext
]);

const payload = JSON.stringify({
  v: 1,
  title: TITLE,
  iterations: ITERATIONS,
  salt: salt.toString('base64'),
  iv: iv.toString('base64'),
  data: ciphertext.toString('base64'),
});

const html = template
  .replace('__PAYLOAD__', () => payload)
  .replace('__BEHAVIOUR__', () => behaviour)
  .replace('__ITER_LABEL__', () => ITERATIONS.toLocaleString('en-US'));

mkdirSync(resolve(root, 'public/plan'), { recursive: true });
writeFileSync(resolve(root, 'public/plan/index.html'), html);

console.log(
  `public/plan/index.html — ${(html.length / 1024).toFixed(0)} KB ` +
  `(${(ciphertext.length / 1024).toFixed(0)} KB ciphertext, ` +
  `${ITERATIONS.toLocaleString('en-US')} PBKDF2 iterations)`);
