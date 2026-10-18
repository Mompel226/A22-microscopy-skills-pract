/* A2.2.2 microscopy skills · IB Biology · the page's behaviour (18 Oct 2026).
   Built like the rocky shore practical (memory ib-practical-page-design): parts as tabs along the top, the picture on
   the left in every part, a quick check after each piece of theory, every word and number typed, the answer only after
   two tries, every answer kept in this browser, and every Check told to js/lesson.js for the teacher's 🔬 board.
   The pictures are drawn by js/scope.js; the questions are in js/practice.js. */
(function () {
  'use strict';
  const S = window.Scope;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('micro-skills.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('micro-skills.' + k, JSON.stringify(v)); } catch (e) { /* private window: this visit only */ } }
  };
  /* Every answer survives a reload (the rocky shore rule, 12 Oct 2026): kept by the question's board id in this browser. */
  const ANS = store.get('answers', {});
  const ans = {
    get: id => (ANS[id] && typeof ANS[id] === 'object') ? ANS[id] : null,
    put: (id, o) => { if (!id) return; ANS[id] = Object.assign({}, ANS[id] || {}, o); store.set('answers', ANS); },
    drop: ids => { (ids || []).forEach(i => { delete ANS[i]; }); store.set('answers', ANS); }
  };
  function h(tag, attrs, html) { const e = document.createElement(tag); for (const k in attrs || {}) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  const fmt = (x, n) => (Math.round(x * Math.pow(10, n)) / Math.pow(10, n)).toFixed(n);
  const norm = s => String(s).normalize('NFKC').toLowerCase().replace(/[’‘`´]/g, "'").replace(/[‐‑‒–—−-]/g, ' ')
    .replace(/[.,;:!?]+$/, '').replace(/\s+/g, ' ').trim().replace(/^(the|a|an) /, '');
  /* a number typed with its unit or a times sign still counts: "×400", "2.35 µm", "0,5" */
  const num = v => { const m = String(v).replace(/[−–]/g, '-').replace(/(\d),(\d)/g, '$1.$2').replace(/(\d) (?=\d{3}\b)/g, '$1').match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : NaN; };

  /* ---------------- the lesson record and the list of questions (data/questions.json) ---------------- */
  const L0 = window.Lesson || { check() {}, done() {}, restart() {}, restartAll() {} };
  const L = { check: (...a) => { L0.check(...a); progressSoon(); }, done: (...a) => { L0.done(...a); progressSoon(); },
              restart: (...a) => { L0.restart(...a); ans.drop(a[0]); progressSoon(); }, restartAll: (...a) => { L0.restartAll(...a); progressSoon(); } };
  const QREG = [];
  const reg = q => { if (!QREG.some(x => x.id === q.id)) QREG.push(q); };
  const PARTS = [[1, 'Calibrate the graticule'], [2, 'Measure cells'], [3, 'Scale bars'], [4, 'Drawings'], [5, 'Take a photo']];
  function manifest() {
    const qs = QREG.map((q, i) => [q, i]).sort((a, b) => a[0].part - b[0].part || a[1] - b[1]).map(x => x[0]);
    const used = new Set(qs.map(q => q.part));
    return { id: 'A22-microscopy-skills-pract', v: 1, parts: PARTS.filter(p => used.has(p[0])).map(p => ({ n: p[0], title: p[1] })), groups: [], questions: qs };
  }
  var progT = 0;
  function progressSoon() { clearTimeout(progT); progT = setTimeout(progress, 60); }
  function qDone(rec, id) { const x = rec.q && rec.q[id], r = x && x.r[x.r.length - 1]; return !!(r && !r.e && (r.s === 'f' || r.s === '1' || r.s === 'd')); }
  function progress() {
    const rec = L0.record ? L0.record() : { q: {} };
    $$('.tabs button').forEach((b, i) => {
      const n = i + 1, qs = QREG.filter(q => q.part === n), done = qs.filter(q => qDone(rec, q.id)).length, all = qs.length;
      const pct = all ? Math.round(100 * done / all) : 0;
      let pb = $('.pb', b); if (!pb) { pb = h('span', { class: 'pb', 'aria-hidden': 'true' }, '<i></i>'); b.appendChild(pb); }
      pb.style.setProperty('--p', pct); b.classList.toggle('prog', done > 0 && pct < 100); $('.n', b).classList.toggle('full', all > 0 && pct === 100);
      b.setAttribute('aria-label', `${n}. ${b.textContent.replace(/^\d+/, '').trim()}: ${done} of ${all} done`);
      const t = $(`#part-${n} .task__n`); if (t) { t.textContent = all ? `Done: ${done} of ${all}` : ''; t.classList.toggle('full', all > 0 && done === all); }
    });
  }

  /* ---------------- ↺ the whole page again · ☀ Bright / ☾ Dark ---------------- */
  $('#btnRestart').addEventListener('click', () => {
    if (!confirm('Start the whole page again? Your answers on this page are cleared. Your teacher keeps the record of what you did.')) return;
    L.restartAll();
    try { Object.keys(localStorage).filter(k => k.indexOf('micro-skills.') === 0).forEach(k => localStorage.removeItem(k)); } catch (e) { /* nothing was saved */ }
    location.replace(location.pathname);
  });
  (function () {
    const tb = $('#btnTheme'); if (!tb) return;
    const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const nowDark = () => { const t = document.documentElement.getAttribute('data-theme'); return t ? t === 'dark' : !!(mq && mq.matches); };
    const paint = () => { const d = nowDark(); tb.textContent = d ? '☀ Bright' : '☾ Dark'; tb.setAttribute('aria-label', d ? 'Switch to the bright version' : 'Switch to the dark version'); };
    tb.addEventListener('click', () => { const next = nowDark() ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', next); try { localStorage.setItem('biology.theme', next); } catch (e) { } paint(); });
    if (mq && mq.addEventListener) mq.addEventListener('change', paint);
    tb.hidden = false; paint();
  })();

  /* ---------------- words that open their meaning in place ---------------- */
  const DEF = {
    eyepiece: ['eyepiece', 'The lens you look through, at the top of the microscope. It usually magnifies ×10. The eyepiece graticule sits inside it.'],
    stage: ['stage', 'The flat platform under the objective lens. The slide sits on it, and the stage controls move the slide.'],
    graticule: ['eyepiece graticule', 'A scale of 100 equal divisions on a small glass disc inside the eyepiece. You see it on top of the specimen, and it stays the same size at every magnification. Its divisions have no unit until you calibrate it with a stage micrometer.'],
    micrometer: ['stage micrometer', 'A special glass slide with a very small, exact scale on it, which you put on the stage. Here the scale is 1 mm long, in 100 divisions, so one division is 0.01 mm = 10 µm. A normal ruler cannot do this job: its smallest marks are 1 mm apart, and at ×400 the whole circle you see is less than half a millimetre across.'],
    epu: ['eyepiece unit (EPU)', 'One division of the eyepiece graticule. Its real length on the slide depends on the objective lens in use.'],
    calibrate: ['calibrate', 'To find the real length that one eyepiece unit represents, in µm, by comparing the graticule with the stage micrometer.'],
    objective: ['objective lens', 'The lens close to the slide (×4, ×10 or ×40). Total magnification = eyepiece lens (×10) × objective lens.'],
    magnification: ['magnification', 'How many times larger the image is than the real object. Magnification = image size ÷ actual size, both in the same unit.'],
    actual: ['actual size', 'The real size of the specimen. Actual size = image size ÷ magnification.'],
    mean: ['mean', 'The average: add the values together, then divide by the number of values.'],
    image: ['image size', 'The size of the specimen in the micrograph or the drawing, measured with a ruler.'],
    scalebar: ['scale bar', 'A straight line on a drawing or micrograph with the real length it represents written beside it, for example 20 µm.'],
    micrometre: ['micrometre (µm)', 'One thousandth of a millimetre. 1 mm = 1000 µm, and 1 µm = 1000 nm.'],
    uncertainty: ['uncertainty', 'The range in which the true value probably lies. You read each end of a length to the nearest division, so a length has an uncertainty of about ± 1 division.'],
    stain: ['methylene blue', 'A blue stain that makes the nucleus and the cytoplasm of animal cells easier to see. Too much stain makes the cells dark and hides their detail.'],
    guard: ['guard cell', 'One of the two curved cells round a stoma. Guard cells change shape to open and close the stoma. They contain chloroplasts.'],
    stoma: ['stoma (plural stomata)', 'A pore in the epidermis of a leaf, between two guard cells. Gases diffuse in and out through it.'],
    epidermis: ['epidermis', 'The layer of cells on the outer surface of a leaf. A peel of it is one cell thick, so light passes through it.']
  };
  document.addEventListener('click', e => {
    const b = e.target.closest ? e.target.closest('button.term') : null; if (!b) return;
    const d = DEF[b.dataset.t]; if (!d) return;
    const open = b.getAttribute('aria-expanded') === 'true', host = b.closest('p, li, .box, .ins') || b.parentElement;
    $$('.def', host.parentElement).forEach(x => { if (x.dataset.for === b.dataset.t) x.remove(); });
    $$('button.term[aria-expanded="true"]', host).forEach(x => x.setAttribute('aria-expanded', 'false'));
    if (open) return;
    b.setAttribute('aria-expanded', 'true');
    const box = h('div', { class: 'def', role: 'note', 'data-for': b.dataset.t }, `<b>${d[0]}</b>: ${d[1]}`);
    host.insertAdjacentElement('afterend', box);
  });

  /* ---------------- the picture on the left ---------------- */
  const V = {
    calib: Object.assign({ obj: 40, x0: 101.7, lens: 101 }, store.get('v.calib', {})),
    slide: Object.assign({ slide: 'cheek', dx: 0, dy: 0, rot: 0 }, store.get('v.slide', {})),
    card: Object.assign({ rx: 64, ry: 506, rot: 0 }, store.get('v.card', {})),
    draw: Object.assign({ d: 'A' }, store.get('v.draw', {}))
  };
  const svg = $('#view'), stat = $('#vstat');
  let mode = 'calib';
  const CAP = {
    calib: 'The view down the microscope at ×400: the eyepiece graticule (black, numbers above) and the stage micrometer (blue, numbers below; each number is 0.1 mm). The lens shows what is inside the orange frame, four times larger. Drawn for this page.',
    slide: 'Human cheek cells stained with methylene blue (×400), or a leaf epidermis peel (×100), with the eyepiece graticule. Drawn for this page at the real sizes of these cells.',
    card: 'A micrograph as printed on an exam page, with a ruler in millimetres. Drawn for this page: a Paramecium, a single-celled organism.',
    draw: 'Drawings made for this page. A, B and C each break three rules; D follows every rule.',
    phone: 'Taking a photo through the eyepiece with a phone.'
  };
  const LABEL = { calib: 'The eyepiece graticule over the stage micrometer, with a lens that shows the orange frame four times larger', slide: 'A slide under the microscope with the eyepiece graticule', card: 'A printed micrograph of a Paramecium with a scale bar and a ruler', draw: 'A student drawing', phone: 'A phone held to the eyepiece of a microscope' };
  const d10 = () => 10 * S.sc(V.calib.obj);                    // svg units per micrometer division
  function lined() { const d = d10(), j = Math.round((S.G.x0 - V.calib.x0) / d); return { j, off: V.calib.x0 + j * d - S.G.x0 }; }
  function render() {
    if (mode === 'calib') svg.innerHTML = S.calib(V.calib);
    else if (mode === 'slide') svg.innerHTML = S.slide(V.slide);
    else if (mode === 'card') svg.innerHTML = S.card(V.card);
    else if (mode === 'draw') svg.innerHTML = S.DRAW[V.draw.d]();
    else svg.innerHTML = S.phone();
    svg.setAttribute('aria-label', LABEL[mode] + (mode === 'draw' ? ' (' + V.draw.d + ')' : ''));
    $$('.ctl').forEach(c => { c.hidden = c.dataset.for !== mode; });
    $$('[data-set]').forEach(b => { const [k, v] = b.dataset.set.split(':'); const st = { obj: V.calib, slide: V.slide, d: V.draw }[k]; if (st) b.setAttribute('aria-pressed', String(String(st[k]) === v)); });
    if (mode === 'calib') {
      const ok = S.onZero(V.calib);
      stat.innerHTML = `Objective ×${V.calib.obj} (×${V.calib.obj * 10} in total). ` + (ok ? `<span class="ok">✓ A line of the stage micrometer sits exactly on 0 of the graticule.</span> Now drag the orange frame along the scales, or use the Lens arrows.` : 'Drag the blue scale, or use the Stage micrometer arrows, until one of its lines sits exactly on 0 of the graticule.');
    } else if (mode === 'slide') {
      stat.innerHTML = V.slide.slide === 'leaf' ? 'Leaf epidermis peel at ×100 (1 EPU = 9.41 µm).' : 'Cheek cells at ×400 (1 EPU = 2.35 µm).';
      stat.innerHTML += ` The eyepiece is turned ${Math.round(((V.slide.rot % 360) + 360) % 360)}°. Drag the slide to move a cell onto the scale.`;
    } else if (mode === 'card') stat.innerHTML = 'Drag the ruler onto what you measure. Read from its 0 mark; 10 small divisions = 1 cm.';
    else if (mode === 'draw') stat.innerHTML = V.draw.d === 'D' ? 'Drawing D follows every rule. Compare A, B and C with it.' : `Drawing ${V.draw.d} breaks three rules. Type them in part 4.`;
    else stat.textContent = '';
    $('#cap').textContent = CAP[mode];
  }
  const save = () => { store.set('v.calib', V.calib); store.set('v.slide', V.slide); store.set('v.card', V.card); store.set('v.draw', V.draw); };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  function snapMic() { const l = lined(); if (Math.abs(l.off) < 1.6) V.calib.x0 -= l.off; }
  /* dragging: the stage micrometer, the lens frame, the slide, the ruler */
  function pt(e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const m = svg.getScreenCTM(); return m ? p.matrixTransform(m.inverse()) : { x: 0, y: 0 }; }
  let drag = null;
  svg.addEventListener('pointerdown', e => {
    const t = e.target.closest ? e.target.closest('[data-drag]') : null; if (!t) return;
    drag = { kind: t.dataset.drag, p0: pt(e), st: JSON.parse(JSON.stringify(V)) };
    try { svg.setPointerCapture(e.pointerId); } catch (err) { }
    svg.classList.add('dragging'); e.preventDefault();
  });
  svg.addEventListener('pointermove', e => {
    if (!drag) return;
    const p = pt(e), dx = p.x - drag.p0.x, dy = p.y - drag.p0.y;
    if (drag.kind === 'mic') V.calib.x0 = clamp(drag.st.calib.x0 + dx, S.G.x0 - 100 * d10() + 30, 560);
    else if (drag.kind === 'lens') V.calib.lens = clamp(clamp(drag.st.calib.lens, S.LENS.min, S.LENS.max) + dx, S.LENS.min, S.LENS.max);
    else if (drag.kind === 'slide') { const s = S.sc(V.slide.slide === 'leaf' ? 10 : 40), lim = V.slide.slide === 'leaf' ? 400 : 160; V.slide.dx = clamp(drag.st.slide.dx + dx / s, -lim, lim); V.slide.dy = clamp(drag.st.slide.dy + dy / s, -lim, lim); }
    else if (drag.kind === 'ruler') { V.card.rx = clamp(drag.st.card.rx + dx, -300, 580); V.card.ry = clamp(drag.st.card.ry + dy, -60, 600); }
    render();
  });
  const endDrag = () => { if (!drag) return; if (drag.kind === 'mic') snapMic(); drag = null; svg.classList.remove('dragging'); save(); render(); };
  svg.addEventListener('pointerup', endDrag); svg.addEventListener('pointercancel', endDrag);
  /* the buttons under the picture do the same as a drag, for a keyboard or a small screen */
  $('#ctrls').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.set) {
      const [k, v] = b.dataset.set.split(':');
      if (k === 'obj') { V.calib.obj = +v; snapMic(); }
      if (k === 'slide') { V.slide.slide = v; V.slide.dx = 0; V.slide.dy = 0; }
      if (k === 'd') V.draw.d = v;
    }
    const a = b.dataset.act;
    if (a === 'mic') { V.calib.x0 += Number(b.dataset.by) * d10(); snapMic(); }
    if (a === 'micf') { V.calib.x0 += Number(b.dataset.by) * S.U * 0.25; }
    if (a === 'lens') V.calib.lens = clamp(clamp(V.calib.lens, S.LENS.min, S.LENS.max) + Number(b.dataset.by) * S.U * 5, S.LENS.min, S.LENS.max);
    if (a === 'move') { const s = V.slide.slide === 'leaf' ? 20 : 5; V.slide.dx += Number(b.dataset.x || 0) * s; V.slide.dy += Number(b.dataset.y || 0) * s; }
    if (a === 'turn') V.slide.rot = (V.slide.rot + Number(b.dataset.by)) % 360;
    if (a === 'turn0') V.slide.rot = 0;
    if (a === 'ruler') { V.card.rx += Number(b.dataset.x || 0) * S.MM; V.card.ry += Number(b.dataset.y || 0) * S.MM; }
    if (a === 'rturn') V.card.rot = V.card.rot ? 0 : 90;
    save(); render();
  });
  svg.addEventListener('keydown', e => {
    const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; if (!k) return;
    e.preventDefault();
    if (mode === 'calib') { V.calib.x0 += k[0] * S.U * 0.25; }
    else if (mode === 'slide') { V.slide.dx += k[0] * 2; V.slide.dy += k[1] * 2; }
    else if (mode === 'card') { V.card.rx += k[0] * S.MM; V.card.ry += k[1] * S.MM; }
    save(); render();
  });

  /* ---------------- quick checks: a question after each piece of theory ---------------- */
  /* Multiple choice gives nothing away: a new random order each time, options of the same length and detail, the reason
     only with the right answer. The record keeps each option by its place in the list written here. */
  function mcq(d, it, id) {
    const order = it.a.map((txt, i) => [txt, i]);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const list = h('div', { class: 'opts', role: 'group', 'aria-label': 'Choose one answer' }), out = h('p', { 'aria-live': 'polite' }), bs = [], byI = {};
    const say = good => { out.innerHTML = good ? '<span class="ok">✓ Correct.</span> ' + it.why : '<span class="bad">✗ Not this one.</span> Think again, then try another answer.'; };
    order.forEach(([txt, i], k) => {
      const b = h('button', { class: 'opt', type: 'button' }, `<span class="opt__l" aria-hidden="true">${'ABCDE'[k]}</span><span class="opt__t"></span>`);
      b.querySelector('.opt__t').textContent = txt; bs.push(b); byI[i] = b;
      b.addEventListener('click', () => {
        L.check(id, i === it.c, i === it.c ? [] : ['o' + i]);
        b.classList.add(i === it.c ? 'chosen-right' : 'chosen-wrong'); say(i === it.c);
        const s = ans.get(id) || {}, w = (s.w || []).slice(); if (i !== it.c && w.indexOf(i) < 0) w.push(i);
        ans.put(id, { w, ok: !!s.ok || i === it.c, last: i === it.c ? 1 : 0 });
      });
      list.appendChild(b);
    });
    d.appendChild(list); d.appendChild(out);
    const s0 = ans.get(id);
    if (s0) { (s0.w || []).forEach(i => { if (byI[i]) byI[i].classList.add('chosen-wrong'); }); if (s0.ok && byI[it.c]) byI[it.c].classList.add('chosen-right'); if (s0.ok || (s0.w || []).length) say(!!s0.last); }
    return () => { bs.forEach(b => b.classList.remove('chosen-right', 'chosen-wrong')); out.innerHTML = ''; L.restart([id]); };
  }
  function quick(box, q) {
    box.classList.add('qc'); box.innerHTML = '';
    box.appendChild(h('div', { class: 'qc__k' }, 'Quick check'));
    box.appendChild(h('p', { class: 'qc__q' }, q.q));
    reg({ id: q.id, part: q.part, title: q.title, short: q.short, kind: q.kind === 'mcq' ? 'mcq' : 'num', opts: q.kind === 'mcq' ? q.a : undefined });
    if (q.kind === 'mcq') { mcq(box, q, q.id); return; }
    const row = h('div', { class: 'qc__row' });
    const inp = h('input', { type: 'text', class: 'gapin', size: q.kind === 'num' ? 8 : 18, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Your answer' });
    if (q.kind === 'num') inp.setAttribute('inputmode', 'decimal');
    const b = h('button', { class: 'btn', type: 'button' }, 'Check'), out = h('p', { 'aria-live': 'polite' });
    let wrong = 0;
    const ok = v => q.kind === 'num' ? (() => { const x = num(v); return !isNaN(x) && Math.abs(x - q.ans) <= (q.tol || 0) + 1e-9; })() : q.acc.map(norm).includes(norm(v));
    const sayRight = () => { out.innerHTML = '<span class="ok">✓ Correct.</span> ' + q.why; };
    const showAns = () => { out.innerHTML = '<b>' + (q.kind === 'num' ? fmt(q.ans, q.dp || 0) + (q.unit ? ' ' + q.unit : '') : q.acc[0]) + '.</b> ' + q.why; };
    function sayWrong() {
      out.innerHTML = '<span class="bad">✗ Not yet.</span> ' + (wrong >= 2 ? 'Or <button class="linkish" type="button">show the answer</button>.' : 'Think again and try once more.');
      const l = out.querySelector('.linkish'); if (l) l.addEventListener('click', () => { showAns(); ans.put(q.id, { shown: 1 }); });
    }
    b.addEventListener('click', () => {
      const v = inp.value.trim(); if (!v) { out.textContent = 'Type your answer first.'; return; }
      const good = ok(v); L.check(q.id, good, good ? [] : [v.slice(0, 30)]);
      inp.classList.toggle('right', good); inp.classList.toggle('wrong', !good);
      if (good) { ans.put(q.id, { v, st: 'r', ok: 1, wrong }); sayRight(); return; }
      wrong++; ans.put(q.id, { v, st: 'w', wrong }); sayWrong();
    });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); b.click(); } });
    inp.addEventListener('input', () => { inp.classList.remove('right', 'wrong'); ans.put(q.id, { v: inp.value, st: '' }); });
    row.appendChild(inp); if (q.unit) row.appendChild(h('span', { class: 'qc__u' }, q.unit)); row.appendChild(b);
    box.appendChild(row); box.appendChild(out);
    const s0 = ans.get(q.id);
    if (s0) { inp.value = s0.v || ''; wrong = s0.wrong || 0; if (s0.st === 'r') inp.classList.add('right'); else if (s0.st === 'w') inp.classList.add('wrong'); if (s0.shown) showAns(); else if (s0.ok) sayRight(); else if (wrong) sayWrong(); }
  }

  /* ---------------- a set of typed gaps, checked together ----------------
     cfg.gaps: { key: { ok(value, values) → right?, show() → the answer to show } }; or cfg.faults: a set of mistakes
     typed in any order, each found by its own words (re). The answers can be shown only after two complete tries. */
  function gset(box, cfg) {
    reg({ id: cfg.id, part: cfg.part, title: cfg.title, short: cfg.short, kind: 'gaps', gaps: cfg.labels || [] });
    box.classList.add('gset'); box.innerHTML = cfg.html;
    const inputs = () => $$('input.gapin', box);
    const out = h('p', { 'aria-live': 'polite' }), b = h('button', { class: 'btn', type: 'button' }, 'Check');
    const show = h('button', { class: 'btn ghost', type: 'button' }, 'Show the answers'); show.hidden = true;
    let tries = 0;
    const vals = () => { const o = {}; inputs().forEach(i => { o[i.dataset.g] = i.value.trim(); }); return o; };
    function mark() {
      const v = vals(), res = {};
      if (cfg.faults) {
        const used = new Set();
        inputs().forEach(i => { const t = norm(i.value); const k = cfg.faults.findIndex((f, n) => !used.has(n) && f.re.some(r => r.test(t))); if (k >= 0) used.add(k); res[i.dataset.g] = k >= 0; });
      } else inputs().forEach(i => { const g = cfg.gaps[i.dataset.g]; res[i.dataset.g] = !!(g && g.ok(i.value.trim(), v)); });
      return res;
    }
    const keep = o => ans.put(cfg.id, Object.assign({ v: inputs().map(i => i.value), m: inputs().map(i => i.classList.contains('right') ? 'r' : i.classList.contains('wrong') ? 'w' : '') }, o || {}));
    function giveAns() {
      if (cfg.faults) {
        const res = mark(), found = new Set();
        inputs().forEach(i => { if (res[i.dataset.g]) { const t = norm(i.value); const k = cfg.faults.findIndex((f, n) => !found.has(n) && f.re.some(r => r.test(t))); if (k >= 0) found.add(k); } });
        const missed = cfg.faults.filter((_, n) => !found.has(n)).map(f => f.show);
        let note = $('.ans-list', box); if (!note) { note = h('p', { class: 'ans-list' }); out.insertAdjacentElement('beforebegin', note); }
        note.innerHTML = '<b>The mistakes you have not named:</b> ' + missed.join('; ') + '.';
      } else inputs().forEach(i => { if (i.classList.contains('wrong') && !(i.nextElementSibling && i.nextElementSibling.classList.contains('ans'))) i.insertAdjacentHTML('afterend', `<span class="ans">${cfg.gaps[i.dataset.g].show()}</span>`); });
    }
    b.addEventListener('click', () => {
      const g = inputs(); if (g.some(i => !i.value.trim())) { out.textContent = 'Type an answer in every gap first.'; return; }
      tries++; const res = mark(); let ok = 0; const wrongs = [];
      g.forEach((i, k) => { const good = res[i.dataset.g]; if (good) ok++; else wrongs.push((k + 1) + '=' + i.value.trim().slice(0, 24)); i.classList.toggle('right', good); i.classList.toggle('wrong', !good); });
      L.check(cfg.id, ok === g.length, wrongs);
      if (ok === g.length) { out.innerHTML = `<span class="ok">✓ All ${g.length} correct.</span> ${cfg.after || ''}`; show.hidden = true; }
      else { out.innerHTML = `<span class="bad">${ok} of ${g.length} correct.</span> Change the ones marked in red, then check again.` + (tries < 2 ? ' Check your spelling and units too.' : ''); show.hidden = tries < 2; }
      keep({ out: out.innerHTML, tries, sh: show.hidden ? 0 : 1 });
    });
    show.addEventListener('click', () => { giveAns(); show.hidden = true; keep({ sh: 0, sa: 1 }); });
    box.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('input.gapin')) { e.preventDefault(); b.click(); } });
    box.addEventListener('input', e => { if (e.target.matches('input.gapin')) { e.target.classList.remove('right', 'wrong'); keep(); } });
    const again = h('button', { class: 'btn ghost again', type: 'button' }, '↺ Start again');
    again.addEventListener('click', () => { inputs().forEach(i => { i.value = ''; i.classList.remove('right', 'wrong'); }); $$('.ans, .ans-list', box).forEach(a => a.remove()); tries = 0; show.hidden = true; out.innerHTML = ''; L.restart([cfg.id]); });
    const row = h('div', { class: 'gset__btns' }); row.appendChild(b); row.appendChild(show); row.appendChild(again);
    box.appendChild(row); box.appendChild(out);
    const s0 = ans.get(cfg.id), g0 = inputs();
    if (s0 && Array.isArray(s0.v) && s0.v.length === g0.length) {
      g0.forEach((i, k) => { i.value = s0.v[k] || ''; const m = (s0.m || [])[k]; if (m) i.classList.add(m === 'r' ? 'right' : 'wrong'); });
      tries = s0.tries || 0; if (s0.out) out.innerHTML = s0.out; show.hidden = !s0.sh; if (s0.sa) giveAns();
    }
  }
  /* an input for a set: data-g names it, size its width */
  const gin = (g, size, dec) => `<input class="gapin" type="text" data-g="${g}" size="${size || 8}"${dec ? ' inputmode="decimal"' : ''} autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Type the missing ${dec ? 'number' : 'word'}">`;

  /* ---------------- the parts: one open at a time, as tabs along the top ---------------- */
  const NPART = $$('.part').length;
  const partTitle = n => { const b = $('#tab-' + n); return b ? b.textContent.replace(/^\d+/, '').trim() : ''; };
  let seen = store.get('seen', []);
  $$('.part').forEach((p, i) => {
    const n = i + 1, h2 = $('h2', p);
    if (h2) h2.insertAdjacentHTML('beforebegin', `<p class="partno">Part ${n} of ${NPART}</p>`);
    const nav = h('nav', { class: 'partnav', 'aria-label': 'Move between parts' });
    if (n > 1) { const b = h('button', { type: 'button', class: 'back' }, '← ' + (n - 1) + ' · ' + partTitle(n - 1)); b.addEventListener('click', () => show(n - 1)); nav.appendChild(b); }
    if (n < NPART) { const b = h('button', { type: 'button', class: 'next' }, 'Next: ' + (n + 1) + ' · ' + partTitle(n + 1) + ' →'); b.addEventListener('click', () => show(n + 1)); nav.appendChild(b); }
    p.appendChild(nav);
  });
  function show(n, keepScroll) {
    if (seen.indexOf(n) < 0) { seen.push(n); store.set('seen', seen); }
    $$('.tabs button').forEach((b, i) => { b.setAttribute('aria-selected', String(i + 1 === n)); b.classList.toggle('seen', seen.indexOf(i + 1) >= 0); });
    const tab = $('#tab-' + n); if (tab && tab.scrollIntoView) tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    $$('.part').forEach((p, i) => p.classList.toggle('open', i + 1 === n));
    const part = $('#part-' + n); mode = part.dataset.mode;
    document.body.classList.toggle('photo-on', part.hasAttribute('data-pin'));
    render(); stageH();
    if (!keepScroll) part.scrollIntoView({ block: 'start' });
    try { history.replaceState(null, '', '#part-' + n); } catch (e) { }
    progressSoon();
  }
  $$('.tabs button').forEach((b, i) => b.addEventListener('click', () => show(i + 1)));
  /* a part's own buttons can set the picture: data-view="slide:leaf", "d:B" */
  document.addEventListener('click', e => {
    const b = e.target.closest ? e.target.closest('[data-view]') : null; if (!b) return;
    const [k, v] = b.dataset.view.split(':');
    if (k === 'slide') { V.slide.slide = v; V.slide.dx = 0; V.slide.dy = 0; V.slide.rot = 0; }
    if (k === 'd') V.draw.d = v;
    save(); render();
    if (window.innerWidth <= 1000) $('.stage').scrollIntoView({ block: 'nearest' });
  });
  function wordBank(open) { $('#wb').hidden = !open; $('#wbBtn').setAttribute('aria-expanded', String(open)); }
  $('#wbBtn').addEventListener('click', () => wordBank($('#wb').hidden));
  $('#wbClose').addEventListener('click', () => wordBank(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#wb').hidden) wordBank(false); });
  /* cards open in place, one at a time in a part; the card pressed stays where it is on the screen */
  document.addEventListener('click', e => {
    const sum = e.target.closest ? e.target.closest('details.fold > summary') : null; if (!sum) return;
    const d = sum.parentElement, part = d.closest('.part'); if (d.open || !part) return;
    const before = sum.getBoundingClientRect().top;
    $$('details.fold[open]', part).forEach(o => { if (o !== d && !o.contains(d) && !d.contains(o)) o.open = false; });
    const after = sum.getBoundingClientRect().top;
    if (Math.abs(after - before) > 0.5) window.scrollBy({ top: after - before, left: 0, behavior: 'instant' });
  }, true);
  function stageH() {
    const root = document.documentElement.style, bar = $('#partbar');
    root.setProperty('--bar-h', (bar ? bar.offsetHeight : 0) + 'px');
    root.setProperty('--stage-h', document.body.classList.contains('photo-on') && window.innerWidth <= 1000 ? $('.stage').offsetHeight + 'px' : '0px');
  }
  window.addEventListener('resize', stageH);

  window.MicroApp = { S, V, h, fmt, norm, num, L, reg, manifest, ans, quick, mcq, gset, gin, render, show };
  const m0 = /#part-(\d+)/.exec(location.hash);
  document.addEventListener('DOMContentLoaded', () => { });
  window.addEventListener('load', stageH);
  MicroApp.start = () => show(m0 ? Math.min(NPART, +m0[1]) : 1, true);
})();
