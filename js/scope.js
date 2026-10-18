/* A2.2.2 microscopy skills · scope.js — every picture on the left, drawn as SVG for this page (18 Oct 2026).
   The views down the microscope (the eyepiece graticule over a stage micrometer, cheek cells, a leaf epidermis peel), a
   micrograph as printed in an exam paper with a ruler, the practice drawings, and a phone at the eyepiece.
   The specimens are human cheek cells and a leaf epidermis peel, and a Paramecium on the printed page.

   One microscope for the whole page: at ×400 (the ×40 objective), 17 eyepiece units (EPU) match 4 stage-micrometer
   divisions (4 × 10 µm), so 1 EPU = 40 ÷ 17 = 2.35 µm; at ×100 it is 4 times as much, 9.41 µm. Every size on the page
   follows from that: a cell drawn 62 µm long really spans 62 ÷ 2.35 = 26.4 EPU of the graticule. */
(function () {
  'use strict';
  const EPU = { 40: 40 / 17, 10: 160 / 17 };            // µm per eyepiece unit, by objective
  const G = { x0: 60, x1: 540, cy: 300, r: 282 };         // the graticule: 0–100 EPU from x0 to x1, in the eyepiece
  const U = (G.x1 - G.x0) / 100;                          // svg units per EPU (4.8)
  const sc = obj => U / EPU[obj];                         // svg units per µm on the slide, at this objective
  const f2 = x => (Math.round(x * 100) / 100).toString();

  /* a small seeded random generator, so every drawing is the same on every visit */
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* a closed, smooth outline through points (Catmull-Rom), sampled densely */
  function smooth(P, per) {
    const n = P.length, out = [];
    for (let i = 0; i < n; i++) {
      const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
      for (let k = 0; k < (per || 10); k++) {
        const t = k / (per || 10), t2 = t * t, t3 = t2 * t;
        out.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
                  0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
      }
    }
    return out;
  }
  const pathOf = (pts, close) => 'M' + pts.map(p => f2(p[0]) + ' ' + f2(p[1])).join(' L') + (close === false ? '' : ' Z');
  function feret(pts) { let m = 0, a = null, b = null; for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]); if (d > m) { m = d; a = pts[i]; b = pts[j]; } } return { len: m, a, b }; }
  function inside(p, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (((yi > p[1]) !== (yj > p[1])) && (p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi)) c = !c; } return c; }

  /* a flattened cheek cell (µm): an irregular, slightly long outline, scaled so its longest length is exactly `len` */
  function cheekShape(len, ang, seed) {
    const r = rng(seed), n = 9, P = [];
    for (let k = 0; k < n; k++) {
      const a = 2 * Math.PI * k / n + (r() - 0.5) * 0.45, rad = 1 + (r() - 0.5) * 0.36;
      P.push([Math.cos(a) * rad * 1.22, Math.sin(a) * rad / 1.1]);
    }
    let S = smooth(P, 12);
    const ca = Math.cos(ang), sa = Math.sin(ang);
    S = S.map(([x, y]) => [x * ca - y * sa, x * sa + y * ca]);
    const k = len / feret(S).len;
    return S.map(([x, y]) => [x * k, y * k]);
  }

  /* ---------------- the field of view: a bright circle in the dark of the eyepiece ---------------- */
  let uid = 0;
  function field(inner, over) {
    const id = 'f' + (++uid);
    return `<defs><clipPath id="c${id}"><circle cx="300" cy="300" r="${G.r}"/></clipPath>
      <radialGradient id="l${id}" cx="50%" cy="46%" r="58%"><stop offset="0" stop-color="#FFFEF9"/><stop offset=".72" stop-color="#F3F1E8"/><stop offset="1" stop-color="#DAD7C9"/></radialGradient>
      <radialGradient id="v${id}" cx="50%" cy="50%" r="50%"><stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></radialGradient></defs>
      <rect width="600" height="600" fill="#0E1015"/>
      <g clip-path="url(#c${id})"><circle cx="300" cy="300" r="${G.r}" fill="url(#l${id})"/>${inner}<circle cx="300" cy="300" r="${G.r}" fill="url(#v${id})" pointer-events="none"/></g>
      <circle cx="300" cy="300" r="${G.r}" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="5" pointer-events="none"/>${over || ''}`;
  }

  /* the eyepiece graticule: 100 divisions, a long line every 10 with its number above. named: its name under the right
     end of the line, turning with it (the slides of part 2; part 1 names both scales in calib) */
  function graticule(rot, named) {
    let t = '', n = '';
    for (let i = 0; i <= 100; i++) {
      const x = G.x0 + i * U, L = i % 10 === 0 ? 20 : i % 5 === 0 ? 13 : 7;
      t += `<line x1="${f2(x)}" y1="${G.cy}" x2="${f2(x)}" y2="${G.cy - L}"/>`;
      if (i % 10 === 0) n += `<text x="${f2(x)}" y="${G.cy - 26}">${i}</text>`;
    }
    const name = named ? `<text class="grat__name" x="${G.x1}" y="${G.cy + 24}">eyepiece graticule</text>` : '';
    return `<g class="grat" transform="rotate(${f2(rot || 0)} 300 300)" pointer-events="none"><line x1="${G.x0}" y1="${G.cy}" x2="${G.x1}" y2="${G.cy}"/>${t}${n}${name}</g>`;
  }

  /* the stage micrometer: 1 mm in 100 divisions of 10 µm, a number every 10 divisions (0.1 mm); x0 = its 0 line */
  function micrometer(obj, x0) {
    const d = 10 * sc(obj); let t = '', n = '';
    for (let j = 0; j <= 100; j++) {
      const x = x0 + j * d; if (x < -30 || x > 630) continue;
      const L = j % 10 === 0 ? 20 : j % 5 === 0 ? 13 : 7;
      t += `<line x1="${f2(x)}" y1="${G.cy + 4}" x2="${f2(x)}" y2="${G.cy + 4 + L}"/>`;
      if (j % 10 === 0) n += `<text x="${f2(x)}" y="${G.cy + 44}">${j / 10}</text>`;
    }
    const xa = Math.max(-30, x0), xb = Math.min(630, x0 + 100 * d);
    return `<g class="mic" data-drag="mic"><rect class="mic__glass" x="-30" y="${G.cy + 3}" width="660" height="58"/>${xb > xa ? `<line x1="${f2(xa)}" y1="${G.cy + 4}" x2="${f2(xb)}" y2="${G.cy + 4}"/>` : ''}${t}${n}</g>`;
  }

  /* Part 1: the graticule over the stage micrometer, with a lens that shows four times closer what is inside its orange
     frame. Both scales are named on the picture, and the next step is written at its top (Daniel, 18 Oct 2026: "label
     it, so it's obvious"; "it's not clear that you can move the lens"). The lens shows 28 EPU, so the 0 line and the
     first exact match (17 EPU, at ×400 and at ×100) fit in it together, with room on both sides.
     Every text has a wide version (.vw) and a short one (.vn); the stylesheet shows the short one in a narrow picture. */
  const LENS = { x: 30, y: 398, w: 540, h: 110, mag: 4 };
  LENS.sw = LENS.w / LENS.mag; LENS.sh = LENS.h / LENS.mag;
  LENS.min = G.x0 + LENS.sw / 2 - 30; LENS.max = G.x1 - LENS.sw / 2 + 30;   // the frame's middle stays near the scale
  function onZero(st) { const d = 10 * sc(st.obj), j = Math.round((G.x0 - st.x0) / d); return j >= 0 && j <= 100 && Math.abs(st.x0 + j * d - G.x0) < 0.02; }
  const K = s => `<tspan class="k">${s}</tspan>`, BL = s => `<tspan class="kb">${s}</tspan>`, OR = s => `<tspan class="ko">${s}</tspan>`;
  function hintBox(lines, cls, y0, w, lh) {
    const hh = lines.length * lh + 18;
    return `<g class="vhint ${cls}"><rect x="${f2(300 - w / 2)}" y="${y0}" width="${w}" height="${hh}" rx="14"/>` +
      lines.map((l, i) => `<text x="300" y="${f2(y0 + 9 + lh * (i + 0.72))}">${l}</text>`).join('') + '</g>';
  }
  function calibHint(st) {
    const A = !onZero(st);
    const wide = A ? [`First, drag the ${BL('blue scale')} until one of its`, `lines sits exactly on 0 of the ${K('black scale')}.`]
      : [`Next, drag the ${OR('orange frame')} along the scales.`, `Find where a ${K('black line')} and a ${BL('blue line')} meet`, 'exactly again (nearly is not enough).'];
    const short = A ? [`First, drag the ${BL('blue scale')}`, 'until one of its lines sits', 'exactly on 0.']
      : [`Next, drag the ${OR('orange frame')}.`, `Find a ${K('black')} and a ${BL('blue')} line`, 'that meet exactly again.'];
    return `<g pointer-events="none">${hintBox(wide, 'vw', A ? 136 : 122, 436, 24)}${hintBox(short, 'vn', 98, 404, 31)}</g>`;
  }
  function calibNames() {
    return `<g class="vname" pointer-events="none">
      <g class="vw"><text class="vname__g" x="300" y="240"><tspan class="k">Eyepiece graticule</tspan> (in the eyepiece)</text>
        <text class="vname__m" x="300" y="385"><tspan class="k">Stage micrometer</tspan> (on the stage) · 1 division = 10 µm</text></g>
      <g class="vn"><text class="vname__g" x="300" y="241"><tspan class="k">Eyepiece graticule</tspan></text>
        <text class="vname__m" x="300" y="388"><tspan class="k">Stage micrometer</tspan></text></g></g>`;
  }
  function calib(st) {
    const scales = graticule(0) + micrometer(st.obj, st.x0);
    if (st.nolens) return field(scales);   // the deck's pictures of the first steps: the two scales only
    const { x: LX, y: LY, w: LW, h: LH, mag: MAG, sw, sh } = LENS;
    const fx = Math.max(LENS.min, Math.min(LENS.max, st.lens));
    const lens = `<g class="lensmark" data-drag="lens"><rect x="${f2(fx - sw / 2)}" y="${f2(G.cy - sh / 2)}" width="${f2(sw)}" height="${f2(sh)}" rx="3"/></g>`;
    const inset = `<g class="inset" pointer-events="none"><rect x="${LX - 3}" y="${LY - 3}" width="${LW + 6}" height="${LH + 6}" rx="10" class="inset__frame"/>
      <svg x="${LX}" y="${LY}" width="${LW}" height="${LH}" viewBox="${f2(fx - sw / 2)} ${f2(G.cy - sh / 2)} ${f2(sw)} ${f2(sh)}"><rect x="-50" y="0" width="700" height="600" fill="#F6F4EC"/>${scales}</svg>
      <text class="inset__t vw" x="${LX + 12}" y="${LY + LH - 10}">Lens ×${MAG}: what is inside the orange frame</text>
      <text class="inset__t vn" x="${LX + 12}" y="${LY + LH - 10}">Lens ×${MAG}</text></g>`;
    return field(scales + lens + calibNames(), inset + calibHint(st));
  }

  /* ---------------- the slides: cheek cells (×400) and a leaf epidermis peel (×100) ---------------- */
  const CHEEK = [   // µm from the middle of the slide; len = the longest length, the one pupils measure
    { k: 'A', x: -64, y: -36, len: 62, ang: 0.32, seed: 11 },
    { k: 'B', x: 56, y: 40, len: 55, ang: -0.62, seed: 23 },
    { k: 'C', x: 18, y: -94, len: 70, ang: 1.15, seed: 37 },
    { k: '', x: -40, y: 70, len: 58, ang: 2.2, seed: 51 },
    { k: '', x: 118, y: -46, len: 64, ang: 0.9, seed: 63 },
    { k: '', x: -150, y: 52, len: 60, ang: -0.2, seed: 77 }
  ];
  const cells = CHEEK.map(c => {
    const S = cheekShape(c.len, c.ang, c.seed).map(([x, y]) => [x + c.x, y + c.y]);
    const r = rng(c.seed + 5), coarse = S.filter((_, i) => i % 4 === 0), dots = [];
    const xs = S.map(p => p[0]), ys = S.map(p => p[1]);
    const bx = [Math.min(...xs), Math.max(...xs)], by = [Math.min(...ys), Math.max(...ys)];
    for (let tries = 0; dots.length < 46 && tries < 900; tries++) {
      const p = [bx[0] + r() * (bx[1] - bx[0]), by[0] + r() * (by[1] - by[0])];
      if (inside(p, coarse)) dots.push([p[0], p[1], 0.35 + r() * 0.5]);
    }
    const nx = c.x + (r() - 0.5) * c.len * 0.12, ny = c.y + (r() - 0.5) * c.len * 0.12;
    return Object.assign({}, c, { S, dots, nx, ny, nang: r() * 180, box: { bx, by } });
  });

  function cheekSlide(st, s) {
    const X = x => 300 + (x + st.dx) * s, Y = y => 300 + (y + st.dy) * s;
    let g = '';
    cells.forEach(c => {
      const P = c.S.map(([x, y]) => [X(x), Y(y)]);
      g += `<path class="ck" d="${pathOf(P)}"/>`;
      g += c.dots.map(([x, y, rr]) => `<circle class="ck__g" cx="${f2(X(x))}" cy="${f2(Y(y))}" r="${f2(rr * s)}"/>`).join('');
      g += `<ellipse class="ck__n" cx="${f2(X(c.nx))}" cy="${f2(Y(c.ny))}" rx="${f2(4.8 * s)}" ry="${f2(3.8 * s)}" transform="rotate(${f2(c.nang)} ${f2(X(c.nx))} ${f2(Y(c.ny))})"/>`;
      if (c.k) {
        const tx = X(c.box.bx[0]) - 4, ty = Y(c.box.by[0]) + 2;
        g += `<g class="tag"><circle cx="${f2(tx)}" cy="${f2(ty)}" r="11"/><text x="${f2(tx)}" y="${f2(ty + 4.5)}">${c.k}</text></g>`;
      }
    });
    return g;
  }

  /* a leaf epidermis peel (lower surface), drawn after Tradescantia: long six-sided cells in rows, stomata with guard cells.
     A row of 7 cells is 60 EPU long at ×100 (each cell 80.7 µm), as the quick check in part 2 says. */
  const LEAF = { L: 60 * EPU[10] / 7, H: 44, e: 14 };
  function leafSlide(st, s) {
    const { L, H, e } = LEAF, X = x => 300 + (x + st.dx) * s, Y = y => 300 + (y + st.dy) * s;
    const r = rng(9), stom = new Set(['-2,1', '3,-1', '1,3', '-4,-3', '5,2', '-1,-4', '4,-4', '-5,3']);
    let g = '';
    for (let row = -8; row <= 8; row++) for (let col = -9; col <= 9; col++) {
      const cx = col * L + (row & 1 ? L / 2 : 0) + ((row * 37) % 11 - 5) * 2.4, cy = row * H, j = () => (r() - 0.5) * 9;
      const P = [[cx - L / 2 + j(), cy + j()], [cx - L / 2 + e + j(), cy - H / 2], [cx + L / 2 - e + j(), cy - H / 2], [cx + L / 2 + j(), cy + j()], [cx + L / 2 - e + j(), cy + H / 2], [cx - L / 2 + e + j(), cy + H / 2]];
      const sx = X(cx), sy = Y(cy); if (sx < -60 || sx > 660 || sy < -60 || sy > 660) continue;
      g += `<path class="lf" d="${pathOf(P.map(([x, y]) => [X(x), Y(y)]))}"/>`;
      if (stom.has(col + ',' + row)) {
        const gl = 34, gw = 9;   // a stoma: two guard cells round the pore, with chloroplasts
        [-1, 1].forEach(side => {
          const pts = [];
          for (let k = 0; k <= 16; k++) { const t = Math.PI * k / 16; pts.push([cx + (gl / 2) * Math.cos(t) * -1, cy + side * (1.5 + gw * Math.sin(t))]); }
          for (let k = 16; k >= 0; k--) { const t = Math.PI * k / 16; pts.push([cx + (gl / 2) * Math.cos(t) * -1, cy + side * (1.5 + 0.5 * Math.sin(t))]); }
          g += `<path class="gc" d="${pathOf(pts.map(([x, y]) => [X(x), Y(y)]))}"/>`;
          for (let q = 0; q < 5; q++) g += `<circle class="chl" cx="${f2(X(cx + (q - 2) * 5.5))}" cy="${f2(Y(cy + side * 5.5))}" r="${f2(1.6 * s + 0.4)}"/>`;
        });
        g += `<path class="pore" d="M${f2(X(cx - 11))} ${f2(Y(cy))} Q${f2(X(cx))} ${f2(Y(cy - 1.6))} ${f2(X(cx + 11))} ${f2(Y(cy))} Q${f2(X(cx))} ${f2(Y(cy + 1.6))} ${f2(X(cx - 11))} ${f2(Y(cy))}Z"/>`;
      } else if (r() < 0.4) {
        g += `<ellipse class="lf__n" cx="${f2(X(cx + (r() - 0.5) * 20))}" cy="${f2(Y(cy + (r() - 0.5) * 10))}" rx="${f2(5 * s + 0.5)}" ry="${f2(4 * s + 0.5)}"/>`;
      }
    }
    return g;
  }

  /* Part 2: a slide on the stage, the graticule turned by the eyepiece */
  function slide(st) {
    const s = sc(st.slide === 'leaf' ? 10 : 40);
    const body = st.slide === 'leaf' ? leafSlide(st, s) : cheekSlide(st, s);
    return field(`<g class="specimen" data-drag="slide"><rect x="0" y="0" width="600" height="600" fill="transparent"/>${body}</g>` + graticule(st.rot, !st.bare));
  }

  /* ---------------- Part 3: a micrograph as printed on an exam page, with a ruler in millimetres ----------------
     Page scale: 4 svg units = 1 mm. The Paramecium is 88 mm long on the page and its 50 µm scale bar is 20 mm:
     magnification = 20 000 µm ÷ 50 µm = ×400, actual length = 88 000 µm ÷ 400 = 220 µm. */
  const MM = 4, CARD = { x: 18, y: 40, w: 564, h: 452 };
  const PARA = { cx: 300, cy: 250, L: 88 * MM, W: 29 * MM, bar: 20 * MM };
  function paramecium() {
    const { cx, cy, L, W } = PARA, P = [];
    for (let k = 0; k < 180; k++) {
      const t = 2 * Math.PI * k / 180, c = Math.cos(t), s = Math.sin(t);
      let y = (W / 2) * s * (1 + 0.16 * c) * (1 - 0.1 * Math.abs(s));
      if (s > 0) y -= 16 * Math.exp(-Math.pow((c + 0.05) / 0.28, 2));      // the oral groove
      P.push([cx + (L / 2) * c, cy + y]);
    }
    const r = rng(4); let g = '';
    let cil = '';
    P.forEach((p, i) => { if (i % 2) return; const q = P[(i + 1) % P.length], dx = q[0] - p[0], dy = q[1] - p[1], m = Math.hypot(dx, dy) || 1; cil += `M${f2(p[0])} ${f2(p[1])}l${f2(dy / m * 7)} ${f2(-dx / m * 7)}`; });
    g += `<path class="pm__cil" d="${cil}"/>`;
    g += `<path class="pm" d="${pathOf(P)}"/>`;
    for (let i = 0; i < 70; i++) { const x = cx + (r() - 0.5) * L * 0.86, y = cy + (r() - 0.5) * W * 0.62; if (Math.pow((x - cx) / (L / 2), 2) + Math.pow((y - cy) / (W / 2), 2) < 0.7) g += `<circle class="pm__gr" cx="${f2(x)}" cy="${f2(y)}" r="${f2(1 + r() * 1.6)}"/>`; }
    [[-60, -10, 10], [-20, 22, 8], [30, -16, 9], [70, 12, 7], [100, -6, 6], [-95, 14, 7]].forEach(([dx, dy, rr]) => { g += `<circle class="pm__fv" cx="${cx + dx}" cy="${cy + dy}" r="${rr}"/>`; });
    g += `<ellipse class="pm__mn" cx="${cx + 4}" cy="${cy - 4}" rx="34" ry="21" transform="rotate(-8 ${cx + 4} ${cy - 4})"/><circle class="pm__mi" cx="${cx + 42}" cy="${cy + 8}" r="5"/>`;
    [[cx + 118, cy - 14], [cx - 124, cy - 10]].forEach(([x, y]) => {
      let rays = ''; for (let k = 0; k < 7; k++) { const a = 2 * Math.PI * k / 7; rays += `M${f2(x + 8 * Math.cos(a))} ${f2(y + 8 * Math.sin(a))}l${f2(13 * Math.cos(a))} ${f2(13 * Math.sin(a))}`; }
      g += `<path class="pm__cv" d="${rays}"/><circle class="pm__cvc" cx="${x}" cy="${y}" r="8"/>`;
    });
    g += `<path class="pm__og" d="M${cx + 70} ${cy + 30} Q${cx + 20} ${cy + 46} ${cx - 30} ${cy + 26}"/>`;
    return g;
  }
  function ruler(st) {
    const len = 120, wid = 16; let t = '', n = '';
    for (let mm = 0; mm <= len; mm++) {
      const x = mm * MM, l = mm % 10 === 0 ? 15 : mm % 5 === 0 ? 10 : 6;
      t += `<line x1="${x}" y1="0" x2="${x}" y2="${l}"/>`;
      if (mm % 10 === 0) n += `<text x="${x}" y="27">${mm / 10}</text>`;
    }
    const ox = 10;   // the 0 mark sits 10 units (2.5 mm) in from the ruler's end, as on a real ruler
    return `<g class="ruler" data-drag="ruler" transform="translate(${f2(st.rx)} ${f2(st.ry)}) rotate(${st.rot})">
      <rect x="${-ox}" y="-2" width="${len * MM + 2 * ox}" height="${wid * MM}" rx="4"/><g transform="translate(0 0)">${t}${n}</g><text class="ruler__u" x="${len * MM - 2}" y="${wid * MM - 12}">cm</text></g>`;
  }
  function card(st) {
    const { x, y, w, h } = CARD, bx = 406, by = 418;
    return `<rect width="600" height="600" class="desk"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" class="paper"/>
      <text class="paper__t" x="${x + 18}" y="${y + 30}">Figure 1</text>
      <rect x="${x + 18}" y="${y + 44}" width="${w - 36}" height="${h - 98}" class="mg"/>
      <g class="pmg">${paramecium()}</g>
      <rect x="${bx}" y="${by}" width="${PARA.bar}" height="6" class="sbar"/><text class="sbar__t" x="${bx + PARA.bar / 2}" y="${by - 8}">50 µm</text>
      <text class="paper__s" x="${x + 18}" y="${y + h - 22}">A single-celled organism, Paramecium, seen with a light microscope.</text>
      ${ruler(st)}`;
  }

  /* ---------------- Part 4: drawings, as a student would draw them in the box ---------------- */
  const PEN = 'pen';
  function sketchy(pts, r, n) {   // the same outline drawn several times, a little apart, with gaps
    let g = '';
    for (let k = 0; k < (n || 3); k++) {
      const q = pts.map(([x, y], i) => [x + Math.sin(i * 0.9 + k * 2.1) * 2.6 + (r() - 0.5) * 2, y + Math.cos(i * 0.7 + k * 1.7) * 2.6 + (r() - 0.5) * 2]);
      g += `<path class="${PEN} thin" d="${pathOf(q)}" stroke-dasharray="${26 + k * 9} ${4 + k * 3}"/>`;
    }
    return g;
  }
  const lab = (x, y, t, anchor) => `<text class="lb" x="${x}" y="${y}" text-anchor="${anchor || 'start'}">${t}</text>`;
  const line = (x1, y1, x2, y2, extra) => `<line class="ll" x1="${f2(x1)}" y1="${f2(y1)}" x2="${f2(x2)}" y2="${f2(y2)}"${extra || ''}/>`;
  const boxFrame = (t) => `<rect width="600" height="600" class="desk"/><rect x="24" y="24" width="552" height="552" class="paper"/>` +
    `<rect x="46" y="62" width="508" height="490" class="dbox"/><text class="paper__t" x="46" y="50">${t}</text>`;

  function cellAt(len, ang, seed, cx, cy, k) { return cheekShape(len, ang, seed).map(([x, y]) => [cx + x * k, cy + y * k]); }
  /* the point of an outline nearest to a given direction from its middle: where a label line must end */
  function edgeToward(P, cx, cy, tx, ty) { let best = P[0], bd = Infinity; P.forEach(p => { const d = Math.abs(Math.atan2(p[1] - cy, p[0] - cx) - Math.atan2(ty - cy, tx - cx)); if (d < bd) { bd = d; best = p; } }); return best; }

  /* the outline point on the right-hand side of a cell nearest a height y: where a level label line meets it */
  function edgeAtY(P, y) { const cx = P.reduce((a, p) => a + p[0], 0) / P.length; let best = P[0], bd = Infinity; P.forEach(p => { if (p[0] < cx) return; const d = Math.abs(p[1] - y); if (d < bd) { bd = d; best = p; } }); return best; }

  function drawingA() {   // cheek cells: shading, sketchy outlines with gaps, an arrowhead on a label line
    const r = rng(101), P1 = cellAt(62, 0.25, 11, 230, 250, 4.2), P2 = cellAt(55, -0.6, 23, 300, 420, 3.6);
    let g = boxFrame('Drawing A');
    g += `<defs><pattern id="hatchA" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><line x1="0" y1="0" x2="0" y2="9" class="hatch"/></pattern>
      <marker id="arrA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="arrhead"/></marker></defs>`;
    g += `<path d="${pathOf(P1)}" fill="url(#hatchA)" stroke="none"/><path d="${pathOf(P2)}" fill="url(#hatchA)" stroke="none"/>`;
    g += sketchy(P1.filter((_, i) => i % 3 === 0), r) + sketchy(P2.filter((_, i) => i % 3 === 0), r);
    g += `<ellipse class="${PEN} shade" cx="236" cy="246" rx="21" ry="16"/><ellipse class="${PEN} shade" cx="304" cy="424" rx="18" ry="14"/>`;
    const m = edgeAtY(P1, 190);
    g += line(m[0], m[1], 440, m[1]) + lab(448, m[1] + 5, 'cell membrane');
    g += line(440, 246, 258, 246, ' marker-end="url(#arrA)"') + lab(448, 251, 'nucleus');
    g += line(318, 300, 440, 300) + lab(448, 305, 'cytoplasm');
    g += `<rect x="70" y="530" width="84" height="5" class="sbar"/><text class="lb" x="112" y="522" text-anchor="middle">20 µm</text>`;
    return g;
  }
  function leafBits(k, ox, oy) {   // a stoma with three epidermal cells, at scale k, top-left at ox, oy (drawing B)
    const T = (x, y) => [ox + x * k, oy + y * k];
    const cellsP = [[[0, 0], [60, -6], [120, 0], [118, 46], [64, 52], [2, 44]], [[120, 0], [190, 6], [240, 40], [210, 92], [150, 96], [118, 46]],
      [[2, 44], [64, 52], [118, 46], [150, 96], [100, 130], [20, 118]]];
    let g = cellsP.map(c => `<path class="pen" d="${pathOf(c.map(([x, y]) => T(x, y)))}"/>`).join('');
    const sx = 86, sy = 82;
    const gcs = [-1, 1].map(side => { const pts = []; for (let q = 0; q <= 16; q++) { const t = Math.PI * q / 16; pts.push(T(sx - 26 * Math.cos(t), sy + side * (2 + 13 * Math.sin(t)))); } for (let q = 16; q >= 0; q--) { const t = Math.PI * q / 16; pts.push(T(sx - 26 * Math.cos(t), sy + side * 2)); } return pts; });
    g += gcs.map(p => `<path class="pen" d="${pathOf(p)}"/>`).join('');
    [-1, 1].forEach(side => { for (let q = -2; q <= 2; q++) { const [x, y] = T(sx + q * 8, sy + side * 8); g += `<circle class="pen" cx="${f2(x)}" cy="${f2(y)}" r="${f2(1.6 * k)}"/>`; } });
    [T(46, 22), T(196, 46)].forEach(([x, y]) => { g += `<ellipse class="pen" cx="${f2(x)}" cy="${f2(y)}" rx="${f2(5.6 * k)}" ry="${f2(4.4 * k)}"/>`; });
    return { g, T, sx, sy };
  }
  function drawingB() {   // leaf epidermis: far too small, label lines that cross, a label written on the drawing
    // (its scale bar is right: the cells are drawn 1.2 units per µm × 0.62, so 20 µm = 15 units)
    const k = 0.62, L = leafBits(k, 70, 92);
    let g = boxFrame('Drawing B') + L.g;
    const gcTop = L.T(L.sx, L.sy - 13), pore = L.T(L.sx + 6, L.sy), cell = L.T(30, 100);
    g += line(gcTop[0], gcTop[1], 300, 214) + lab(306, 219, 'stoma');
    g += line(pore[0], pore[1], 300, 140) + lab(306, 145, 'guard cell');
    g += line(cell[0], cell[1], 300, 180) + lab(306, 185, 'epidermal cell');
    const c0 = L.T(24, 114); g += `<text class="lb sm" x="${f2(c0[0])}" y="${f2(c0[1])}">chloroplast</text>`;
    g += `<rect x="72" y="190" width="15" height="4" class="sbar"/><text class="lb sm" x="79.5" y="184" text-anchor="middle">20 µm</text>`;
    return g;
  }
  function drawingC() {   // cheek cells: no scale bar or magnification, a label line that stops short, a structure that cannot be seen
    const P1 = cellAt(62, 0.25, 11, 225, 260, 4.0), P2 = cellAt(58, 2.2, 51, 300, 430, 3.4);
    let g = boxFrame('Drawing C');
    g += `<path class="pen" d="${pathOf(P1)}"/><path class="pen" d="${pathOf(P2)}"/>`;
    g += `<ellipse class="pen" cx="232" cy="256" rx="20" ry="15"/><ellipse class="pen" cx="296" cy="428" rx="17" ry="13"/>`;
    const m = edgeAtY(P1, 196);
    g += line(m[0] + 24, m[1], 440, m[1]) + lab(448, m[1] + 5, 'cell membrane');
    g += line(252, 256, 440, 256) + lab(448, 261, 'nucleus');
    g += line(300, 316, 440, 316) + lab(448, 321, 'ribosomes');
    return g;
  }
  /* follows every rule: it fills more than half the box, one clear line for each edge, no shading, five structures named
     on ruled level lines that touch them (names in one column, a full row apart, no line crossing another), a scale bar */
  function drawingD() {
    const k = 1.05, c = [296, 302], T = (x, y) => [c[0] + (x - c[0]) * k, c[1] + (y - c[1]) * k];
    const poly = pts => `<path class="pen" d="${pathOf(pts.map(([x, y]) => T(x, y)))}"/>`;
    let g = boxFrame('Drawing D · Lower epidermis of a leaf (light microscope, ×400)');
    g += poly([[150, 100], [300, 92], [440, 104], [442, 236], [370, 240], [300, 240], [152, 232]]);
    g += poly([[152, 232], [300, 240], [300, 360], [150, 370]]);
    g += poly([[150, 370], [300, 360], [370, 360], [442, 364], [440, 500], [300, 512], [154, 502]]);
    const SC = [370, 300], HL = 70;
    const guard = side => { const out = [], inn = []; for (let q = 0; q <= 24; q++) { const t = Math.PI * q / 24, x = SC[0] - HL * Math.cos(t), sn = Math.sin(t); out.push(T(x, SC[1] + side * (6 + 54 * sn))); inn.push(T(x, SC[1] + side * 6 * sn)); } return out.concat(inn.reverse()); };
    g += `<path class="pen" d="${pathOf(guard(-1))}"/><path class="pen" d="${pathOf(guard(1))}"/>`;
    const midGC = (dx, side) => { const sn = Math.sqrt(1 - Math.pow(dx / HL, 2)); return [SC[0] + dx, SC[1] + side * (6 * sn + (6 + 54 * sn)) / 2]; };
    [[-46, -1], [-20, -1], [6, -1], [30, -1], [-46, 1], [-20, 1], [6, 1]].forEach(([dx, side]) => { const [x, y] = T(...midGC(dx, side)); g += `<circle class="pen" cx="${f2(x)}" cy="${f2(y)}" r="5"/>`; });
    const chl = T(404, 336); g += `<circle class="pen" cx="${f2(chl[0])}" cy="${f2(chl[1])}" r="5"/>`;
    [[240, 160], [300, 440]].forEach(([x, y]) => { const [a, b] = T(x, y); g += `<ellipse class="pen" cx="${f2(a)}" cy="${f2(b)}" rx="20" ry="14"/>`; });
    const X = 462, rows = [['cell wall', T(440.7, 150)], ['guard cell', T(410, 262)], ['stoma', T(395, 300)], ['chloroplast', [chl[0] + 5, chl[1]]], ['nucleus', [T(300, 440)[0] + 20, T(300, 440)[1]]]];
    rows.forEach(([t, p]) => { g += line(p[0], p[1], X, p[1]) + lab(X + 6, p[1] + 5, t); });
    g += `<rect x="150" y="534" width="61" height="5" class="sbar"/><text class="lb" x="180.5" y="526" text-anchor="middle">20 µm</text>`;
    return g;
  }
  const DRAW = { A: drawingA, B: drawingB, C: drawingC, D: drawingD };

  /* ---------------- Part 5: the phone held at the eyepiece ---------------- */
  function phone() {
    const inner = slide({ slide: 'cheek', dx: 30, dy: 10, rot: 0, bare: true }).replace('<rect width="600" height="600" fill="#0E1015"/>', '<rect width="600" height="600" fill="#05060A"/>');
    return `<rect width="600" height="600" class="desk"/>
      <circle cx="300" cy="318" r="196" class="eyepiece"/><circle cx="300" cy="318" r="170" class="eyepiece__in"/>
      <rect x="150" y="40" width="300" height="540" rx="38" class="phone"/><rect x="164" y="80" width="272" height="440" rx="12" fill="#05060A"/>
      <svg x="164" y="150" width="272" height="272" viewBox="0 0 600 600">${inner}</svg>
      <circle cx="300" cy="286" r="34" class="focus"/><text class="phone__t" x="300" y="470">Tap the cells to focus</text>
      <circle cx="300" cy="60" r="5" class="phone__cam"/>
      <g class="plab"><line x1="88" y1="318" x2="118" y2="318"/><text x="84" y="324">eyepiece</text></g>`;
  }

  window.Scope = { EPU, G, U, sc, LENS, onZero, calib, slide, card, DRAW, phone, cells: cells.map(c => ({ k: c.k, len: c.len, S: c.S })), PARA, MM, LEAF };
})();
