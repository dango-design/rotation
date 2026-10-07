/* Flat-lay garment illustrations, ported from the prototype (mockup/js/garments.js).
   Every garment is drawn in a 200x200 box and recoloured from a single base hex. */

type Pal = { F: string; E: string; D: string; I: string; L: string; fill?: string };
type Opts = { pocket?: boolean; belt?: boolean; loose?: boolean; light?: boolean; wide?: boolean; tailored?: boolean };
/* Flat-lay garment illustrations.
 Every garment is drawn in a 200x200 box and recoloured from a single base hex,
 so the closet reads like background-removed product photography without any image assets. */

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mix = (h: string, t: string, a: number): string =>
  '#' + rgb(h).map((v, i) => Math.round(v + (rgb(t)[i] - v) * a).toString(16).padStart(2, '0')).join('');
export const lum = (h: string): number => {
  const [r, g, b] = rgb(h).map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const STITCH = '#D3A15F';
const COPPER = '#B88A4A';
const SOLE = '#2A2826';

function palette(color: string): Pal {
  const dark = lum(color) < 0.16;
  return {
    F: color,
    E: mix(color, '#000000', dark ? 0.45 : 0.3),
    D: dark ? mix(color, '#ffffff', 0.2) : mix(color, '#000000', 0.24),
    I: dark ? mix(color, '#ffffff', 0.08) : mix(color, '#000000', 0.2),
    L: mix(color, '#ffffff', 0.55),
  };
}

const p = (d: string, attrs: string) => `<path d="${d}" ${attrs}/>`;
const fillPath = (d: string, c: Pal) => p(d, `fill="${c.fill || c.F}" stroke="${c.E}" stroke-width="1.5" stroke-linejoin="round"`);
const sheen = (d: string) => p(d, 'fill="url(#g-sheen)"');
const line = (d: string, color: string, w = 1.2, extra = '') =>
  p(d, `fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}`);
const dash = (d: string, color: string) => line(d, color, 1.1, 'stroke-dasharray="2.4 2.2" opacity=".85"');
const dot = (x: number, y: number, r: number, fill: string, stroke?: string) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${stroke ? `stroke="${stroke}" stroke-width=".8"` : ''}/>`;
const ribs = (x0: number, x1: number, y0: number, y1: number, step: number, color: string) => {
  let s = '';
  for (let x = x0 + step / 2; x < x1; x += step) s += line(`M${x} ${y0} L${x} ${y1}`, color, 0.8, 'opacity=".45"');
  return s;
};

/* ---------- Tops ---------- */
const TEE = 'M74 34 Q100 52 126 34 L152 42 L184 76 L162 98 L148 86 L148 172 Q100 176 52 172 L52 86 L38 98 L16 76 L48 42 Z';
const LONG = 'M76 32 Q100 48 124 32 L150 40 Q168 48 174 84 L182 150 L162 156 L150 98 L150 172 L50 172 L50 98 L38 156 L18 150 L26 84 Q32 48 50 40 Z';
const SHIRT = 'M78 30 Q100 40 122 30 L150 38 Q168 46 174 84 L182 148 L162 154 L150 98 L150 166 Q126 178 100 172 Q74 178 50 166 L50 98 L38 154 L18 148 L26 84 Q32 46 50 38 Z';
const HOODIE = 'M74 36 Q100 46 126 36 L152 44 Q170 52 176 88 L184 152 L164 158 L152 102 L152 174 L48 174 L48 102 L36 158 L16 152 L24 88 Q30 52 48 44 Z';
const CARDI = 'M76 32 L100 100 L124 32 L150 40 Q168 48 174 84 L182 150 L162 156 L150 98 L150 172 L50 172 L50 98 L38 156 L18 150 L26 84 Q32 48 50 40 Z';

function tee(c: Pal, o: Opts = {}) {
  return (
    fillPath(TEE, c) + sheen(TEE) +
    p('M74 34 Q100 24 126 34 Q100 52 74 34 Z', `fill="${c.I}"`) +
    line('M74 34 Q100 52 126 34', c.D, 3.4) +
    line('M178.5 70 L156.5 92', c.D) + line('M21.5 70 L43.5 92', c.D) +
    line('M52 164 Q100 168 148 164', c.D) +
    (o.pocket ? line('M112 66 h20 v17 q0 4 -4 4 h-12 q-4 0 -4 -4 Z', c.D) : '')
  );
}

function longsleeve(c: Pal) {
  return (
    fillPath(LONG, c) + sheen(LONG) +
    p('M76 32 Q100 24 124 32 Q100 48 76 32 Z', `fill="${c.I}"`) +
    line('M76 32 Q100 48 124 32', c.D, 3) +
    line('M180.6 140 L160.8 145.6', c.D) + line('M19.4 140 L39.2 145.6', c.D) +
    line('M50 164 L150 164', c.D)
  );
}

function sweater(c: Pal) {
  return (
    fillPath(LONG, c) + sheen(LONG) +
    p('M76 32 Q100 24 124 32 Q100 48 76 32 Z', `fill="${c.I}"`) +
    line('M76 32 Q100 48 124 32', c.D, 5.5) +
    p('M50 158 L150 158 L150 172 L50 172 Z', `fill="${c.D}" opacity=".18"`) + ribs(50, 150, 159, 171, 5, c.D) +
    p('M180.2 137 L160.4 142.6 L162 156 L182 150 Z', `fill="${c.D}" opacity=".18"`) +
    p('M19.8 137 L39.6 142.6 L38 156 L18 150 Z', `fill="${c.D}" opacity=".18"`)
  );
}

function shirt(c: Pal, o: Opts = {}) {
  const btn = c.L;
  return (
    fillPath(SHIRT, c) + sheen(SHIRT) +
    p('M78 30 Q100 22 122 30 L100 42 Z', `fill="${c.I}"`) +
    line('M96 44 L96 172', c.D, 1) + line('M104 44 L104 172', c.D, 1) +
    [66, 88, 110, 132, 154].map((y) => dot(100, y, 2.3, btn, c.D)).join('') +
    fillPath('M100 42 L80 26 L71 32 L86 60 Z', c) + fillPath('M100 42 L120 26 L129 32 L114 60 Z', c) +
    line('M180.8 136 L160.6 142', c.D) + line('M19.2 136 L39.4 142', c.D) +
    (o.pocket === false ? '' : line('M112 74 h20 v19 q0 3 -3 3 h-14 q-3 0 -3 -3 Z', c.D))
  );
}

function hoodie(c: Pal) {
  return (
    fillPath('M70 46 Q60 4 100 2 Q140 4 130 46 Z', c) +
    fillPath(HOODIE, c) + sheen(HOODIE) +
    p('M80 44 Q82 14 100 12 Q118 14 120 44 Q100 58 80 44 Z', `fill="${c.I}" stroke="${c.D}" stroke-width="2.5"`) +
    line('M92 54 Q90 70 91 88', '#F1EFEA', 2.2) + line('M108 54 Q110 70 109 88', '#F1EFEA', 2.2) +
    dot(91, 90, 2, c.E) + dot(109, 90, 2, c.E) +
    p('M64 116 L136 116 L146 154 L54 154 Z', `fill="${c.D}" fill-opacity=".08" stroke="${c.D}" stroke-width="1.2" stroke-linejoin="round"`) +
    p('M48 160 L152 160 L152 174 L48 174 Z', `fill="${c.D}" opacity=".16"`) + ribs(48, 152, 161, 173, 5, c.D) +
    line('M182.6 140 L162.4 146', c.D) + line('M17.4 140 L37.6 146', c.D)
  );
}

function cardigan(c: Pal) {
  return (
    fillPath(CARDI, c) + sheen(CARDI) +
    p('M76 32 Q100 26 124 32 L100 100 Z', `fill="${c.I}"`) +
    line('M78 34 L100 98 L100 172', c.D, 5, 'opacity=".35"') + line('M122 34 L100 98', c.D, 5, 'opacity=".35"') +
    [112, 132, 152].map((y) => dot(100, y, 2.8, c.L, c.D)).join('') +
    p('M50 158 L150 158 L150 172 L50 172 Z', `fill="${c.D}" opacity=".18"`) + ribs(50, 150, 159, 171, 5, c.D) +
    p('M180.2 137 L160.4 142.6 L162 156 L182 150 Z', `fill="${c.D}" opacity=".18"`) +
    p('M19.8 137 L39.6 142.6 L38 156 L18 150 Z', `fill="${c.D}" opacity=".18"`)
  );
}

/* ---------- Outerwear ---------- */
const JACKET = 'M78 30 Q100 40 122 30 L152 38 Q172 46 176 84 L184 146 L164 150 L152 100 L152 160 L48 160 L48 100 L36 150 L16 146 L24 84 Q28 46 48 38 Z';
const CHORE = 'M78 30 Q100 40 122 30 L152 38 Q172 46 176 84 L184 152 L164 156 L152 100 L152 172 L48 172 L48 100 L36 156 L16 152 L24 84 Q28 46 48 38 Z';
const BLAZER = 'M80 30 Q100 36 120 30 L150 38 Q168 44 172 82 L180 156 L160 160 L150 102 L150 176 L50 176 L50 102 L40 160 L20 156 L28 82 Q32 44 50 38 Z';
const TRENCH = 'M80 26 Q100 32 120 26 L150 34 Q170 40 174 80 L184 158 L164 162 L152 100 L158 190 L42 190 L48 100 L36 162 L16 158 L26 80 Q30 40 50 34 Z';
const PUFFER = 'M72 20 L128 20 L130 34 L156 42 Q174 50 178 88 L186 150 L164 156 L154 104 L154 168 Q100 174 46 168 L46 104 L36 156 L14 150 L22 88 Q26 50 44 42 L70 34 Z';

function denimjacket(c: Pal) {
  return (
    fillPath(JACKET, c) + sheen(JACKET) +
    p('M78 30 Q100 22 122 30 L100 40 Z', `fill="${c.I}"`) +
    line('M100 40 L100 160', c.E, 1.2) +
    line('M48 147 L152 147', c.D) + dash('M48 151 L152 151', STITCH) +
    line('M64 72 L90 72 L90 80 L77 86 L64 80 Z', c.D) + line('M64 80 L64 100 L90 100 L90 80', c.D) +
    line('M110 72 L136 72 L136 80 L123 86 L110 80 Z', c.D) + line('M110 80 L110 100 L136 100 L136 80', c.D) +
    dash('M67 75 L87 75', STITCH) + dash('M113 75 L133 75', STITCH) +
    line('M70 104 L70 146', c.D, 1) + line('M130 104 L130 146', c.D, 1) +
    dash('M74 104 L74 146', STITCH) + dash('M126 104 L126 146', STITCH) +
    [94, 118, 140, 154].map((y) => dot(104, y, 2.6, COPPER)).join('') + dot(77, 81, 2.2, COPPER) + dot(123, 81, 2.2, COPPER) +
    fillPath('M100 40 L78 26 L66 38 L86 66 Z', c) + fillPath('M100 40 L122 26 L134 38 L114 66 Z', c) +
    line('M181.8 136 L161.8 140.4', c.D) + line('M18.2 136 L38.2 140.4', c.D)
  );
}

function chorejacket(c: Pal) {
  return (
    fillPath(CHORE, c) + sheen(CHORE) +
    p('M78 30 Q100 22 122 30 L100 40 Z', `fill="${c.I}"`) +
    line('M100 40 L100 172', c.E, 1.2) +
    [76, 100, 124, 148].map((y) => dot(104, y, 2.6, c.E)).join('') +
    line('M112 70 h24 v24 h-24 Z', c.D) + line('M112 76 h24', c.D, 0.9) +
    line('M58 114 h30 v34 h-30 Z', c.D) + line('M112 114 h30 v34 h-30 Z', c.D) +
    line('M58 120 h30', c.D, 0.9) + line('M112 120 h30', c.D, 0.9) +
    fillPath('M100 40 L78 26 L66 38 L86 66 Z', c) + fillPath('M100 40 L122 26 L134 38 L114 66 Z', c) +
    line('M181.8 142 L161.8 146.4', c.D) + line('M18.2 142 L38.2 146.4', c.D)
  );
}

function blazer(c: Pal) {
  const lapel = { ...c, fill: mix(c.F, '#000000', 0.08) };
  return (
    fillPath(BLAZER, c) + sheen(BLAZER) +
    p('M88 33 L100 112 L112 33 Q100 39 88 33 Z', 'fill="#F3F1EC"') +
    line('M90 34 L96 46 M110 34 L104 46', '#CFCAC0', 1) +
    line('M100 114 L100 176', c.E, 1.2) +
    fillPath('M84 31 L68 62 L78 66 L100 114 L88 33 Z', lapel) +
    fillPath('M116 31 L132 62 L122 66 L100 114 L112 33 Z', lapel) +
    dot(100, 126, 3.2, c.D) +
    line('M58 140 h28 v6 h-28 Z', c.D) + line('M114 140 h28 v6 h-28 Z', c.D) +
    line('M114 86 L134 83', c.D, 2) +
    line('M179 146 L160.8 150', c.D, 1) + line('M21 146 L39.2 150', c.D, 1)
  );
}

function trench(c: Pal, o: Opts = {}) {
  const lapel = { ...c, fill: mix(c.F, '#000000', 0.06) };
  const belt = o.belt !== false;
  return (
    fillPath(TRENCH, c) + sheen(TRENCH) +
    p('M90 29 L97 102 L103 102 L110 29 Q100 34 90 29 Z', `fill="${c.I}"`) +
    fillPath('M82 27 L62 58 L76 64 L98 104 L90 30 Z', lapel) +
    fillPath('M118 27 L138 58 L124 64 L102 104 L110 30 Z', lapel) +
    (belt
      ? line('M106 104 L108 190', c.E, 1.2) +
        [88, 112].flatMap((x) => [dot(x, 92, 2.8, c.D), dot(x, 140, 2.8, c.D), dot(x, 162, 2.8, c.D)]).join('') +
        fillPath('M47 108 L153 108 L154 121 L46 121 Z', c) +
        p('M93 104.5 h14 v20 h-14 Z', `fill="none" stroke="${c.D}" stroke-width="2"`) +
        fillPath('M110 121 L114 152 L121 152 L117 121 Z', c)
      : line('M104 104 L104 190', c.E, 1.2) +
        [118, 144, 170].map((y) => dot(100, y, 3, c.D)).join('') +
        line('M58 140 L82 136', c.D, 2) + line('M118 136 L142 140', c.D, 2)) +
    line('M179.8 146 L159.8 150', c.D, 2.4, 'opacity=".6"') + line('M20.2 146 L40.2 150', c.D, 2.4, 'opacity=".6"')
  );
}

function puffer(c: Pal) {
  const hi = 'stroke="#ffffff" stroke-opacity=".14" stroke-width="7" fill="none" stroke-linecap="round"';
  return (
    fillPath(PUFFER, c) + sheen(PUFFER) +
    p('M54 52 Q100 58 146 52', hi) + p('M52 79 Q100 85 148 79', hi) + p('M52 105 Q100 111 148 105', hi) + p('M52 131 Q100 137 148 131', hi) +
    line('M70 34 Q100 40 130 34', c.D, 1.3) +
    line('M46 66 Q100 72 154 66', c.D) + line('M46 92 Q100 98 154 92', c.D) +
    line('M47 118 Q100 124 153 118', c.D) + line('M47 144 Q100 150 153 144', c.D) +
    line('M157 70 L176 67', c.D) + line('M157 96 L180 93', c.D) + line('M158 122 L183 119', c.D) +
    line('M43 70 L24 67', c.D) + line('M43 96 L20 93', c.D) + line('M42 122 L17 119', c.D) +
    line('M100 20 L100 171', c.D, 1.6) + p('M97.5 36 h5 v10 h-5 Z', `fill="${c.D}"`)
  );
}

/* ---------- Bottoms ---------- */
function jeans(c: Pal, o: Opts = {}) {
  const sil = o.loose
    ? 'M56 20 L144 20 L153 186 L106 186 L100 86 L94 186 L47 186 Z'
    : o.light
    ? 'M57 20 L143 20 L148 186 L107 186 L100 86 L93 186 L52 186 Z'
    : 'M56 20 L144 20 L148 186 L108 186 L100 84 L92 186 L52 186 Z';
  const wh = mix(c.F, '#ffffff', 0.3);
  const hemL = o.loose ? 'M48.5 178 L93.5 178' : 'M52.6 178 L92.6 178';
  const hemR = o.loose ? 'M106.5 178 L151.5 178' : 'M107.4 178 L147.4 178';
  return (
    fillPath(sil, c) + sheen(sil) +
    line('M56 32 L144 32', c.D) + dash('M57 29 L143 29', STITCH) +
    p('M66 18 h5 v16 h-5 Z', `fill="${c.F}" stroke="${c.D}" stroke-width="1"`) +
    p('M129 18 h5 v16 h-5 Z', `fill="${c.F}" stroke="${c.D}" stroke-width="1"`) +
    dot(100, 26, 3, COPPER) +
    dash('M106 33 L106 66 Q106 76 98 79', STITCH) +
    line('M78 32 Q76 54 55.5 60', c.D) + line('M122 32 Q124 54 144.5 60', c.D) +
    dash('M74 33 Q72 51 56 56', STITCH) + dash('M126 33 Q128 51 144 56', STITCH) +
    line('M86 70 L72 74 M88 77 L75 83 M114 70 L128 74 M112 77 L125 83', wh, 1.4, 'opacity=".55"') +
    dash(hemL, STITCH) + dash(hemR, STITCH)
  );
}

function chinos(c: Pal, o: Opts = {}) {
  const sil = o.wide
    ? 'M56 20 L144 20 L162 188 L106 188 L100 88 L94 188 L38 188 Z'
    : o.tailored
    ? 'M60 20 L140 20 L144 188 L108 188 L100 86 L92 188 L56 188 Z'
    : 'M58 20 L142 20 L146 186 L108 186 L100 86 L92 186 L54 186 Z';
  return (
    fillPath(sil, c) + sheen(sil) +
    line(`M${o.tailored ? 60 : 56.5} 32 L${o.tailored ? 140 : 143.5} 32`, c.D) +
    p('M68 18 h5 v16 h-5 Z', `fill="${c.F}" stroke="${c.D}" stroke-width="1"`) +
    p('M127 18 h5 v16 h-5 Z', `fill="${c.F}" stroke="${c.D}" stroke-width="1"`) +
    dot(100, 26, 2.4, c.D) +
    line('M106 33 L106 68 Q106 76 100 78', c.D, 1) +
    line('M74 32 L59 62', c.D) + line('M126 32 L141 62', c.D) +
    (o.wide ? line('M82 33 L84 66', c.D, 1) + line('M118 33 L116 66', c.D, 1) : '') +
    (o.wide
      ? line('M70 94 L60 182', c.D, 1, 'opacity=".4"') + line('M130 94 L140 182', c.D, 1, 'opacity=".4"')
      : line('M77 94 L75 180', c.D, 1, 'opacity=".4"') + line('M123 94 L125 180', c.D, 1, 'opacity=".4"'))
  );
}

function joggers(c: Pal) {
  const sil = 'M56 22 L144 22 L143 38 Q152 104 142 166 L142 186 L110 186 L110 166 L100 86 L90 166 L90 186 L58 186 L58 166 Q48 104 57 38 Z';
  let gathers = '';
  for (let x = 62; x <= 138; x += 6) gathers += line(`M${x} 25 L${x} 35`, c.D, 0.8, 'opacity=".45"');
  return (
    fillPath(sil, c) + sheen(sil) +
    line('M57 38 L143 38', c.D) + gathers +
    line('M96 36 Q94 50 90 60', '#EDEBE6', 2) + line('M104 36 Q106 50 110 60', '#EDEBE6', 2) +
    line('M70 42 L61 72', c.D) + line('M130 42 L139 72', c.D) +
    line('M58 168 L90 168', c.D) + line('M110 168 L142 168', c.D) +
    ribs(58, 90, 169, 185, 4, c.D) + ribs(110, 142, 169, 185, 4, c.D)
  );
}


/* ---------- One-pieces and skirts ---------- */
function dress(c: Pal) {
  const sil = 'M78 16 Q100 30 122 16 L136 22 L150 48 L134 56 L128 48 Q131 70 126 86 L158 186 Q100 194 42 186 L74 86 Q69 70 72 48 L66 56 L50 48 L64 22 Z';
  return (
    fillPath(sil, c) + sheen(sil) +
    p('M78 16 Q100 8 122 16 Q100 30 78 16 Z', `fill="${c.I}"`) +
    line('M78 16 Q100 30 122 16', c.D, 3) +
    line('M74 86 Q100 93 126 86', c.D, 1.4) +
    line('M90 92 L80 182 M110 92 L120 182', c.D, 1, 'opacity=".35"') +
    line('M45 178 Q100 186 155 178', c.D)
  );
}

function skirt(c: Pal) {
  const sil = 'M64 26 L136 26 L162 178 Q100 190 38 178 Z';
  return (
    fillPath(sil, c) + sheen(sil) +
    p('M64 26 L136 26 L138 40 L62 40 Z', `fill="${c.D}" opacity=".18"`) +
    line('M62 40 L138 40', c.D) +
    line('M84 42 L70 180 M100 42 L100 184 M116 42 L130 180', c.D, 1, 'opacity=".35"') +
    line('M41 170 Q100 181 159 170', c.D)
  );
}

/* ---------- Shoes (pairs, side view) ---------- */
function pair(draw: (c: Pal) => string, c: Pal) {
  const back = { ...c, F: mix(c.F, '#000000', 0.08), fill: undefined };
  return (
    `<g transform="translate(100 106) scale(.92) translate(-100 -100)">` +
    `<g transform="translate(-14 -15)">${draw(back)}</g>` +
    `<g transform="translate(10 8)">${draw(c)}</g></g>`
  );
}

function sneaker(c: Pal) {
  const lace = lum(c.F) > 0.7 ? c.D : '#F1EFEA';
  const upper = 'M28 138 L28 110 Q28 99 40 101 Q56 104 70 108 Q82 100 92 90 Q100 83 110 88 L150 108 Q178 117 184 132 L184 138 Z';
  return (
    fillPath(upper, c) + sheen(upper) +
    line('M150 108 Q162 120 164 136', c.D) + line('M28 114 Q48 114 54 136', c.D) +
    line('M30 105 Q50 105 70 110', c.D, 1) +
    line('M100 93 L108 102 M110 97 L118 106 M120 101 L128 110 M130 105 L138 114', lace, 2) +
    p('M22 136 L188 136 Q192 150 178 154 L32 154 Q20 152 22 136 Z', 'fill="#F7F6F2" stroke="#CFCBC2" stroke-width="1.3"') +
    line('M24 144 L188 144', '#E0DCD4', 1)
  );
}

function boot(c: Pal) {
  const shaft = 'M60 56 L112 56 Q113 84 118 102 Q150 104 170 120 Q182 130 180 146 L56 146 Q50 128 53 104 Q57 76 60 46 Z';
  return (
    p('M60 57 L60 44 Q60 40 64 40 L68 40 Q72 40 72 44 L72 57', `fill="${mix(c.F, '#000000', 0.3)}"`) +
    fillPath(shaft, c) + sheen(shaft) +
    p('M80 57 L98 57 Q96 78 102 100 Q92 103 84 101 Q87 78 80 57 Z', `fill="${mix(c.F, '#000000', 0.32)}"`) +
    line('M118 102 Q121 122 119 146', c.D, 1, 'opacity=".5"') +
    dash('M57 141 L178 141', mix(c.F, '#ffffff', 0.35)) +
    p('M50 146 L182 146 L182 154 Q182 158 178 158 L54 158 Q50 158 50 154 Z', `fill="${SOLE}"`) +
    p('M50 152 L84 152 L84 164 L52 164 Z', `fill="${SOLE}"`)
  );
}

function loafer(c: Pal) {
  const dark = lum(c.F) < 0.16;
  const hole = dark ? '#0b0b0b' : c.I;
  const upper = 'M30 142 L30 124 Q30 112 44 112 Q66 116 92 114 Q130 106 160 116 Q184 124 186 138 L186 142 Z';
  return (
    fillPath(upper, c) + sheen(upper) +
    p('M44 114 Q70 120 96 115 Q74 108 56 110 Q48 111 44 114 Z', `fill="${hole}"`) +
    line('M124 113 Q154 108 172 122 Q152 132 126 129', c.D, 1.2) +
    p('M100 116 Q120 108 142 114 L140 125 Q120 118 102 127 Z', `fill="${dark ? mix(c.F, '#ffffff', 0.1) : mix(c.F, '#000000', 0.15)}" stroke="${c.D}" stroke-width="1"`) +
    line('M114 116 Q121 113 128 116', hole, 2.4) +
    p('M26 142 L190 142 L190 149 Q190 151 188 151 L28 151 Q26 151 26 149 Z', `fill="${SOLE}"`) +
    line('M30 141.5 L186 141.5', mix(c.F, '#ffffff', 0.3), 1, 'stroke-dasharray="2.4 2.2"') +
    p('M26 147 L62 147 L62 158 L28 158 Z', `fill="${SOLE}"`)
  );
}

/* ---------- Accessories ---------- */
function tote(c: Pal) {
  const body = 'M46 70 L154 70 L162 182 L38 182 Z';
  const h = mix(c.F, '#000000', 0.22);
  return (
    line('M82 72 Q82 30 106 30 Q130 30 130 72', h, 7, 'opacity=".7"') +
    fillPath(body, c) + sheen(body) +
    line('M76 72 Q76 26 100 26 Q124 26 124 72', h, 7) +
    line('M47 82 L153 82', c.D) +
    line('M70 72 h12 v16 h-12 Z M118 72 h12 v16 h-12 Z', c.D, 1)
  );
}

function cap(c: Pal) {
  const crown = 'M40 132 Q38 70 98 64 Q152 64 158 122 L158 132 Z';
  return (
    fillPath(crown, c) + sheen(crown) +
    fillPath('M150 120 Q180 114 194 130 Q178 144 150 136 Z', { ...c, fill: mix(c.F, '#000000', 0.08) }) +
    line('M98 64 Q92 98 96 132', c.D) + line('M98 64 Q130 86 140 130', c.D) + line('M98 64 Q64 84 56 130', c.D) +
    line('M40 126 L158 126', c.D) +
    `<ellipse cx="98" cy="64" rx="7" ry="3.2" fill="${c.D}"/>` +
    dot(122, 92, 1.8, c.I) + dot(70, 92, 1.8, c.I)
  );
}

function beanie(c: Pal) {
  const sil = 'M52 156 L52 102 Q52 40 100 38 Q148 40 148 102 L148 156 Z';
  let lines = '';
  [62, 74, 87, 100, 113, 126, 138].forEach((x) => {
    lines += line(`M${x} 114 Q${x + (100 - x) * 0.2} 64 100 42`, c.D, 0.9, 'opacity=".35"');
  });
  return (
    fillPath(sil, c) + sheen(sil) + lines +
    p('M50 114 h100 v42 h-100 Z', `fill="${mix(c.F, '#000000', 0.06)}" stroke="${c.E}" stroke-width="1.5" stroke-linejoin="round"`) +
    ribs(50, 150, 116, 154, 6, c.D)
  );
}

const DRAW: Record<string, (c: Pal) => string> = {
  tee: (c) => tee(c),
  pockettee: (c) => tee(c, { pocket: true }),
  longsleeve,
  sweater,
  shirt: (c) => shirt(c),
  linenshirt: (c) => shirt(c, { pocket: false }),
  hoodie,
  cardigan,
  dress,
  skirt,
  denimjacket,
  chorejacket,
  blazer,
  trench: (c) => trench(c),
  coat: (c) => trench(c, { belt: false }),
  puffer,
  jeans: (c) => jeans(c),
  loosejeans: (c) => jeans(c, { loose: true }),
  chinos: (c) => chinos(c),
  trousers: (c) => chinos(c, { tailored: true }),
  widetrousers: (c) => chinos(c, { wide: true }),
  joggers,
  sneakers: (c) => pair(sneaker, c),
  boots: (c) => pair(boot, c),
  loafers: (c) => pair(loafer, c),
  tote,
  cap,
  beanie,
};

/* pattern: 'stripe' renders a Breton stripe using the shared <pattern> in index.html */
export function garmentSvg(type: string, color: string, pattern?: string): string {
  const c: Pal = palette(color);
  if (pattern === 'stripe') {
    c.fill = 'url(#p-stripe)';
    c.E = '#3A4560';
    c.D = '#25324B';
    c.I = '#D9D1C0';
  }
  const draw = DRAW[type] || DRAW.tee;
  return `<svg viewBox="0 0 200 200" class="garment" aria-hidden="true">${draw(c)}</svg>`;
}

