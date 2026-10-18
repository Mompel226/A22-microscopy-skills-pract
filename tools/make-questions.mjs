#!/usr/bin/env node
/* make-questions.mjs — writes data/questions.json, the list of this practical's questions that the labs script reads to
   name and group them on the teacher's 🔬 Practicals board (copied from the rocky shore practical, 18 Oct 2026). The page
   registers every question as it draws it (MicroApp.reg in js/app.js, used by js/practice.js); opened with ?manifest=1 it
   prints that list, which headless Chrome reads.
     node tools/make-questions.mjs           write it
     node tools/make-questions.mjs --check   exit 1 if the file no longer matches the page
   A changed question id moves its pupils' records to a new square: keep ids when rewording. */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const prof = mkdtempSync(join(tmpdir(), 'mkq-'));
let dom = '';
try {
  /* headless Chrome prints the page and then may not quit (its updater): the output is kept, and Chrome is ended at 40 s */
  const r = spawnSync(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files', '--user-data-dir=' + prof,
                               '--timeout=10000',   /* Google's sign-in script keeps the page loading: the DOM is read after ten seconds */
                               '--dump-dom', pathToFileURL(join(ROOT, 'index.html')).href + '?manifest=1'],
                      { encoding: 'utf8', timeout: 40000, killSignal: 'SIGKILL', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });
  dom = r.stdout || '';
} finally { rmSync(prof, { recursive: true, force: true }); }
const m = dom.match(/<pre id="manifest">([\s\S]*?)<\/pre>/);
if (!m) { console.error('the page printed no list of questions'); process.exit(1); }
const txt = m[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const man = JSON.parse(txt);
const out = JSON.stringify(man, null, 1) + '\n', file = join(ROOT, 'data/questions.json');
if (process.argv.includes('--check')) {
  let now = ''; try { now = readFileSync(file, 'utf8'); } catch (e) {}
  if (now !== out) { console.error('data/questions.json does not match the page: run node tools/make-questions.mjs'); process.exit(1); }
  console.log('data/questions.json matches the page (' + man.questions.length + ' questions)');
} else {
  writeFileSync(file, out);
  console.log('wrote data/questions.json: ' + man.questions.length + ' questions, ' + (man.groups || []).length + ' groups');
}
