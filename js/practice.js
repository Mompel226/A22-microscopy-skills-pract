/* A2.2.2 microscopy skills · the questions (18 Oct 2026): the typed sets of each part and the quick checks.
   Board ids: p<part>-<name>, kept when a question is reworded (a new id moves its pupils' records to a new square).
   The specimens, numbers and micrographs are made for this page. */
(function () {
  'use strict';
  const A = window.MicroApp, $ = (s, el) => (el || document).querySelector(s), $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const { S, num, norm, gin, fmt } = A;
  const U40 = S.EPU[40], U10 = S.EPU[10];                       // 2.353 and 9.412 µm per eyepiece unit
  const near = (v, want, tol) => { const x = num(v); return !isNaN(x) && Math.abs(x - want) <= tol + 1e-9; };
  const words = (...acc) => v => acc.map(norm).includes(norm(v));

  /* ---------- part 1: the calibration ---------- */
  const PAIRS = [1, 2, 3, 4, 5].map(k => [17 * k, 4 * k]);        // at ×400, 17 EPU = 4 divisions, 34 = 8 … 85 = 20
  const pairOK = (vals) => PAIRS.some(([e, s]) => num(vals.e) === e && num(vals.s) === s);
  A.gset($('[data-gs="p1-cal"]'), {
    id: 'p1-cal', part: 1, title: 'Calibrate the graticule at ×400', short: 'Cal', labels: ['EPU', 'divisions', 'µm per EPU'],
    html: `<h3>Your calibration at ×400</h3>
      <p class="mrow">1. After the 0 lines, the lines of the two scales meet exactly again at ${gin('e', 5, 1)} eyepiece units and ${gin('s', 5, 1)} stage micrometer divisions.</p>
      <p class="mrow">2. One eyepiece unit = ${gin('u', 6, 1)} µm (2 decimal places).</p>`,
    gaps: {
      e: { ok: (v, all) => pairOK(all), show: () => '17 (or 34, 51, 68, 85)' },
      s: { ok: (v, all) => pairOK(all), show: () => '4 (or 8, 12, 16, 20)' },
      u: { ok: v => near(v, U40, 0.05), show: () => '4 × 10 µm ÷ 17 = 2.35' }
    },
    after: 'You calibrated this microscope at ×400: <b>1 eyepiece unit = 2.35 µm</b>. Part 2 uses this value.'
  });

  /* ---------- part 2: three cheek cells, then their mean ---------- */
  const CELL = { A: 62, B: 55, C: 70 };                            // µm, the longest length of each cell (js/scope.js)
  const epuOK = k => v => near(v, CELL[k] / U40, 1.5);
  const umOK = k => (v, all) => { const e = num(all[k + 'e']), u = num(v); return !isNaN(e) && !isNaN(u) && Math.abs(u - e * U40) <= Math.max(1, 0.03 * u); };
  const shows = k => () => `about ${Math.round(CELL[k] / U40)} EPU × 2.35 = ${Math.round(Math.round(CELL[k] / U40) * U40)} µm`;
  A.gset($('[data-gs="p2-measure"]'), {
    id: 'p2-measure', part: 2, title: 'Measure three cheek cells', short: 'Cells', labels: ['A EPU', 'A µm', 'B EPU', 'B µm', 'C EPU', 'C µm', 'mean'],
    html: `<h3>Your measurements at ×400 (1 EPU = 2.35 µm)</h3>
      <table class="data gtab"><thead><tr><th>Cell</th><th>Length / EPU</th><th>Length / µm</th></tr></thead><tbody>
      ${['A', 'B', 'C'].map(k => `<tr><td>${k}</td><td>${gin(k + 'e', 5, 1)}</td><td>${gin(k + 'u', 6, 1)}</td></tr>`).join('')}
      </tbody></table>
      <p class="mrow">Mean length of the three cells = ${gin('m', 6, 1)} µm (to the nearest whole number).</p>`,
    gaps: {
      Ae: { ok: epuOK('A'), show: shows('A') }, Au: { ok: umOK('A'), show: () => 'your EPU × 2.35' },
      Be: { ok: epuOK('B'), show: shows('B') }, Bu: { ok: umOK('B'), show: () => 'your EPU × 2.35' },
      Ce: { ok: epuOK('C'), show: shows('C') }, Cu: { ok: umOK('C'), show: () => 'your EPU × 2.35' },
      m: { ok: (v, all) => { const us = ['Au', 'Bu', 'Cu'].map(k => num(all[k])); if (us.some(isNaN)) return false; const m = us.reduce((a, b) => a + b, 0) / 3; return near(v, m, 0.6); },
           show: () => '(A + B + C) ÷ 3, from your own lengths in µm' }
    },
    after: 'Real cheek cells are about 50–80 µm long. The mean of several cells is more reliable than one cell.'
  });

  /* ---------- part 3: the printed micrograph ---------- */
  A.gset($('[data-gs="p3-bar"]'), {
    id: 'p3-bar', part: 3, title: 'Magnification and actual size from a scale bar', short: 'Bar', labels: ['bar mm', 'magnification', 'length mm', 'actual µm'],
    html: `<h3>Measure, then calculate</h3>
      <p class="mrow">1. On the page, the 50 µm scale bar is ${gin('bar', 5, 1)} mm long.</p>
      <p class="mrow">2. Magnification = image size ÷ actual size = ×${gin('mag', 6, 1)}</p>
      <p class="mrow">3. On the page, the Paramecium is ${gin('len', 5, 1)} mm long, from one end of its body to the other (not the cilia).</p>
      <p class="mrow">4. Its actual length = ${gin('act', 6, 1)} µm.</p>`,
    gaps: {
      bar: { ok: v => near(v, 20, 0.5), show: () => '20 mm' },
      mag: { ok: (v, all) => { const b = num(all.bar), m = num(v); return !isNaN(b) && !isNaN(m) && near(all.bar, 20, 0.5) && Math.abs(m - b * 1000 / 50) <= 0.01 * m + 0.5; }, show: () => '20 mm = 20 000 µm; 20 000 ÷ 50 = ×400' },
      len: { ok: v => near(v, 88, 1), show: () => '88 mm' },
      act: { ok: (v, all) => { const l = num(all.len), m = num(all.mag), a = num(v); return !isNaN(l) && !isNaN(m) && m > 0 && !isNaN(a) && Math.abs(a - l * 1000 / m) <= 0.02 * a + 0.5; }, show: () => '88 000 µm ÷ 400 = 220 µm' }
    },
    after: 'Paramecium is about 180–300 µm long: a check that your answer makes sense.'
  });
  A.gset($('[data-gs="p3-draw"]'), {
    id: 'p3-draw', part: 3, title: 'A scale bar for your own drawing', short: 'Own', labels: ['magnification', 'bar mm'],
    html: `<h3>A scale bar for your drawing</h3>
      <p>You draw the same Paramecium (actual length 220 µm) 120 mm long.</p>
      <p class="mrow">1. The magnification of your drawing = ×${gin('dm', 6, 1)} (to the nearest whole number).</p>
      <p class="mrow">2. A 50 µm scale bar on your drawing must be ${gin('db', 5, 1)} mm long (1 decimal place).</p>`,
    gaps: {
      dm: { ok: v => near(v, 120000 / 220, 3), show: () => '120 000 µm ÷ 220 µm = ×545' },
      db: { ok: v => near(v, 50 * 120 / 220, 0.4), show: () => '50 µm × 545 = 27 300 µm = 27.3 mm' }
    },
    after: 'Draw the bar this long under your drawing and write 50 µm above it.'
  });

  /* ---------- part 4: the rules, then three drawings ---------- */
  A.gset($('[data-gs="p4-rules"]'), {
    id: 'p4-rules', part: 4, title: 'Recall the rules for a drawing', short: 'Rules', labels: ['large', 'continuous', 'shading', 'ruler', 'touch', 'cross', 'see', 'graticule'],
    html: `<h3>Recall the rules</h3>
      <p class="mrow"><b class="sold">S</b> Size: draw it ${gin('large', 6)}, so that it fills the space.</p>
      <p class="mrow"><b class="sold">O</b> Outline: one clear, ${gin('cont', 10)} line for each edge, and no ${gin('shade', 8)}.</p>
      <p class="mrow"><b class="sold">L</b> Labels: draw each label line with a ${gin('ruler', 7)}. Each line must ${gin('touch', 7)} the structure it labels, and no two lines may ${gin('cross', 6)}.</p>
      <p class="mrow"><b class="sold">D</b> Detail: draw only what you can ${gin('see', 6)}.</p>
      <p class="mrow"><b class="sold sc">+</b> Scale: give the real size with a scale bar, from the cell length you measured with the eyepiece ${gin('grat', 10)}.</p>`,
    gaps: {
      large: { ok: words('large', 'big', 'very large'), show: () => 'large' },
      cont: { ok: words('continuous', 'unbroken', 'single', 'solid', 'smooth'), show: () => 'continuous' },
      shade: { ok: words('shading', 'shade', 'shadings'), show: () => 'shading' },
      ruler: { ok: words('ruler', 'rule', 'straight edge'), show: () => 'ruler' },
      touch: { ok: words('touch', 'touches', 'reach', 'meet'), show: () => 'touch' },
      cross: { ok: words('cross', 'cross each other', 'overlap', 'intersect'), show: () => 'cross' },
      see: { ok: words('see', 'observe', 'see down the microscope', 'see clearly'), show: () => 'see' },
      grat: { ok: words('graticule', 'eyepiece graticule', 'graticle', 'reticule'), show: () => 'graticule' }
    },
    after: 'These rules make a drawing clear, accurate and easy to read.'
  });
  const F = {
    shading: { re: [/shad|hatch|colou?r(ed)? in|filled in|darkened/], show: 'shading' },
    sketchy: { re: [/sketch|broken|not continuous|discontinu|\bgaps?\b|double|many lines|several lines|hairy|messy|rough|not one line|not clear|overlapp/], show: 'sketchy lines with gaps (not one continuous line)' },
    arrow: { re: [/arrow/], show: 'an arrowhead on a label line' },
    small: { re: [/small|tiny|size|space|half|not large|bigger|larger/], show: 'the drawing is too small (less than half the space)' },
    cross: { re: [/cross/], show: 'label lines cross' },
    inside: { re: [/inside|on the drawing|in the drawing|within|on top|written on|no (label )?line|without (a )?line|not outside/], show: 'a label is written on the drawing, with no label line' },
    scale: { re: [/scale|magnification|no size|actual size|real size/], show: 'no scale bar (and no magnification)' },
    touch: { re: [/touch|short|reach|stops?\b|gap|not (meet|reaching|meeting)|end(s)? before/], show: 'a label line does not touch its structure' },
    unseen: { re: [/cannot be seen|can't be seen|cant be seen|not (be )?seen|not visible|invisible|ribosome|too small|electron|only what|light microscope|cannot see|can't see/], show: 'ribosomes cannot be seen with a light microscope (label only what you see)' }
  };
  [['A', ['shading', 'sketchy', 'arrow']], ['B', ['small', 'cross', 'inside']], ['C', ['scale', 'touch', 'unseen']]].forEach(([d, fs]) => {
    A.gset($(`[data-gs="p4-${d.toLowerCase()}"]`), {
      id: 'p4-' + d.toLowerCase(), part: 4, title: 'Three mistakes in drawing ' + d, short: d, labels: ['mistake 1', 'mistake 2', 'mistake 3'],
      html: `<h3>Drawing ${d} <button class="linkbtn" type="button" data-view="d:${d}">Show drawing ${d}</button></h3>
        <p class="note">Type each mistake in a few words, in any order.</p>
        <p class="mrow">1. ${gin('f1', 26)}</p><p class="mrow">2. ${gin('f2', 26)}</p><p class="mrow">3. ${gin('f3', 26)}</p>`,
      faults: fs.map(k => F[k]),
      after: d === 'C' ? 'Without a scale bar nobody can tell how large the cells really are.' : ''
    });
  });

  /* ---------- quick checks ---------- */
  const QC = {
    'p1-qc-1': { part: 1, short: 'q1', title: 'One eyepiece unit at ×100', kind: 'num', ans: U10, tol: 0.03, dp: 2, unit: 'µm',
      q: 'You change to the ×10 objective (×100 in total). What is one eyepiece unit now, in µm? Give 2 decimal places. You can switch the objective under the picture to check.',
      why: 'At ×100 the slide looks 4 times smaller, so one eyepiece unit covers 4 times as much of it: 2.35 × 4 = 9.41 µm. On the scales: 17 EPU = 16 divisions = 160 µm, and 160 ÷ 17 = 9.41 µm.' },
    'p1-qc-2': { part: 1, short: 'q2', title: 'Why calibrate for each objective?', kind: 'mcq', c: 0,
      q: 'Why must you calibrate the graticule again for each objective lens?',
      a: ['The graticule is in the eyepiece, so it looks the same at every objective, while the slide is magnified more or less.',
          'The stage micrometer is in the eyepiece, so its divisions change with the objective, while the graticule stays the same size.',
          'A stronger objective makes the divisions of the graticule shrink, so each one stands for a longer length on the slide.',
          'Each objective lens changes the focus of the eyepiece, so the graticule moves away from its 0 line after every change.'],
      why: 'The graticule is magnified only by the eyepiece; the slide is magnified by the eyepiece and the objective. Change the objective and one eyepiece unit covers a different length of the slide.' },
    'p2-qc-1': { part: 2, short: 'q1', title: 'A cell at an angle to the scale', kind: 'mcq', c: 0,
      q: 'The longest axis of the cell you want to measure is at an angle to the scale. What should you do?',
      a: ['Turn the eyepiece until the scale lies along the longest axis, then count the units from one edge to the other.',
          'Count the units straight across the cell as it lies, then add the angle between the cell and the scale to the answer.',
          'Change to the ×10 objective, so that the cell becomes small enough to lie along the scale at any angle you choose.',
          'Measure the cell with a ruler held against the slide, because the scale only works for cells that already lie along it.'],
      why: 'Turning the eyepiece turns the graticule while the slide stays still. The scale then lies across the length you want, and your calibration still holds.' },
    'p2-qc-2': { part: 2, short: 'q2', title: 'A row of leaf cells', kind: 'num', ans: 60 * U10 / 7, tol: 0.7, dp: 1, unit: 'µm',
      q: 'Show the leaf epidermis peel (×100) with the button above. In one row, 7 epidermal cells fill 60 eyepiece units. At ×100, 1 EPU = 9.41 µm. Calculate the mean length of one cell, in µm, to 1 decimal place.',
      why: '60 EPU × 9.41 µm = 565 µm for 7 cells; 565 ÷ 7 = 80.7 µm. Measuring a row of cells and dividing gives a mean in one step.' },
    'p3-qc-1': { part: 3, short: 'q1', title: 'Actual size in an electron micrograph', kind: 'num', ans: 2.5, tol: 0.01, dp: 1, unit: 'µm',
      q: 'In an electron micrograph at ×20 000, a mitochondrion is 50 mm long. What is its actual length, in µm?',
      why: '50 mm = 50 000 µm. Actual size = image size ÷ magnification = 50 000 ÷ 20 000 = 2.5 µm.' },
    'p3-qc-2': { part: 3, short: 'q2', title: 'A mistake with units', kind: 'mcq', c: 0,
      q: 'A student measures a 10 µm scale bar as 25 mm and writes: magnification = 25 ÷ 10 = ×2.5. What went wrong?',
      a: ['The two lengths are in different units: 25 mm is 25 000 µm, so the magnification is 25 000 ÷ 10 = ×2500.',
          'The division is the wrong way round: magnification = 10 ÷ 25 = ×0.4, because the scale bar is the smaller length.',
          'Nothing went wrong: a magnification is always the length of the scale bar divided by the number written beside it.',
          'The scale bar must be measured in centimetres, so the magnification is 2.5 ÷ 10 = ×0.25, which is smaller again.'],
      why: 'Use the same unit for both lengths: 25 mm × 1000 = 25 000 µm, and 25 000 ÷ 10 = ×2500. A magnification below ×1 would mean the image is smaller than the object.' },
    'p5-qc-1': { part: 5, short: 'q1', title: 'A photo with no scale in it', kind: 'mcq', c: 0,
      q: 'Your photo shows sharp cells, but no part of the graticule scale. What can nobody check from this photo?',
      a: ['The size you measured for the cell, because nothing in the photo shows the scale you used.',
          'The colour of the cells, because a phone cannot show the colours seen through an eyepiece.',
          'The shape of the cells, because a photo taken through an eyepiece always distorts it.',
          'Whether the cells are in focus, because a photo is always sharper than the view by eye.'],
      why: 'With the graticule in the photo, anyone can count the eyepiece units across the cell and check the size you give.' }
  };
  $$('[data-qc]').forEach(b => { const q = QC[b.dataset.qc]; if (q) A.quick(b, Object.assign({ id: b.dataset.qc }, q)); });

  A.start();
  /* tools/make-questions.mjs opens the page with ?manifest=1 in headless Chrome and writes data/questions.json from this */
  if (/[?&]manifest=1(&|$)/.test(location.search)) { const pre = document.createElement('pre'); pre.id = 'manifest'; pre.textContent = JSON.stringify(A.manifest(), null, 1); document.body.appendChild(pre); }
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    fetch('data/questions.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(j => {
      if (!j || JSON.stringify(j) !== JSON.stringify(A.manifest())) console.warn('data/questions.json does not match this page: run node tools/make-questions.mjs');
      else console.info('data/questions.json matches this page');
    }).catch(() => console.warn('data/questions.json could not be read'));
  }
})();
