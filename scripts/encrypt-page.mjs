#!/usr/bin/env node
/**
 * Builds a private static page: a password gate wrapped around an encrypted
 * copy of the page content.
 *
 * Each page's plaintext lives in a gitignored source folder. Only ciphertext
 * is committed, so the repo never carries the page content or the password.
 *
 *   PAGE_USER='…' PAGE_PASS='…' node scripts/encrypt-page.mjs <page>
 *
 * <page> is a key of PAGES below (defaults to "plan"). The username is folded
 * into the key derivation, so both halves are required and neither is stored.
 * PLAN_USER / PLAN_PASS are still accepted for the original /plan page.
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

// source: gitignored folder holding content.html + behaviour.js
// out:    folder under public/ that the page is served from
// skey:   sessionStorage key, unique per page so unlocking one never clobbers another
// theme:  optional HTML file (fonts + CSS overrides) injected into the gate's <head>
// themeColor / iconColor: browser UI colour and favicon dot colour (hex without # for the icon)
const PAGES = {
  plan: {
    title: 'The Gentle Plan',
    brand: 'the gentle plan',
    source: 'plan-source',
    out: 'public/plan',
    skey: 'gentle-plan-key',
    themeColor: '#0b120e',
    iconColor: 'cdf463',
  },
  syllabus: {
    title: 'Staff AI Platform Engineer — Syllabus',
    brand: 'staff syllabus',
    source: 'syllabus-source',
    out: 'public/syllabus',
    skey: 'staff-syllabus-key',
    theme: 'scripts/themes/syllabus-gate.html',
    themeColor: '#0d1726',
    iconColor: '87ceeb',
  },
};

const name = process.argv[2] ?? 'plan';
const page = PAGES[name];
if (!page) {
  console.error(`Unknown page "${name}". Known pages: ${Object.keys(PAGES).join(', ')}`);
  process.exit(1);
}

const user = process.env.PAGE_USER ?? process.env.PLAN_USER;
const pass = process.env.PAGE_PASS ?? process.env.PLAN_PASS;

if (!user || !pass) {
  console.error('Set PAGE_USER and PAGE_PASS in the environment.');
  process.exit(1);
}

const content = readFileSync(resolve(root, page.source, 'content.html'), 'utf8');
const behaviour = readFileSync(resolve(root, page.source, 'behaviour.js'), 'utf8');
const template = readFileSync(resolve(root, 'scripts/private-gate.template.html'), 'utf8');

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
  title: page.title,
  iterations: ITERATIONS,
  salt: salt.toString('base64'),
  iv: iv.toString('base64'),
  data: ciphertext.toString('base64'),
});

const html = template
  .replace('__PAYLOAD__', () => payload)
  .replace('__BEHAVIOUR__', () => behaviour)
  .replace('__BRAND__', () => page.brand)
  .replace('__SKEY__', () => page.skey)
  .replace('__THEME_COLOR__', () => page.themeColor)
  .replace('__ICON_COLOR__', () => page.iconColor)
  .replace('__HEAD_EXTRA__', () => (page.theme ? readFileSync(resolve(root, page.theme), 'utf8').trim() : ''))
  .replace('__ITER_LABEL__', () => ITERATIONS.toLocaleString('en-US'));

const outFile = resolve(root, page.out, 'index.html');
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, html);

console.log(
  `${page.out}/index.html — ${(html.length / 1024).toFixed(0)} KB ` +
  `(${(ciphertext.length / 1024).toFixed(0)} KB ciphertext, ` +
  `${ITERATIONS.toLocaleString('en-US')} PBKDF2 iterations)`);
