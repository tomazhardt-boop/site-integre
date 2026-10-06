using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Text;

public class RImg {
    public int W;
    public int H;
    public int[] Px;
    public RImg(int w, int h) { W = w; H = h; Px = new int[w * h]; }
}

// Background removal helpers (flood fill from the borders + edge unmixing).
public static class Recorte {
    static int A(int p) { return (p >> 24) & 255; }
    static int R(int p) { return (p >> 16) & 255; }
    static int G(int p) { return (p >> 8) & 255; }
    static int B(int p) { return p & 255; }
    static int Pack(int a, int r, int g, int b) { return (a << 24) | (r << 16) | (g << 8) | b; }
    static int Cl(double v) { if (v < 0) return 0; if (v > 255) return 255; return (int)Math.Round(v); }

    public static RImg FromBitmap(Bitmap bmp) {
        RImg im = new RImg(bmp.Width, bmp.Height);
        BitmapData d = bmp.LockBits(new Rectangle(0, 0, bmp.Width, bmp.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        Marshal.Copy(d.Scan0, im.Px, 0, im.W * im.H);
        bmp.UnlockBits(d);
        return im;
    }

    public static Bitmap ToBitmap(RImg im) {
        Bitmap bmp = new Bitmap(im.W, im.H, PixelFormat.Format32bppArgb);
        BitmapData d = bmp.LockBits(new Rectangle(0, 0, im.W, im.H), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
        Marshal.Copy(im.Px, 0, d.Scan0, im.W * im.H);
        bmp.UnlockBits(d);
        return bmp;
    }

    static RImg Draw(Bitmap src, int w, int h) {
        using (Bitmap bmp = new Bitmap(w, h, PixelFormat.Format32bppArgb)) {
            using (Graphics g = Graphics.FromImage(bmp)) {
                g.CompositingMode = CompositingMode.SourceCopy;
                g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                g.SmoothingMode = SmoothingMode.HighQuality;
                using (ImageAttributes ia = new ImageAttributes()) {
                    ia.SetWrapMode(WrapMode.TileFlipXY);
                    g.DrawImage(src, new Rectangle(0, 0, w, h), 0, 0, src.Width, src.Height, GraphicsUnit.Pixel, ia);
                }
            }
            return FromBitmap(bmp);
        }
    }

    public static RImg Load(string path, int maxW, int maxH) {
        using (Bitmap src = new Bitmap(path)) {
            double s = Math.Min(1.0, Math.Min((double)maxW / src.Width, (double)maxH / src.Height));
            int w = Math.Max(1, (int)Math.Round(src.Width * s));
            int h = Math.Max(1, (int)Math.Round(src.Height * s));
            return Draw(src, w, h);
        }
    }

    public static RImg Resize(RImg im, int w, int h) {
        using (Bitmap src = ToBitmap(im)) { return Draw(src, w, h); }
    }

    public static void Save(RImg im, string path) {
        using (Bitmap bmp = ToBitmap(im)) { bmp.Save(path, ImageFormat.Png); }
    }

    // ---------- background model ----------
    // mode 0 = white; 1 = per-row blend of the left/right border strips (gradient backdrop);
    // mode 2 = paper colour taken from the border + lavender watercolour wash
    static double[] rowL, rowR;
    static double[] paper = new double[3];

    static void BuildModel(RImg im, int mode, int strip) {
        int W = im.W, H = im.H;
        rowL = new double[H * 3];
        rowR = new double[H * 3];
        if (mode == 1) {
            for (int y = 0; y < H; y++) {
                double l0 = 0, l1 = 0, l2 = 0, r0 = 0, r1 = 0, r2 = 0; int n = 0;
                for (int yy = Math.Max(0, y - 4); yy <= Math.Min(H - 1, y + 4); yy++) {
                    for (int x = 0; x < strip; x++) {
                        int pl = im.Px[yy * W + x];
                        int pr = im.Px[yy * W + (W - 1 - x)];
                        l0 += R(pl); l1 += G(pl); l2 += B(pl);
                        r0 += R(pr); r1 += G(pr); r2 += B(pr);
                        n++;
                    }
                }
                rowL[y * 3] = l0 / n; rowL[y * 3 + 1] = l1 / n; rowL[y * 3 + 2] = l2 / n;
                rowR[y * 3] = r0 / n; rowR[y * 3 + 1] = r1 / n; rowR[y * 3 + 2] = r2 / n;
            }
        }
        if (mode == 2) {
            double s0 = 0, s1 = 0, s2 = 0; int n = 0;
            for (int x = 0; x < W; x += 2) {
                for (int k = 0; k < 4; k++) {
                    int a = im.Px[k * W + x], b = im.Px[(H - 1 - k) * W + x];
                    s0 += R(a) + R(b); s1 += G(a) + G(b); s2 += B(a) + B(b); n += 2;
                }
            }
            paper[0] = s0 / n; paper[1] = s1 / n; paper[2] = s2 / n;
        }
    }

    static bool IsWash(int r, int g, int b) {
        int mx = Math.Max(r, Math.Max(g, b)), mn = Math.Min(r, Math.Min(g, b));
        if (mx < 140) return false;
        double d = mx - mn;
        if (d / mx < 0.06) return false;
        double h;
        if (mx == r) h = 60 * (((g - b) / d) % 6);
        else if (mx == g) h = 60 * (((b - r) / d) + 2);
        else h = 60 * (((r - g) / d) + 4);
        if (h < 0) h += 360;
        return h >= 200 && h <= 290 && b >= r && b > g;
    }

    static double ModelDist(RImg im, int i, int mode) {
        int p = im.Px[i];
        int r = R(p), g = G(p), b = B(p);
        if (mode == 0) return Math.Max(255 - r, Math.Max(255 - g, 255 - b));
        if (mode == 1) {
            int W = im.W; int y = i / W; int x = i - y * W;
            double t = W > 1 ? (double)x / (W - 1) : 0;
            double mr = rowL[y * 3] * (1 - t) + rowR[y * 3] * t;
            double mg = rowL[y * 3 + 1] * (1 - t) + rowR[y * 3 + 1] * t;
            double mb = rowL[y * 3 + 2] * (1 - t) + rowR[y * 3 + 2] * t;
            return Math.Sqrt((r - mr) * (r - mr) + (g - mg) * (g - mg) + (b - mb) * (b - mb));
        }
        if (IsWash(r, g, b)) return 0;
        return Math.Sqrt((r - paper[0]) * (r - paper[0]) + (g - paper[1]) * (g - paper[1]) + (b - paper[2]) * (b - paper[2]));
    }

    public static string Probe(RImg im, int mode, double[] pts) {
        BuildModel(im, mode, 12);
        StringBuilder sb = new StringBuilder();
        for (int k = 0; k + 1 < pts.Length; k += 2) {
            int x = (int)(pts[k] * (im.W - 1)), y = (int)(pts[k + 1] * (im.H - 1));
            int i = y * im.W + x; int p = im.Px[i];
            sb.AppendFormat("({0},{1}) rgb=({2},{3},{4}) dist={5:F1}\n", x, y, R(p), G(p), B(p), ModelDist(im, i, mode));
        }
        return sb.ToString();
    }

    // ---------- region = background pixels ----------
    static void Grow(RImg im, int from, int j, bool[] reg, double[] dist, double tol, double tolStep, int[] q, ref int qt) {
        if (reg[j] || dist[j] > tol) return;
        if (tolStep < 255) {
            int a = im.Px[from], b = im.Px[j];
            int d = Math.Max(Math.Abs(R(a) - R(b)), Math.Max(Math.Abs(G(a) - G(b)), Math.Abs(B(a) - B(b))));
            if (d > tolStep) return;
        }
        reg[j] = true; q[qt++] = j;
    }

    // seedsFrac: extra (x,y) pairs in 0..1 for enclosed background islands
    public static bool[] Region(RImg im, int mode, double tol, double tolStep, bool global, double[] seedsFrac) {
        BuildModel(im, mode, 12);
        int W = im.W, H = im.H, N = W * H;
        double[] dist = new double[N];
        for (int i = 0; i < N; i++) dist[i] = ModelDist(im, i, mode);
        bool[] reg = new bool[N];
        if (global) { for (int i = 0; i < N; i++) reg[i] = dist[i] <= tol; return reg; }
        int[] q = new int[N]; int qh = 0, qt = 0;
        for (int x = 0; x < W; x++) {
            int a = x, b = (H - 1) * W + x;
            if (!reg[a] && dist[a] <= tol) { reg[a] = true; q[qt++] = a; }
            if (!reg[b] && dist[b] <= tol) { reg[b] = true; q[qt++] = b; }
        }
        for (int y = 0; y < H; y++) {
            int a = y * W, b = y * W + W - 1;
            if (!reg[a] && dist[a] <= tol) { reg[a] = true; q[qt++] = a; }
            if (!reg[b] && dist[b] <= tol) { reg[b] = true; q[qt++] = b; }
        }
        if (seedsFrac != null) {
            for (int k = 0; k + 1 < seedsFrac.Length; k += 2) {
                int x = (int)(seedsFrac[k] * (W - 1)), y = (int)(seedsFrac[k + 1] * (H - 1));
                int i = y * W + x;
                if (!reg[i]) { reg[i] = true; q[qt++] = i; }
            }
        }
        while (qh < qt) {
            int i = q[qh++]; int y = i / W, x = i - y * W;
            if (x > 0) Grow(im, i, i - 1, reg, dist, tol, tolStep, q, ref qt);
            if (x < W - 1) Grow(im, i, i + 1, reg, dist, tol, tolStep, q, ref qt);
            if (y > 0) Grow(im, i, i - W, reg, dist, tol, tolStep, q, ref qt);
            if (y < H - 1) Grow(im, i, i + W, reg, dist, tol, tolStep, q, ref qt);
        }
        return reg;
    }

    static bool IsLavender(int r, int g, int b) {
        int mx = Math.Max(r, Math.Max(g, b)), mn = Math.Min(r, Math.Min(g, b));
        if (mx < 95 || mx > 235) return false;
        double d = mx - mn;
        double s = d / mx;
        if (s < 0.08 || s > 0.35) return false;
        double h;
        if (mx == r) h = 60 * (((g - b) / d) % 6);
        else if (mx == g) h = 60 * (((b - r) / d) + 2);
        else h = 60 * (((r - g) / d) + 4);
        if (h < 0) h += 360;
        return h >= 215 && h <= 265;
    }

    // Gradient backdrop with a soft floor shadow: grow only through smooth pixels (fur has texture).
    // A pixel is background-like if it is close to the border model or lavender, and its 5x5
    // luminance range is at most smoothThr.
    public static bool[] RegionSmooth(RImg im, double tol, double tolStep, double smoothThr, double[] seedsFrac) {
        BuildModel(im, 1, 12);
        int W = im.W, H = im.H, N = W * H;
        int[] lum = new int[N];
        for (int i = 0; i < N; i++) { int p = im.Px[i]; lum[i] = (R(p) * 3 + G(p) * 6 + B(p)) / 10; }
        double[] dist = new double[N];
        for (int y = 0; y < H; y++) {
            for (int x = 0; x < W; x++) {
                int i = y * W + x;
                int lo = 255, hi = 0;
                for (int yy = Math.Max(0, y - 2); yy <= Math.Min(H - 1, y + 2); yy++)
                    for (int xx = Math.Max(0, x - 2); xx <= Math.Min(W - 1, x + 2); xx++) {
                        int l = lum[yy * W + xx]; if (l < lo) lo = l; if (l > hi) hi = l;
                    }
                if (hi - lo > smoothThr) { dist[i] = 999; continue; }
                int p = im.Px[i];
                double md = ModelDist(im, i, 1);
                dist[i] = (md <= tol || IsLavender(R(p), G(p), B(p))) ? 0 : 999;
            }
        }
        bool[] reg = new bool[N];
        int[] q = new int[N]; int qh = 0, qt = 0;
        for (int x = 0; x < W; x++) {
            int a = x, b = (H - 1) * W + x;
            if (!reg[a] && dist[a] == 0) { reg[a] = true; q[qt++] = a; }
            if (!reg[b] && dist[b] == 0) { reg[b] = true; q[qt++] = b; }
        }
        for (int y = 0; y < H; y++) {
            int a = y * W, b = y * W + W - 1;
            if (!reg[a] && dist[a] == 0) { reg[a] = true; q[qt++] = a; }
            if (!reg[b] && dist[b] == 0) { reg[b] = true; q[qt++] = b; }
        }
        if (seedsFrac != null) {
            for (int k = 0; k + 1 < seedsFrac.Length; k += 2) {
                int i = (int)(seedsFrac[k + 1] * (H - 1)) * W + (int)(seedsFrac[k] * (W - 1));
                if (!reg[i]) { reg[i] = true; q[qt++] = i; }
            }
        }
        while (qh < qt) {
            int i = q[qh++]; int y = i / W, x = i - y * W;
            if (x > 0) Grow(im, i, i - 1, reg, dist, 0, tolStep, q, ref qt);
            if (x < W - 1) Grow(im, i, i + 1, reg, dist, 0, tolStep, q, ref qt);
            if (y > 0) Grow(im, i, i - W, reg, dist, 0, tolStep, q, ref qt);
            if (y < H - 1) Grow(im, i, i + W, reg, dist, 0, tolStep, q, ref qt);
        }
        return reg;
    }

    // Foreground blobs smaller than minSize pixels become background (JPEG specks).
    public static void Despeck(RImg im, bool[] reg, int minSize) {
        int W = im.W, H = im.H, N = W * H;
        bool[] seen = new bool[N]; int[] q = new int[N];
        for (int s = 0; s < N; s++) {
            if (reg[s] || seen[s]) continue;
            int qh = 0, qt = 0; q[qt++] = s; seen[s] = true;
            while (qh < qt) {
                int i = q[qh++]; int y = i / W, x = i - y * W;
                if (x > 0 && !reg[i - 1] && !seen[i - 1]) { seen[i - 1] = true; q[qt++] = i - 1; }
                if (x < W - 1 && !reg[i + 1] && !seen[i + 1]) { seen[i + 1] = true; q[qt++] = i + 1; }
                if (y > 0 && !reg[i - W] && !seen[i - W]) { seen[i - W] = true; q[qt++] = i - W; }
                if (y < H - 1 && !reg[i + W] && !seen[i + W]) { seen[i + W] = true; q[qt++] = i + W; }
            }
            if (qt < minSize) for (int k = 0; k < qt; k++) reg[q[k]] = true;
        }
    }

    // Region -> transparent. Pixels near the region get alpha by projecting their colour on the
    // line between the local background colour and the nearest strong foreground colour.
    public static RImg Apply(RImg im, bool[] reg, int rad, double minFg) {
        int W = im.W, H = im.H; RImg o = new RImg(W, H);
        for (int y = 0; y < H; y++) {
            for (int x = 0; x < W; x++) {
                int i = y * W + x; int p = im.Px[i];
                if (reg[i]) { o.Px[i] = 0; continue; }
                double sr = 0, sg = 0, sb = 0; int n = 0;
                int y0 = Math.Max(0, y - rad), y1 = Math.Min(H - 1, y + rad);
                int x0 = Math.Max(0, x - rad), x1 = Math.Min(W - 1, x + rad);
                for (int yy = y0; yy <= y1; yy++) {
                    for (int xx = x0; xx <= x1; xx++) {
                        int j = yy * W + xx;
                        if (reg[j]) { int pj = im.Px[j]; sr += R(pj); sg += G(pj); sb += B(pj); n++; }
                    }
                }
                if (n == 0) { o.Px[i] = p; continue; }
                sr /= n; sg /= n; sb /= n;
                int r2 = rad + 1; double best = -1; int fr = 0, fgc = 0, fb = 0;
                int Y0 = Math.Max(0, y - r2), Y1 = Math.Min(H - 1, y + r2);
                int X0 = Math.Max(0, x - r2), X1 = Math.Min(W - 1, x + r2);
                for (int yy = Y0; yy <= Y1; yy++) {
                    for (int xx = X0; xx <= X1; xx++) {
                        int j = yy * W + xx;
                        if (reg[j]) continue;
                        int pj = im.Px[j];
                        double d = (R(pj) - sr) * (R(pj) - sr) + (G(pj) - sg) * (G(pj) - sg) + (B(pj) - sb) * (B(pj) - sb);
                        if (d > best) { best = d; fr = R(pj); fgc = G(pj); fb = B(pj); }
                    }
                }
                double fd = Math.Sqrt(best);
                int cr = R(p), cg = G(p), cb = B(p);
                double a;
                if (fd < minFg) a = 0;
                else {
                    double vx = fr - sr, vy = fgc - sg, vz = fb - sb;
                    a = ((cr - sr) * vx + (cg - sg) * vy + (cb - sb) * vz) / (vx * vx + vy * vy + vz * vz);
                    if (a < 0) a = 0; if (a > 1) a = 1;
                }
                if (a <= 0.004) { o.Px[i] = 0; continue; }
                int or = Cl((cr - (1 - a) * sr) / a), og = Cl((cg - (1 - a) * sg) / a), ob = Cl((cb - (1 - a) * sb) / a);
                o.Px[i] = Pack(Cl(a * A(p)), or, og, ob);
            }
        }
        return o;
    }

    public static RImg Crop(RImg im, int x0, int y0, int w, int h) {
        RImg o = new RImg(w, h);
        for (int y = 0; y < h; y++) Array.Copy(im.Px, (y0 + y) * im.W + x0, o.Px, y * w, w);
        return o;
    }

    public static RImg Trim(RImg im, int pad, int thr) {
        int minx = im.W, miny = im.H, maxx = -1, maxy = -1;
        for (int y = 0; y < im.H; y++) {
            for (int x = 0; x < im.W; x++) {
                if (A(im.Px[y * im.W + x]) > thr) {
                    if (x < minx) minx = x; if (x > maxx) maxx = x;
                    if (y < miny) miny = y; if (y > maxy) maxy = y;
                }
            }
        }
        if (maxx < 0) return im;
        minx = Math.Max(0, minx - pad); miny = Math.Max(0, miny - pad);
        maxx = Math.Min(im.W - 1, maxx + pad); maxy = Math.Min(im.H - 1, maxy + pad);
        return Crop(im, minx, miny, maxx - minx + 1, maxy - miny + 1);
    }

    public static RImg PadSquare(RImg im, int pad) {
        int s = Math.Max(im.W, im.H) + 2 * pad;
        RImg o = new RImg(s, s);
        int ox = (s - im.W) / 2, oy = (s - im.H) / 2;
        for (int y = 0; y < im.H; y++) Array.Copy(im.Px, y * im.W, o.Px, (oy + y) * s + ox, im.W);
        return o;
    }

    public static RImg Whiten(RImg im) {
        RImg o = new RImg(im.W, im.H);
        for (int i = 0; i < im.Px.Length; i++) o.Px[i] = Pack(A(im.Px[i]), 255, 255, 255);
        return o;
    }

    // Composite over a solid colour, to inspect halos.
    public static void Preview(RImg im, string path, int br, int bg, int bb) {
        RImg o = new RImg(im.W, im.H);
        for (int i = 0; i < im.Px.Length; i++) {
            int p = im.Px[i]; double a = A(p) / 255.0;
            o.Px[i] = Pack(255, Cl(R(p) * a + br * (1 - a)), Cl(G(p) * a + bg * (1 - a)), Cl(B(p) * a + bb * (1 - a)));
        }
        Save(o, path);
    }

    // Horizontal runs of "non-white" pixels on a row (used to trace the logo symbol).
    public static string Runs(RImg im, int y, int thr) {
        StringBuilder sb = new StringBuilder();
        int start = -1;
        for (int x = 0; x <= im.W; x++) {
            bool on = false;
            if (x < im.W) {
                int p = im.Px[y * im.W + x];
                on = Math.Max(255 - R(p), Math.Max(255 - G(p), 255 - B(p))) > thr;
            }
            if (on && start < 0) start = x;
            if (!on && start >= 0) { sb.AppendFormat("{0}-{1} ", start, x - 1); start = -1; }
        }
        return sb.ToString();
    }
}
