// Geometry helpers for the puppet rig: smooth paths, ellipsoid projection.
export type P = [number, number];

const f = (n: number) => (Math.round(n * 100) / 100).toString();

/** Catmull-Rom spline through points → cubic Bézier SVG path. */
export const smoothPath = (pts: P[], closed = false, tension = 1): string => {
  if (pts.length < 2) return '';
  const n = pts.length;
  const get = (i: number): P => {
    if (closed) return pts[(i + n) % n];
    return pts[Math.max(0, Math.min(n - 1, i))];
  };
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const t = tension / 6;
    const c1: P = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2: P = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return closed ? d + 'Z' : d;
};

export const polyPath = (pts: P[], closed = true) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${f(p[0])} ${f(p[1])}`).join('') + (closed ? 'Z' : '');

/** Piecewise-linear lookup in a profile table [[y, v], ...] sorted by y desc (0 → -top). */
export const profile = (table: P[], y: number): number => {
  if (y >= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    const [y1, v1] = table[i];
    const [y0, v0] = table[i - 1];
    if (y >= y1) {
      const t = (y - y0) / (y1 - y0);
      const s = t * t * (3 - 2 * t) * 0.35 + t * 0.65; // slight smoothing
      return v0 + (v1 - v0) * s;
    }
  }
  return table[table.length - 1][1];
};

/**
 * Point on an elliptical cross-section (half-width W, half-depth D, centre
 * pushed forward by z0) rotated by angle b around the vertical axis.
 * phi = 0 is the front centre line, + towards screen-right in front view.
 */
export const projEllipse = (phi: number, W: number, D: number, b: number, z0 = 0) => {
  const lx = W * Math.sin(phi);
  const lz = D * Math.cos(phi) + z0;
  return {
    x: lx * Math.cos(b) + lz * Math.sin(b),
    z: -lx * Math.sin(b) + lz * Math.cos(b),
    // foreshortening of a feature sitting on the surface at phi
    fs: Math.cos(phi) * Math.cos(b) - Math.sin(phi) * Math.sin(b) * (D / Math.max(W, 1)),
  };
};

/** Silhouette half-width and centre of a rotated, offset ellipse. */
export const silhouette = (W: number, D: number, b: number, z0 = 0) => ({
  cx: z0 * Math.sin(b),
  hw: Math.sqrt(W * W * Math.cos(b) ** 2 + D * D * Math.sin(b) ** 2),
});

/** Tapered limb (capsule) between two points with start/end widths. */
export const limbPath = (a: P, b: P, wa: number, wb: number, bulge = 0.12): string => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const ux = dx / len;
  const uy = dy / len;
  const m: P = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const wm = (wa + wb) / 2 * (1 + bulge);
  const pts: P[] = [
    [a[0] + nx * wa / 2, a[1] + ny * wa / 2],
    [m[0] + nx * wm / 2, m[1] + ny * wm / 2],
    [b[0] + nx * wb / 2, b[1] + ny * wb / 2],
    [b[0] + ux * wb * 0.42, b[1] + uy * wb * 0.42],
    [b[0] - nx * wb / 2, b[1] - ny * wb / 2],
    [m[0] - nx * wm / 2, m[1] - ny * wm / 2],
    [a[0] - nx * wa / 2, a[1] - ny * wa / 2],
    [a[0] - ux * wa * 0.42, a[1] - uy * wa * 0.42],
  ];
  return smoothPath(pts, true, 0.9);
};

export const rot = (p: P, deg: number, o: P = [0, 0]): P => {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  const x = p[0] - o[0];
  const y = p[1] - o[1];
  return [o[0] + x * c - y * s, o[1] + x * s + y * c];
};

export const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
export const polar = (len: number, deg: number): P => {
  // 0 deg = straight down (+y)
  const r = (deg * Math.PI) / 180;
  return [-Math.sin(r) * len, Math.cos(r) * len];
};
