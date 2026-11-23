// The Day in Five Frames — News Image 23 November 2026
// A newsprint broadsheet front page for Monday 23 November 2026, drawn
// entirely in pure TypeScript with Node built-ins only (no network, no
// native modules, deterministic output). Renders a 1024x1024 PNG.
//
// Design: warm newsprint background, ink-black type, one red accent and
// one blue accent. Masthead on top, one dominant lead story (COP31, left
// 60%), two stacked stories in the right column (Dymer rescue, AI
// sell-off), three smaller panels along the bottom (Merkury, penny,
// Marquez), and a markets ticker strip at the foot.
// Stories: COP31 collapse (Antalya), Dymer strike (Kyiv), AI sell-off
// (S&P -3.7%, Nikkei -5.06%), Merkury sinking (Benghazi), Common Cents
// Act (penny ends after 232 years), Marquez 8th world title.

import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

// ---------------------------------------------------------------- palette
const W = 1024;
const H = 1024;
const PAPER: [number, number, number] = [244, 239, 230]; // #F4EFE6 newsprint
const INK: [number, number, number] = [20, 20, 20]; // #141414
const RED: [number, number, number] = [185, 28, 28]; // #B91C1C
const BLUE: [number, number, number] = [29, 78, 216]; // #1D4ED8
const GREY: [number, number, number] = [120, 113, 102]; // warm grey rules
const SKY: [number, number, number] = [214, 228, 240]; // pale blue panel
type RGB = [number, number, number];

// ------------------------------------------------------------------- font
// 5x7 bitmap font. Each glyph is 7 rows; each row is a 5-bit value,
// bit 4 = leftmost pixel, bit 0 = rightmost pixel. Char advance is
// 6 * scale (5 pixels + 1 pixel tracking). Only the characters the
// broadsheet uses are defined; unknown chars render as a blank.
const FONT: Record<string, number[]> = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1b, 0x11],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  a: [0x00, 0x00, 0x0e, 0x01, 0x0f, 0x11, 0x0f],
  b: [0x10, 0x10, 0x16, 0x19, 0x11, 0x11, 0x1e],
  c: [0x00, 0x00, 0x0e, 0x11, 0x10, 0x11, 0x0e],
  d: [0x01, 0x01, 0x0d, 0x13, 0x11, 0x11, 0x0f],
  e: [0x00, 0x00, 0x0e, 0x11, 0x1f, 0x10, 0x0e],
  f: [0x06, 0x08, 0x08, 0x1e, 0x08, 0x08, 0x08],
  g: [0x00, 0x0f, 0x11, 0x11, 0x0f, 0x01, 0x0e],
  h: [0x10, 0x10, 0x16, 0x19, 0x11, 0x11, 0x11],
  i: [0x04, 0x00, 0x0c, 0x04, 0x04, 0x04, 0x0e],
  j: [0x02, 0x00, 0x06, 0x02, 0x02, 0x12, 0x0c],
  k: [0x10, 0x10, 0x12, 0x14, 0x18, 0x14, 0x11],
  l: [0x0c, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  m: [0x00, 0x00, 0x1a, 0x15, 0x15, 0x15, 0x15],
  n: [0x00, 0x00, 0x16, 0x19, 0x11, 0x11, 0x11],
  o: [0x00, 0x00, 0x0e, 0x11, 0x11, 0x11, 0x0e],
  p: [0x00, 0x00, 0x1e, 0x11, 0x1e, 0x10, 0x10],
  q: [0x00, 0x00, 0x0d, 0x13, 0x0f, 0x01, 0x01],
  r: [0x00, 0x00, 0x16, 0x19, 0x10, 0x10, 0x10],
  s: [0x00, 0x00, 0x0f, 0x10, 0x0e, 0x01, 0x1e],
  t: [0x08, 0x08, 0x1e, 0x08, 0x08, 0x09, 0x06],
  u: [0x00, 0x00, 0x11, 0x11, 0x11, 0x13, 0x0d],
  v: [0x00, 0x00, 0x11, 0x11, 0x11, 0x0a, 0x04],
  w: [0x00, 0x00, 0x11, 0x15, 0x15, 0x1b, 0x11],
  x: [0x00, 0x00, 0x11, 0x0a, 0x04, 0x0a, 0x11],
  y: [0x00, 0x00, 0x11, 0x11, 0x0f, 0x01, 0x0e],
  z: [0x00, 0x00, 0x1f, 0x02, 0x04, 0x08, 0x1f],
  "0": [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  "1": [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  "2": [0x0e, 0x11, 0x01, 0x06, 0x08, 0x10, 0x1f],
  "3": [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  "4": [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  "5": [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  "6": [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  "7": [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  "8": [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  "9": [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  " ": [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  ".": [0x00, 0x00, 0x00, 0x00, 0x00, 0x0c, 0x0c],
  ",": [0x00, 0x00, 0x00, 0x00, 0x0c, 0x04, 0x08],
  "'": [0x04, 0x04, 0x08, 0x00, 0x00, 0x00, 0x00],
  "-": [0x00, 0x00, 0x00, 0x1f, 0x00, 0x00, 0x00],
  ":": [0x00, 0x0c, 0x0c, 0x00, 0x0c, 0x0c, 0x00],
  "%": [0x19, 0x19, 0x02, 0x04, 0x08, 0x13, 0x13],
  $: [0x04, 0x0f, 0x14, 0x0e, 0x05, 0x1e, 0x04],
  "(": [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02],
  ")": [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
  "&": [0x0c, 0x12, 0x14, 0x08, 0x15, 0x12, 0x0d],
  "!": [0x04, 0x04, 0x04, 0x04, 0x04, 0x00, 0x04],
  "?": [0x0e, 0x11, 0x01, 0x02, 0x04, 0x00, 0x04],
  "/": [0x01, 0x01, 0x02, 0x04, 0x08, 0x10, 0x10],
  '"': [0x0a, 0x0a, 0x00, 0x00, 0x00, 0x00, 0x00],
  "+": [0x00, 0x04, 0x04, 0x1f, 0x04, 0x04, 0x00],
  "|": [0x04, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  "\u2022": [0x00, 0x00, 0x0c, 0x0c, 0x0c, 0x00, 0x00],
};

// ------------------------------------------------------------------ canvas
// A plain RGB pixel buffer with the small set of drawing primitives the
// broadsheet needs. Everything is integer math, so two runs of the same
// program produce byte-identical pixels.
class Canvas {
  buf: Uint8Array;
  w: number;
  h: number;
  constructor(w: number, h: number, bg: RGB) {
    this.w = w;
    this.h = h;
    this.buf = new Uint8Array(w * h * 3);
    for (let i = 0; i < w * h; i++) {
      this.buf[i * 3] = bg[0];
      this.buf[i * 3 + 1] = bg[1];
      this.buf[i * 3 + 2] = bg[2];
    }
  }
  px(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 3;
    this.buf[i] = c[0];
    this.buf[i + 1] = c[1];
    this.buf[i + 2] = c[2];
  }
  fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) this.px(xx, yy, c);
  }
  rect(x: number, y: number, w: number, h: number, c: RGB, t = 1): void {
    for (let k = 0; k < t; k++) {
      this.hline(x, x + w - 1, y + k, c);
      this.hline(x, x + w - 1, y + h - 1 - k, c);
      this.vline(x + k, y, y + h - 1, c);
      this.vline(x + w - 1 - k, y, y + h - 1, c);
    }
  }
  hline(x0: number, x1: number, y: number, c: RGB): void {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.px(x, y, c);
  }
  vline(x: number, y0: number, y1: number, c: RGB): void {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) this.px(x, y, c);
  }
  // Bresenham line.
  line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.px(x, y, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }
  // Filled circle (midpoint, scanline fill per row).
  circle(cx: number, cy: number, r: number, c: RGB): void {
    for (let y = -r; y <= r; y++) {
      const half = Math.floor(Math.sqrt(r * r - y * y));
      this.hline(cx - half, cx + half, cy + y, c);
    }
  }
  // Circle outline only.
  ring(cx: number, cy: number, r: number, c: RGB, t = 1): void {
    for (let k = 0; k < t; k++) {
      let x = r - k;
      let y = 0;
      let err = 0;
      while (x >= y) {
        this.px(cx + x, cy + y, c);
        this.px(cx + y, cy + x, c);
        this.px(cx - y, cy + x, c);
        this.px(cx - x, cy + y, c);
        this.px(cx - x, cy - y, c);
        this.px(cx - y, cy - x, c);
        this.px(cx + y, cy - x, c);
        this.px(cx + x, cy - y, c);
        y += 1;
        err += 1 + 2 * y;
        if (2 * (err - x) + 1 > 0) {
          x -= 1;
          err += 1 - 2 * x;
        }
      }
    }
  }
  // Filled triangle (scanline).
  triangle(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    c: RGB,
  ): void {
    const minY = Math.min(y0, y1, y2);
    const maxY = Math.max(y0, y1, y2);
    for (let y = minY; y <= maxY; y++) {
      const xs: number[] = [];
      const edges: [number, number, number, number][] = [
        [x0, y0, x1, y1],
        [x1, y1, x2, y2],
        [x2, y2, x0, y0],
      ];
      for (const [ax, ay, bx, by] of edges) {
        if ((ay <= y && by > y) || (by <= y && ay > y)) {
          xs.push(Math.round(ax + ((y - ay) * (bx - ax)) / (by - ay)));
        }
      }
      if (xs.length >= 2) {
        this.hline(Math.min(...xs), Math.max(...xs), y, c);
      }
    }
  }
  // Draw one glyph of the 5x7 font at (x, y), top-left, at integer scale.
  glyph(ch: string, x: number, y: number, s: number, c: RGB): void {
    const g = FONT[ch] ?? FONT[" "];
    for (let row = 0; row < 7; row++) {
      const bits = g[row];
      for (let col = 0; col < 5; col++) {
        if (bits & (1 << (4 - col))) {
          this.fillRect(x + col * s, y + row * s, s, s, c);
        }
      }
    }
  }
  // Draw a string; returns the x position after the last character.
  // align: "left" | "center" | "right" relative to (x, maxW).
  text(
    str: string,
    x: number,
    y: number,
    s: number,
    c: RGB,
    align: "left" | "center" | "right" = "left",
    maxW = 0,
  ): number {
    const w = str.length * 6 * s - s;
    let sx = x;
    if (align === "center") sx = x + Math.floor((maxW - w) / 2);
    if (align === "right") sx = x + (maxW - w);
    for (let i = 0; i < str.length; i++) {
      this.glyph(str[i], sx + i * 6 * s, y, s, c);
    }
    return sx + w;
  }
  textWidth(str: string, s: number): number {
    return str.length * 6 * s - s;
  }
  // Word-wrap a paragraph to lines that fit maxW at scale s.
  wrap(str: string, maxW: number, s: number): string[] {
    const words = str.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const word of words) {
      const trial = cur ? cur + " " + word : word;
      if (this.textWidth(trial, s) <= maxW) {
        cur = trial;
      } else {
        if (cur) lines.push(cur);
        cur = word;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }
  // Draw a wrapped paragraph; returns the y after the last line.
  paragraph(
    str: string,
    x: number,
    y: number,
    maxW: number,
    s: number,
    c: RGB,
    leading: number,
  ): number {
    const lines = this.wrap(str, maxW, s);
    for (const line of lines) {
      this.text(line, x, y, s, c);
      y += leading;
    }
    return y;
  }
}

// -------------------------------------------------------------- PNG output
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
})();
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
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
// Encode the RGB buffer as a PNG (color type 2, filter 0 per scanline).
function pngEncode(cv: Canvas): Buffer {
  const { w, h } = cv;
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0;
    raw.set(cv.buf.subarray(y * w * 3, (y + 1) * w * 3), y * (1 + w * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------ story data
// The six stories of Monday 23 November 2026, as reported that day.
// Headlines are pre-split into lines that fit their panel at scale 3.
type Story = {
  kicker: string;
  lines: string[];
  body: string;
  pic: "globe" | "rubble" | "chart" | "ship" | "coin" | "flag";
};
const LEAD: Story = {
  kicker: "CLIMATE SUMMIT \u2022 ANTALYA",
  lines: ["COP31 COLLAPSES"],
  body: "The COP31 climate summit in Antalya, Turkey, ended Sunday with no overall agreement after two days of overtime. The European Union and about 130 other parties rejected a draft text that omitted fossil fuels.",
  pic: "globe",
};
const DYMER: Story = {
  kicker: "UKRAINE \u2022 DYMER",
  lines: ["DYMER STRIKE", "KILLS 10"],
  body: "A Russian strike on Dymer, north of Kyiv, killed at least 10 people. Rescue teams pulled survivors from the rubble as the town counted its dead.",
  pic: "rubble",
};
const AI: Story = {
  kicker: "MARKETS",
  lines: ["AI SELL-OFF", "RATTLES MARKETS"],
  body: "Fears that AI shares are overpriced drove markets down. The S&P 500 fell 3.7% and the Nikkei dropped 5.06%.",
  pic: "chart",
};
const MERKURY: Story = {
  kicker: "BLACK SEA",
  lines: ["MERKURY SINKS", "IN BENGHAZI"],
  body: "A vessel sank in Benghazi after a suspected Ukrainian naval drone attack off the coast of Libya, President Volodymyr Zelenskyy said.",
  pic: "ship",
};
const PENNY: Story = {
  kicker: "WASHINGTON",
  lines: ["PENNY ENDS", "AFTER 232 YEARS"],
  body: "President Trump signed the Common Cents Act, bringing the penny's 232-year run to a legislative close.",
  pic: "coin",
};
const MARQUEZ: Story = {
  kicker: "MOTOGP",
  lines: ["MARQUEZ TAKES", "8TH WORLD TITLE"],
  body: "Marc Marquez took his eighth world title, equalling Agostini's record.",
  pic: "flag",
};
const TICKER =
  "NIKKEI -5.06%  \u2022  S&P 500 -3.7%  \u2022  BRENT 89.96  \u2022  KOREA EXPORTS $1T";

// ------------------------------------------------------------ pictograms
// Small drawn scenes. Each takes the panel's content box and draws a
// bold, simple pictogram in the ink/red/blue palette.
function drawGlobe(cv: Canvas, x: number, y: number, w: number, h: number): void {
  // Sky panel.
  cv.fillRect(x, y, w, h, SKY);
  cv.rect(x, y, w, h, INK, 2);
  const cx = x + Math.floor(w / 2);
  const cy = y + Math.floor(h / 2) - 6;
  const r = 72;
  // Sun, top right.
  cv.circle(x + w - 52, y + 34, 16, RED);
  // Globe: pale disc, ink ring, meridian + latitude lines.
  cv.circle(cx, cy, r, [226, 236, 244]);
  cv.ring(cx, cy, r, INK, 3);
  cv.vline(cx, cy - r, cy + r, INK);
  cv.hline(cx - r, cx + r, cy, INK);
  cv.ring(cx, cy, Math.floor(r * 0.55), INK, 1);
  cv.hline(cx - 62, cx + 62, cy - 40, INK);
  cv.hline(cx - 62, cx + 62, cy + 40, INK);
  // The crack: a red zigzag across the globe.
  const crack: [number, number][] = [
    [cx - 58, cy - 52],
    [cx - 30, cy - 28],
    [cx - 44, cy - 6],
    [cx - 12, cy + 14],
    [cx - 26, cy + 34],
    [cx + 8, cy + 52],
    [cx + 40, cy + 58],
  ];
  for (let i = 0; i < crack.length - 1; i++) {
    const [ax, ay] = crack[i];
    const [bx, by] = crack[i + 1];
    cv.line(ax, ay, bx, by, RED);
    cv.line(ax + 1, ay, bx + 1, by, RED);
    cv.line(ax, ay + 1, bx, by + 1, RED);
  }
  // Ground line + mountains.
  cv.hline(x + 14, x + w - 14, y + h - 26, INK);
  cv.triangle(x + 30, y + h - 26, x + 62, y + h - 62, x + 94, y + h - 26, INK);
  cv.triangle(x + 80, y + h - 26, x + 118, y + h - 78, x + 156, y + h - 26, GREY);
}
function drawRubble(cv: Canvas, x: number, y: number, w: number, h: number): void {
  // Broken building slabs + a red rescue cross.
  cv.fillRect(x, y, w, h, SKY);
  cv.rect(x, y, w, h, INK, 1);
  cv.triangle(x + 12, y + h - 8, x + 46, y + 22, x + 84, y + h - 8, GREY);
  cv.triangle(x + 60, y + h - 8, x + 104, y + 34, x + 150, y + h - 8, INK);
  cv.triangle(x + 120, y + h - 8, x + 150, y + 44, x + 182, y + h - 8, GREY);
  // Rescue cross, top right.
  const kx = x + w - 44;
  const ky = y + 12;
  cv.fillRect(kx, ky, 28, 10, RED);
  cv.fillRect(kx + 9, ky - 9, 10, 28, RED);
}
function drawChart(cv: Canvas, x: number, y: number, w: number, h: number): void {
  // A market line that falls off a cliff, in red, on graph paper.
  cv.fillRect(x, y, w, h, [255, 255, 255]);
  cv.rect(x, y, w, h, INK, 1);
  for (let gx = x + 20; gx < x + w - 8; gx += 20) cv.vline(gx, y + 6, y + h - 6, [228, 222, 210]);
  for (let gy = y + 16; gy < y + h - 8; gy += 16) cv.hline(x + 6, x + w - 6, gy, [228, 222, 210]);
  // Points as fractions of the box, so the chart scales to any height.
  const pts: [number, number][] = [
    [x + Math.floor(w * 0.05), y + Math.floor(h * 0.28)],
    [x + Math.floor(w * 0.22), y + Math.floor(h * 0.36)],
    [x + Math.floor(w * 0.38), y + Math.floor(h * 0.30)],
    [x + Math.floor(w * 0.55), y + Math.floor(h * 0.50)],
    [x + Math.floor(w * 0.72), y + Math.floor(h * 0.66)],
    [x + Math.floor(w * 0.88), y + Math.floor(h * 0.90)],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    cv.line(ax, ay, bx, by, RED);
    cv.line(ax, ay + 1, bx, by + 1, RED);
    cv.line(ax + 1, ay, bx + 1, by, RED);
  }
  cv.line(x + 8, y + h - 14, x + w - 8, y + h - 14, INK);
}
function drawShip(cv: Canvas, x: number, y: number, w: number, h: number): void {
  // A listing ship on waves. All coordinates are fractions of the box,
  // so the ship scales to any pictogram height.
  cv.fillRect(x, y, w, h, SKY);
  cv.rect(x, y, w, h, INK, 1);
  const waterY = y + Math.floor(h * 0.72);
  // Waves.
  for (let wy = waterY; wy < y + h - 4; wy += 9) {
    for (let wx = x + 8; wx < x + w - 16; wx += 24) {
      cv.line(wx, wy, wx + 12, wy - 4, BLUE);
      cv.line(wx + 12, wy - 4, wx + 24, wy, BLUE);
    }
  }
  // Hull: a tilted trapezoid sitting on the water line.
  const hx0 = x + Math.floor(w * 0.12);
  const hx1 = x + Math.floor(w * 0.88);
  const hyTop = y + Math.floor(h * 0.42);
  const hyBot = waterY + 2;
  cv.triangle(hx0, hyTop, hx1, hyTop - Math.floor(h * 0.08), hx1 - 8, hyBot, INK);
  cv.triangle(hx0, hyTop, hx1 - 8, hyBot, hx0 + 10, hyBot, INK);
  // Mast + red flag.
  const mx = x + Math.floor(w * 0.52);
  cv.vline(mx, y + Math.floor(h * 0.10), hyTop, INK);
  cv.triangle(mx, y + Math.floor(h * 0.10), mx + Math.floor(w * 0.20), y + Math.floor(h * 0.20), mx, y + Math.floor(h * 0.30), RED);
  // Smoke puffs.
  const sr = Math.max(3, Math.floor(h * 0.07));
  cv.circle(mx + Math.floor(w * 0.16), y + Math.floor(h * 0.24), sr, GREY);
  cv.circle(mx + Math.floor(w * 0.26), y + Math.floor(h * 0.14), sr + 1, GREY);
}
function drawCoin(cv: Canvas, x: number, y: number, w: number, h: number): void {
  // A big penny with a red slash through it.
  cv.fillRect(x, y, w, h, [255, 255, 255]);
  cv.rect(x, y, w, h, INK, 1);
  const cx = x + Math.floor(w / 2);
  const cy = y + Math.floor(h / 2);
  const r = Math.min(44, Math.floor(h / 2) - 4);
  const s1 = Math.max(3, Math.floor(r / 7));
  cv.circle(cx, cy, r, [212, 175, 120]);
  cv.ring(cx, cy, r, INK, 3);
  cv.ring(cx, cy, Math.max(4, r - 10), INK, 1);
  cv.text("1", cx - Math.floor((s1 * 5) / 2), cy - Math.floor((s1 * 7) / 2), s1, INK);
  cv.text("CENT", cx - 18, cy + Math.floor(r * 0.4), 2, INK);
  // Red slash.
  const sl = r - 8;
  cv.line(cx - sl, cy + sl, cx + sl, cy - sl, RED);
  cv.line(cx - sl + 1, cy + sl, cx + sl + 1, cy - sl, RED);
  cv.line(cx - sl, cy + sl + 1, cx + sl, cy - sl + 1, RED);
}
function drawFlag(cv: Canvas, x: number, y: number, w: number, h: number): void {
  // A checkered flag beside a big "8".
  cv.fillRect(x, y, w, h, [255, 255, 255]);
  cv.rect(x, y, w, h, INK, 1);
  const fx = x + 14;
  const fy = y + 14;
  const cell = 16;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      if ((row + col) % 2 === 0) {
        cv.fillRect(fx + col * cell, fy + row * cell, cell, cell, INK);
      }
    }
  }
  cv.rect(fx, fy, 5 * cell, 4 * cell, INK, 2);
  // Flag pole.
  cv.vline(fx - 4, fy - 6, fy + 4 * cell + 10, INK);
  // Big 8 in a red ring.
  const cx = x + w - 52;
  const cy = y + Math.floor(h / 2);
  cv.ring(cx, cy, 34, RED, 3);
  cv.text("8", cx - 11, cy - 24, 7, INK);
}
function drawPic(cv: Canvas, kind: Story["pic"], x: number, y: number, w: number, h: number): void {
  if (kind === "globe") drawGlobe(cv, x, y, w, h);
  else if (kind === "rubble") drawRubble(cv, x, y, w, h);
  else if (kind === "chart") drawChart(cv, x, y, w, h);
  else if (kind === "ship") drawShip(cv, x, y, w, h);
  else if (kind === "coin") drawCoin(cv, x, y, w, h);
  else drawFlag(cv, x, y, w, h);
}

// ------------------------------------------------------------- page layout
const MX = 32; // outer margin
const RX = W - MX; // right edge of the content area

function kicker(cv: Canvas, s: Story, x: number, y: number): number {
  cv.text(s.kicker, x, y, 2, RED);
  return y + 22;
}
function headline(cv: Canvas, s: Story, x: number, y: number, scale: number): number {
  for (const line of s.lines) {
    cv.text(line, x, y, scale, INK);
    y += 7 * scale + 6;
  }
  return y;
}
function body(cv: Canvas, s: Story, x: number, y: number, maxW: number): number {
  return cv.paragraph(s.body, x, y, maxW, 2, INK, 20);
}

function main(): void {
  const cv = new Canvas(W, H, PAPER);

  // ---- masthead
  cv.text("THE DAY IN FIVE FRAMES", MX, 26, 5, INK, "center", RX - MX);
  cv.hline(MX, RX - 1, 78, INK);
  cv.hline(MX, RX - 1, 82, INK);
  cv.text("MONDAY, 23 NOVEMBER 2026", MX, 92, 2, INK);
  cv.text("THE WORLD IN ONE PAGE", MX, 92, 2, INK, "right", RX - MX);
  cv.fillRect(MX, 116, RX - MX, 4, INK);

  // ---- lead story (left 60%)
  const leadX = MX;
  const leadW = 556;
  const leadY = 132;
  const leadH = 428;
  cv.rect(leadX, leadY, leadW, leadH, INK, 2);
  let y = kicker(cv, LEAD, leadX + 16, leadY + 14);
  y = headline(cv, LEAD, leadX + 16, y + 6, 5);
  y = body(cv, LEAD, leadX + 16, y + 10, leadW - 32);
  const sceneY = y + 12;
  const sceneH = leadY + leadH - 26 - sceneY;
  drawPic(cv, "globe", leadX + 16, sceneY, leadW - 32, sceneH);
  cv.text("ANTALYA: TWO DAYS OF OVERTIME, NO DEAL.", leadX + 16, leadY + leadH - 20, 1, GREY);

  // ---- right column (two stacked stories)
  const colX = leadX + leadW + 16;
  const colW = RX - colX;
  const colH = Math.floor((leadH - 16) / 2);
  // Dymer (top)
  cv.rect(colX, leadY, colW, colH, INK, 2);
  y = kicker(cv, DYMER, colX + 14, leadY + 12);
  y = headline(cv, DYMER, colX + 14, y + 4, 3);
  y = body(cv, DYMER, colX + 14, y + 6, colW - 28);
  const dPicH = leadY + colH - 10 - (y + 8);
  if (dPicH >= 28) drawPic(cv, "rubble", colX + 14, y + 8, colW - 28, dPicH);
  // AI sell-off (bottom)
  const aiY = leadY + colH + 16;
  cv.rect(colX, aiY, colW, colH, INK, 2);
  y = kicker(cv, AI, colX + 14, aiY + 12);
  y = headline(cv, AI, colX + 14, y + 4, 3);
  y = body(cv, AI, colX + 14, y + 6, colW - 28);
  const aPicH = aiY + colH - 10 - (y + 8);
  if (aPicH >= 28) drawPic(cv, "chart", colX + 14, y + 8, colW - 28, aPicH);

  // ---- bottom row (three panels)
  const botY = leadY + leadH + 16;
  const botH = 300;
  const botW = Math.floor((RX - MX - 32) / 3);
  const bottoms: [Story, number][] = [
    [MERKURY, MX],
    [PENNY, MX + botW + 16],
    [MARQUEZ, MX + 2 * botW + 32],
  ];
  for (const [st, bx] of bottoms) {
    cv.rect(bx, botY, botW, botH, INK, 2);
    let by = kicker(cv, st, bx + 14, botY + 12);
    by = headline(cv, st, bx + 14, by + 4, 3);
    by = body(cv, st, bx + 14, by + 6, botW - 28);
    const pH = botY + botH - 10 - (by + 8);
    if (pH >= 28) drawPic(cv, st.pic, bx + 14, by + 8, botW - 28, pH);
  }

  // ---- markets ticker
  const tickY = botY + botH + 16;
  cv.fillRect(MX, tickY, RX - MX, 52, INK);
  cv.text(TICKER, MX, tickY + 19, 2, PAPER, "center", RX - MX);

  // ---- folio line
  cv.text(
    "THE DAY IN FIVE FRAMES \u2022 23 NOVEMBER 2026 \u2022 SUMMING UP THE WORLD IN ONE PAGE",
    MX,
    tickY + 66,
    1,
    GREY,
    "center",
    RX - MX,
  );

  // ---- write the PNG
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "output";
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "entry.png");
  const png = pngEncode(cv);
  fs.writeFileSync(outPath, png);
  console.log(`wrote ${outPath} ${png.length} bytes ${W}x${H}`);
}

main();
