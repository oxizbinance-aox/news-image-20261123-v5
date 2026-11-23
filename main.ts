// makefun anchor f30609d960cf6cb6f17bb8ac5185b98253194cd7 round 34207656
// News Image 23 Nov 2026 - v5 "The Day in Five Frames"
// A broadsheet front page for Monday 23 November 2026, drawn at runtime
// with pure Node stdlib: a 5x7 bitmap font, flat pictograms and a hand-rolled
// PNG encoder. No network, no randomness, no clock at runtime - the bytes
// are identical on every run.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------- font ----
// 5x7 bitmap font, uppercase + digits + punctuation. Each glyph is 7 rows
// of 5 cells; '1' is ink, '0' is empty. Headlines and body are all caps,
// the way a newspaper front page sets them.
type Glyph = string[];
const FONT: Record<string, Glyph> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "00100", "01000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "/": ["00001", "00010", "00010", "00100", "00100", "01000", "01000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "$": ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "=": ["00000", "00000", "01110", "00000", "01110", "00000", "00000"],
  "+": ["00000", "00100", "00100", "01110", "00100", "00100", "00000"],
  '"': ["01010", "01010", "00000", "00000", "00000", "00000", "00000"],
  "•": ["00000", "00000", "01100", "01100", "01100", "00000", "00000"],
};

// ------------------------------------------------------------- canvas -----
type RGB = [number, number, number];
class Canvas {
  buf: Uint8Array;
  w: number;
  h: number;
  constructor(w: number, h: number, bg: RGB) {
    this.w = w;
    this.h = h;
    this.buf = new Uint8Array(w * h * 3);
    this.fill(bg);
  }
  fill(c: RGB): void {
    for (let i = 0; i < this.buf.length; i += 3) {
      this.buf[i] = c[0]; this.buf[i + 1] = c[1]; this.buf[i + 2] = c[2];
    }
  }
  px(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 3;
    this.buf[i] = c[0]; this.buf[i + 1] = c[1]; this.buf[i + 2] = c[2];
  }
  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) this.px(xx, yy, c);
  }
  frame(x: number, y: number, w: number, h: number, c: RGB, t = 1): void {
    for (let k = 0; k < t; k++) {
      for (let xx = x; xx < x + w; xx++) { this.px(xx, y + k, c); this.px(xx, y + h - 1 - k, c); }
      for (let yy = y; yy < y + h; yy++) { this.px(x + k, yy, c); this.px(x + w - 1 - k, yy, c); }
    }
  }
  hline(x0: number, x1: number, y: number, c: RGB, t = 1): void {
    for (let k = 0; k < t; k++) for (let x = x0; x <= x1; x++) this.px(x, y + k, c);
  }
  vline(x: number, y0: number, y1: number, c: RGB, t = 1): void {
    for (let k = 0; k < t; k++) for (let y = y0; y <= y1; y++) this.px(x + k, y, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGB, t = 1): void {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, x = x0, y = y0;
    for (;;) {
      for (let a = -((t - 1) >> 1); a <= t >> 1; a++)
        for (let b = -((t - 1) >> 1); b <= t >> 1; b++) this.px(x + a, y + b, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x += sx; }
      if (e2 <= dx) { err += dx; y += sy; }
    }
  }
  disc(cx: number, cy: number, r: number, c: RGB): void {
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++)
        if (x * x + y * y <= r * r) this.px(cx + x, cy + y, c);
  }
  ring(cx: number, cy: number, r: number, c: RGB, t = 2): void {
    for (let a = 0; a < 360; a++) {
      const rad = (a * Math.PI) / 180;
      for (let k = 0; k < t; k++)
        this.px(Math.round(cx + (r - k) * Math.cos(rad)), Math.round(cy + (r - k) * Math.sin(rad)), c);
    }
  }
  // Scanline-filled polygon, points as [x, y] pairs.
  poly(pts: [number, number][], c: RGB): void {
    let minY = Infinity, maxY = -Infinity;
    for (const [, y] of pts) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    for (let y = Math.ceil(minY); y <= maxY; y++) {
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
        if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) {
          xs.push(x0 + ((y - y0) * (x1 - x0)) / (y1 - y0));
        }
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.ceil(xs[k]); x <= xs[k + 1]; x++) this.px(x, y, c);
    }
  }
  tri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: RGB): void {
    this.poly([[x0, y0], [x1, y1], [x2, y2]], c);
  }
  text(s: string, x: number, y: number, scale: number, c: RGB): number {
    let cx = x;
    for (const ch of s.toUpperCase()) {
      const g = FONT[ch] ?? FONT["?"];
      for (let r = 0; r < 7; r++)
        for (let col = 0; col < 5; col++)
          if (g[r][col] === "1")
            for (let dy = 0; dy < scale; dy++)
              for (let dx = 0; dx < scale; dx++)
                this.px(cx + col * scale + dx, y + r * scale + dy, c);
      cx += 6 * scale;
    }
    return cx;
  }
  textWidth(s: string, scale: number): number {
    return s.length * 6 * scale - scale;
  }
  centerText(s: string, cx: number, y: number, scale: number, c: RGB): void {
    this.text(s, cx - Math.floor(this.textWidth(s, scale) / 2), y, scale, c);
  }
  // Word-wrap into lines of at most maxW px at the given scale.
  wrap(s: string, maxW: number, scale: number): string[] {
    const words = s.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const trial = cur ? cur + " " + w : w;
      if (this.textWidth(trial, scale) <= maxW) { cur = trial; continue; }
      if (cur) lines.push(cur);
      cur = w;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  para(s: string, x: number, y: number, maxW: number, scale: number, c: RGB, leading: number): number {
    const lines = this.wrap(s, maxW, scale);
    for (const ln of lines) { this.text(ln, x, y, scale, c); y += leading; }
    return y;
  }
}

// ---------------------------------------------------------------- png -----
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}
function encodePNG(cv: Canvas): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(cv.w, 0); ihdr.writeUInt32BE(cv.h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc(cv.h * (1 + cv.w * 3));
  for (let y = 0; y < cv.h; y++) {
    raw[y * (1 + cv.w * 3)] = 0;
    Buffer.from(cv.buf.subarray(y * cv.w * 3, (y + 1) * cv.w * 3))
      .copy(raw, y * (1 + cv.w * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------ palette -----
const PAPER: RGB = [245, 240, 228];
const PANEL: RGB = [255, 253, 246];
const INK: RGB = [22, 19, 14];
const RED: RGB = [180, 35, 24];
const BLUE: RGB = [30, 64, 175];
const GOLD: RGB = [183, 121, 31];
const GOLD_LT: RGB = [232, 184, 84];
const SKY: RGB = [183, 216, 228];
const EARTH: RGB = [122, 82, 44];
const EARTH_DK: RGB = [88, 58, 30];
const SEA: RGB = [36, 90, 140];
const SEA_DK: RGB = [20, 52, 84];
const NIGHT: RGB = [38, 42, 54];
const GREY: RGB = [110, 105, 95];
const WHITE: RGB = [255, 255, 255];

function panel(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, PANEL);
  cv.frame(x, y, w, h, INK, 2);
}
function kicker(cv: Canvas, s: string, x: number, y: number, c: RGB): void {
  cv.text(s, x, y, 2, c);
  cv.hline(x, x + cv.textWidth(s, 2), y + 18, c, 2);
}
function headline(cv: Canvas, lines: string[], x: number, y: number, scale: number, c: RGB): number {
  for (const ln of lines) { cv.text(ln, x, y, scale, c); y += 7 * scale + 8; }
  return y;
}

// ------------------------------------------------------- pictograms ------
// Lead art: a hard sun over cracked dry earth, mountains behind, and a
// red NO DEAL stamp. The climate summit failed; the land is dry.
function artCOP31(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, SKY);
  cv.frame(x, y, w, h, INK, 2);
  // Sun with rays, upper left.
  const sx = x + 120, sy = y + 95;
  for (let a = 0; a < 12; a++) {
    const rad = (a * Math.PI) / 6;
    cv.line(
      Math.round(sx + 60 * Math.cos(rad)), Math.round(sy + 60 * Math.sin(rad)),
      Math.round(sx + 92 * Math.cos(rad)), Math.round(sy + 92 * Math.sin(rad)),
      GOLD, 6,
    );
  }
  cv.disc(sx, sy, 52, GOLD);
  cv.ring(sx, sy, 52, GOLD_LT, 5);
  cv.ring(sx, sy, 58, GOLD, 2);
  // Mountains.
  cv.poly([[x, y + h - 130], [x + 150, y + h - 210], [x + 300, y + h - 130]], [94, 116, 138]);
  cv.poly([[x + 220, y + h - 130], [x + 380, y + h - 225], [x + w, y + h - 130]], [74, 96, 118]);
  // Cracked earth.
  cv.rect(x, y + h - 130, w, 130, EARTH);
  cv.hline(x, x + w, y + h - 130, EARTH_DK, 3);
  const cracks: [number, number][][] = [
    [[x + 40, y + h - 130], [x + 70, y + h - 92], [x + 55, y + h - 55], [x + 95, y + h - 18]],
    [[x + 210, y + h - 130], [x + 185, y + h - 88], [x + 215, y + h - 48], [x + 195, y + h - 8]],
    [[x + 400, y + h - 130], [x + 430, y + h - 96], [x + 405, y + h - 60], [x + 445, y + h - 22]],
  ];
  for (const pts of cracks)
    for (let i = 0; i + 1 < pts.length; i++)
      cv.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], EARTH_DK, 4);
  // Red NO DEAL stamp, lower right of the art.
  const stX = x + w - 218, stY = y + h - 108;
  cv.rect(stX, stY, 196, 62, [250, 240, 225]);
  cv.frame(stX, stY, 196, 62, RED, 4);
  cv.frame(stX + 6, stY + 6, 184, 50, RED, 1);
  cv.centerText("NO DEAL", stX + 98, stY + 17, 4, RED);
  cv.text("ANTALYA, TURKEY", x + 16, y + h - 152, 2, INK);
}

// Dymer art: night skyline, broken buildings, rubble, and a gold badge
// with the rescued boy's age: 7.
function artDymer(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, NIGHT);
  cv.frame(x, y, w, h, INK, 2);
  const base = y + h;
  const bld: [number, number, number][] = [[18, 52, 96], [120, 40, 128], [250, 56, 120], [360, 34, 96]];
  for (const [bx, bw, bh] of bld) {
    cv.rect(x + bx, base - bh, bw, bh, [16, 16, 22]);
    for (let wy = base - bh + 10; wy < base - 12; wy += 18)
      for (let wx = x + bx + 8; wx < x + bx + bw - 8; wx += 16)
        if ((wx + wy) % 32 < 16) cv.rect(wx, wy, 5, 7, GOLD_LT);
  }
  // Rubble pile at the foot of the broken building.
  cv.poly([[x + 210, base], [x + 260, base - 34], [x + 320, base]], GREY);
  cv.poly([[x + 280, base], [x + 320, base - 22], [x + 360, base]], [88, 84, 76]);
  cv.poly([[x + 330, base], [x + 352, base - 14], [x + 378, base]], [140, 134, 122]);
  // Gold badge with the boy's age.
  cv.disc(x + w - 52, y + 34, 26, GOLD);
  cv.ring(x + w - 52, y + 34, 26, GOLD_LT, 3);
  cv.centerText("7", x + w - 52, y + 20, 4, INK);
}

// Markets art: a falling chart line and the Nikkei's drop in big red type.
function artMarkets(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, PANEL);
  cv.frame(x, y, w, h, INK, 2);
  cv.text("-5.06%", x + 14, y + 8, 4, RED);
  cv.text("NIKKEI", x + w - 118, y + 14, 2, INK);
  const ax = x + 16, ay = y + h - 16, aw = w - 32, ah = 34;
  cv.line(ax, ay, ax + aw, ay, INK, 2);
  cv.line(ax, ay, ax, ay - ah, INK, 2);
  const pts: [number, number][] = [
    [0, 4], [60, 10], [120, 6], [180, 18], [240, 14], [300, 26], [360, 22], [420, 33],
  ];
  for (let i = 0; i + 1 < pts.length; i++)
    cv.line(ax + pts[i][0], ay - pts[i][1], ax + pts[i + 1][0], ay - pts[i + 1][1], RED, 4);
  const ex = ax + 420, ey = ay - 33;
  cv.tri(ex, ey, ex - 12, ey - 3, ex - 12, ey + 5, RED);
}

// Merkury art: a warship on the sea, smoke rising, a drone above.
function artMerkury(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, SEA);
  cv.frame(x, y, w, h, INK, 2);
  for (let wy = y + 18; wy < y + h - 8; wy += 14)
    for (let wx = x + 10 + ((wy * 7) % 22); wx < x + w - 12; wx += 44)
      cv.hline(wx, wx + 22, wy, [120, 170, 210], 2);
  // Hull and superstructure.
  cv.poly([[x + 60, y + 58], [x + 250, y + 58], [x + 228, y + 78], [x + 82, y + 78]], [20, 24, 32]);
  cv.rect(x + 130, y + 40, 60, 18, [20, 24, 32]);
  cv.line(x + 160, y + 40, x + 160, y + 16, [20, 24, 32], 3);
  // Smoke.
  cv.disc(x + 150, y + 14, 9, [200, 200, 195]);
  cv.disc(x + 132, y + 8, 7, [220, 220, 215]);
  // Drone above.
  cv.disc(x + w - 46, y + 18, 4, INK);
  cv.hline(x + w - 58, x + w - 34, y + 18, INK, 2);
  cv.vline(x + w - 46, y + 6, y + 30, INK, 2);
}

// Penny art: a big gold 1-cent coin and the length of its run.
function artPenny(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, [250, 240, 210]);
  cv.frame(x, y, w, h, INK, 2);
  const cx = x + 74, cy = y + Math.floor(h / 2);
  cv.disc(cx, cy, 38, GOLD);
  cv.ring(cx, cy, 38, [140, 92, 20], 3);
  cv.ring(cx, cy, 30, [140, 92, 20], 1);
  cv.centerText("1", cx, cy - 21, 6, [90, 58, 12]);
  cv.text("232", x + 132, y + 16, 4, INK);
  cv.text("YEARS", x + 132, y + 50, 3, RED);
}

// Marquez art: a chequered flag and the title number 8.
function artMarquez(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, PANEL);
  cv.frame(x, y, w, h, INK, 2);
  const fx = x + 18, fy = y + 14, cell = 16;
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 8; c++)
      if ((r + c) % 2 === 0) cv.rect(fx + c * cell, fy + r * cell, cell, cell, INK);
  cv.frame(fx, fy, 8 * cell, 4 * cell, INK, 2);
  cv.line(fx, fy, fx, fy + 4 * cell + 6, INK, 3);
  cv.centerText("8", x + w - 62, y + 12, 6, GOLD);
  cv.text("MOTO", x + w - 96, y + 58, 2, INK);
}

// ------------------------------------------------------------- layout -----
function drawPage(): Buffer {
  const cv = new Canvas(W, H, PAPER);

  // Masthead.
  cv.text("MAKE.FUN NEWS IMAGE", 24, 34, 2, INK);
  const ed = "MONDAY EDITION";
  cv.text(ed, 1000 - cv.textWidth(ed, 2), 34, 2, INK);
  cv.centerText("MONDAY 23 NOVEMBER 2026", 512, 56, 6, INK);
  cv.hline(24, 1000, 112, INK, 3);
  cv.hline(24, 1000, 118, INK, 1);
  cv.centerText("FIVE STORIES THAT DEFINED THE DAY", 512, 128, 2, INK);

  // Lead story: COP31.
  artCOP31(cv, 24, 160, 536, 352);
  const tx = 584, tw = 416;
  kicker(cv, "CLIMATE • COP31", tx, 170, RED);
  let y = headline(cv, ["COP31 ENDS", "WITH NO DEAL"], tx, 196, 4, INK);
  cv.hline(tx, tx + tw, y + 6, INK, 2);
  y = cv.para(
    "THE LONGEST CLIMATE SUMMIT ON RECORD COLLAPSED IN ANTALYA AFTER THE EU AND ABOUT 130 COUNTRIES REJECTED A TEXT THAT LEFT OUT FOSSIL FUELS.",
    tx, y + 22, tw, 2, INK, 22,
  );
  y = cv.para("TALKS RAN TWO DAYS INTO OVERTIME. NO DEAL WAS REACHED.", tx, y + 12, tw, 2, INK, 22);
  cv.rect(tx, 468, tw, 30, RED);
  cv.centerText("TWO DAYS OF OVERTIME, NO DEAL", tx + tw / 2, 476, 2, PAPER);

  // Divider.
  cv.hline(24, 1000, 520, INK, 2);

  // Middle row: Dymer rescue and the AI sell-off.
  artDymer(cv, 24, 528, 476, 84);
  kicker(cv, "UKRAINE • DYMER", 24, 624, RED);
  headline(cv, ["BOY, 7, PULLED ALIVE", "FROM RUBBLE"], 24, 648, 3, INK);
  cv.para(
    "A RUSSIAN STRIKE ON DYMER KILLED AT LEAST 10 PEOPLE. RESCUERS FREED A 7-YEAR-OLD BOY AFTER 14 HOURS.",
    24, 702, 476, 2, INK, 18,
  );
  cv.vline(512, 528, 756, INK, 1);
  artMarkets(cv, 524, 528, 476, 84);
  kicker(cv, "MARKETS • AI SELL-OFF", 524, 624, RED);
  headline(cv, ["AI FEARS SINK", "WORLD MARKETS"], 524, 648, 3, INK);
  cv.para(
    "THE NIKKEI FELL 5.06% AND THE S&P 500 FELL 3.7% AS INVESTORS DUMPED AI STOCKS.",
    524, 702, 476, 2, INK, 18,
  );

  // Divider.
  cv.hline(24, 1000, 764, INK, 2);

  // Bottom row: three short stories.
  artMerkury(cv, 24, 772, 312, 80);
  kicker(cv, "LIBYA • UKRAINE WAR", 24, 860, RED);
  headline(cv, ["WARSHIP SUNK", "OFF LIBYA"], 24, 882, 3, INK);
  cv.text("SUSPECTED DRONE ATTACK", 24, 936, 2, INK);
  cv.vline(344, 772, 952, INK, 1);
  artPenny(cv, 356, 772, 312, 80);
  kicker(cv, "USA • MONEY", 356, 860, RED);
  headline(cv, ["THE PENNY ENDS", "AFTER 232 YEARS"], 356, 882, 3, INK);
  cv.text("COMMON CENTS ACT SIGNED", 356, 936, 2, INK);
  cv.vline(676, 772, 952, INK, 1);
  artMarquez(cv, 688, 772, 312, 80);
  kicker(cv, "SPORT • MOTOGP", 688, 860, RED);
  headline(cv, ["MARQUEZ TAKES", "8TH WORLD TITLE"], 688, 882, 3, INK);
  cv.text("EQUALS AGOSTINI'S RECORD", 688, 936, 2, INK);

  // Footer ticker: the day in numbers.
  cv.rect(24, 960, 976, 40, INK);
  cv.centerText("NIKKEI -5.06% • S&P 500 -3.7% • BRENT $89.96 • KOREA EXPORTS $1 TRILLION", 512, 974, 2, PAPER);

  // Outer frame on top of everything.
  cv.frame(16, 16, 992, 992, INK, 2);
  return encodePNG(cv);
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
const png = drawPage();
writeFileSync(join(outDir, "entry.png"), png);
console.log("entry.png " + png.length + " bytes, " + W + "x" + H);
