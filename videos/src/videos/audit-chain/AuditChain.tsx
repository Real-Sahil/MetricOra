import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, Audio, staticFile } from "remotion";

import { clamp01, progress, useTime } from "../../kit/time";
import { Mark, Wordmark } from "../../ui/Logo";
import { arrive, ease, scene } from "../../ui/motion";
import { FONT, MONO } from "../../ui/tokens";
import { CHAIN, CHECK, DURATION, SCENES, WARP_NEW, WARP_OLD, warp } from "./cues";

loadFont({ family: "Geist", url: staticFile("fonts/Geist-Variable.woff2"), weight: "100 900" });
loadFont({ family: "Geist Mono", url: staticFile("fonts/GeistMono-Variable.woff2"), weight: "100 900" });

export { DURATION };
export type AuditChainProps = { fps: number; debug?: boolean };

/**
 * Bright palette: the scope colours from the product (orange, blue, green) pushed to full
 * saturation, with the logo's amber and a warm paper. Text on bright grounds is deep ink.
 */
export const P = {
  sun: "#FF7A2F",
  amber: "#FFC53D",
  cream: "#FFF4E6",
  cobalt: "#2F5BFF",
  cobaltDeep: "#1E3FD1",
  mint: "#19D68A",
  sky: "#8CC8FF",
  coral: "#FF4D3D",
  ink: "#1A0F08",
  white: "#FFFFFF",
} as const;

export const fill: React.CSSProperties = { position: "absolute", inset: 0, display: "grid", placeItems: "center" };
export const type: React.CSSProperties = { fontFamily: FONT, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1 };

/* ---------- colour helpers (time-driven, hex in and out) ---------- */

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mix = (a: string, b: string, u: number) => {
  const [r1, g1, b1] = hex(a);
  const [r2, g2, b2] = hex(b);
  const m = (x: number, y: number) => Math.round(x + (y - x) * u).toString(16).padStart(2, "0");
  return `#${m(r1, r2)}${m(g1, g2)}${m(b1, b2)}`;
};

/** Ground colours per stretch of the film: [from, colour, blobA, blobB]. */
const GROUNDS: [number, string, string, string][] = [
  [0, P.sun, P.amber, P.coral],
  [7, P.cream, P.amber, P.sun],
  [17, P.cobalt, P.sky, P.cobaltDeep],
  [32, P.mint, P.amber, P.sky],
  [38.5, P.amber, P.sun, P.cream],
  [44, P.sky, P.white, P.cobalt],
  [54, P.cream, P.amber, P.sun],
];

function groundAt(t: number) {
  let i = 0;
  while (i + 1 < GROUNDS.length && t >= GROUNDS[i + 1][0]) i++;
  const cur = GROUNDS[i];
  const prev = GROUNDS[Math.max(0, i - 1)];
  const u = i === 0 ? 1 : clamp01((t - cur[0]) / 0.7);
  return [mix(prev[1], cur[1], u), mix(prev[2], cur[2], u), mix(prev[3], cur[3], u)] as const;
}

/** Drifting colour fields behind everything: slow, soft, never still. */
function Backdrop({ t }: { t: number }) {
  const [base, a, b] = groundAt(t);
  const drift = (k: number, r: number) => Math.sin(t * 0.35 + k) * r;
  return (
    <AbsoluteFill style={{ background: base }}>
      <div
        style={{
          position: "absolute",
          width: 1500,
          height: 1500,
          borderRadius: "50%",
          left: -300 + drift(0, 160),
          top: -700 + drift(1.7, 120),
          background: `radial-gradient(circle, ${a} 0%, ${a}00 62%)`,
          opacity: 0.85,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1400,
          height: 1400,
          borderRadius: "50%",
          right: -400 + drift(3, 140),
          bottom: -800 + drift(4.4, 100),
          background: `radial-gradient(circle, ${b} 0%, ${b}00 62%)`,
          opacity: 0.8,
        }}
      />
    </AbsoluteFill>
  );
}

/** Demo-data note, the only caption under product material (CLAUDE.md, marketing site). */
function Note({ children, color = P.ink }: { children: string; color?: string }) {
  return <div style={{ position: "absolute", left: 64, bottom: 44, fontFamily: FONT, fontWeight: 600, fontSize: 24, color, opacity: 0.7 }}>{children}</div>;
}

/** A word that slams in: rises from below a mask line, overshooting slightly. */
export function Slam({ t, at, children, size, color = P.ink, delay = 0 }: { t: number; at: number; children: string; size: number; color?: string; delay?: number }) {
  const words = children.split(" ");
  return (
    <div style={{ ...type, fontSize: size, color, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `0 ${size * 0.22}px` }}>
      {words.map((w, i) => {
        const u = ease(t, at + delay + i * 0.09, 0.55);
        const over = u < 1 ? 0 : Math.sin(clamp01((t - (at + delay + i * 0.09 + 0.55)) / 0.4) * Math.PI) * -6;
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: size * 0.12, marginBottom: -size * 0.12 }}>
            <span style={{ display: "inline-block", translate: `0 ${(1 - u) * size * 1.1 + over}px`, rotate: `${(1 - u) * 6}deg`, opacity: clamp01(u * 2) }}>{w}</span>
          </span>
        );
      })}
    </div>
  );
}

/* ---------- 1. the question ---------- */

function Question({ t }: { t: number }) {
  const s = scene(t, SCENES.question.from, SCENES.question.to);
  if (!s.visible) return null;
  // A tonne figure that spins down to a fixed demo value, then a question mark pulses.
  const pulse = 1 + 0.06 * Math.sin(Math.max(0, t - 4.2) * 5) * clamp01((t - 4.2) / 0.5);
  return (
    <div style={{ ...fill, ...s.style }}>
      <div style={{ textAlign: "center" }}>
        <Slam t={t} at={0.3} size={168} color={P.ink}>Last year&apos;s number.</Slam>
        <div style={{ marginTop: 44, display: "flex", justifyContent: "center", scale: String(pulse) }}>
          <Slam t={t} at={3.0} size={112} color={P.white}>Who could have changed it?</Slam>
        </div>
      </div>
    </div>
  );
}

/* ---------- 2. the record ---------- */

const EVENTS: [string, string, string][] = [
  ["Sign-in", "Admin", P.sun],
  ["Import committed", "Editor", P.cobalt],
  ["Calculation run", "System", P.mint],
  ["Snapshot published", "Admin", P.amber],
  ["Report downloaded", "Auditor", P.coral],
];

function RecordScene({ t }: { t: number }) {
  const s = scene(t, SCENES.record.from, SCENES.record.to);
  if (!s.visible) return null;
  return (
    <div style={{ ...fill, ...s.style }}>
      <div style={{ position: "absolute", top: 110 }}>
        <Slam t={t} at={7.3} size={104}>Written once. Never updated.</Slam>
      </div>
      <div style={{ position: "absolute", top: 330, width: 1320 }}>
        {EVENTS.map(([what, who, colour], i) => {
          const at = 8.3 + i * 0.55;
          const u = ease(t, at, 0.6);
          // Each row stamps a small "locked" bar on its left once it has landed.
          const lock = ease(t, at + 0.5, 0.4);
          return (
            <div
              key={what}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontFamily: FONT,
                fontSize: 38,
                fontWeight: 600,
                color: P.ink,
                background: P.white,
                borderRadius: 22,
                padding: "22px 36px",
                marginBottom: 18,
                boxShadow: "0 18px 40px rgba(26,15,8,0.14)",
                opacity: u,
                translate: `${(1 - u) * 260}px 0`,
                rotate: `${(1 - u) * 3}deg`,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 22 }}>
                <span style={{ width: 16 * lock + 6, height: 44, borderRadius: 8, background: colour }} />
                {what}
              </span>
              <span style={{ fontWeight: 500, opacity: 0.55 }}>{who}</span>
            </div>
          );
        })}
      </div>
      <Note>*Demo data</Note>
    </div>
  );
}

/* ---------- 3. the chain ---------- */

const HASH = ["a41f9c", "7be20d", "c93a15", "5d0e77", "e82b3a"];
const BROKEN = ["a41f9c", "7be20d", "0000ff", "3c91b8", "91d4c2"];
const TILE = 300;
const GAP = 60;
const X0 = (1920 - (5 * TILE + 4 * GAP)) / 2;

function Tile({ i, t }: { i: number; t: number }) {
  const broken = t >= CHAIN.break;
  const bad = broken && i >= CHAIN.edited;
  const appear = CHAIN.appear + i * CHAIN.stagger;
  const u = ease(t, appear, 0.6);
  // The edited tile jolts when it is changed; the ones after it fail in sequence.
  const failAt = CHAIN.break + (i - CHAIN.edited) * 0.28;
  const hit = bad ? clamp01((t - failAt) / 0.5) : 0;
  const shake = bad && hit > 0 && hit < 1 ? Math.sin(hit * 40) * 10 * (1 - hit) : 0;
  const colour = bad && t >= failAt ? P.coral : P.white;
  const fg = bad && t >= failAt ? P.white : P.ink;
  const hash = (broken && t >= failAt ? BROKEN : HASH)[i];
  const prev = i === 0 ? "000000" : (broken && i > CHAIN.edited && t >= failAt ? BROKEN : HASH)[i - 1];
  return (
    <div
      style={{
        position: "absolute",
        left: X0 + i * (TILE + GAP),
        top: 380,
        width: TILE,
        height: 260,
        borderRadius: 30,
        background: colour,
        color: fg,
        padding: 30,
        fontFamily: MONO,
        fontWeight: 600,
        fontSize: 28,
        boxShadow: bad && t >= failAt ? "0 24px 60px rgba(255,77,61,0.55)" : "0 24px 60px rgba(10,24,110,0.4)",
        opacity: u,
        translate: `${shake}px ${(1 - u) * 120}px`,
        rotate: `${(1 - u) * -8 + (bad ? Math.sin(hit * 20) * 2 * (1 - hit) : 0)}deg`,
      }}
    >
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 24, opacity: 0.6 }}>Entry {i + 1}</div>
      <div style={{ marginTop: 30, opacity: 0.7 }}>prev {prev}</div>
      <div style={{ marginTop: 12, fontSize: 34 }}>hash {hash}</div>
    </div>
  );
}

/** The link between two tiles, with a pulse running along it; it snaps red once the break passes. */
function Link({ i, t }: { i: number; t: number }) {
  const appear = CHAIN.appear + i * CHAIN.stagger;
  const u = ease(t, appear, 0.4);
  const failAt = CHAIN.break + (i - CHAIN.edited) * 0.28;
  const bad = t >= CHAIN.break && i >= CHAIN.edited && t >= failAt - 0.1;
  const x = X0 + (i - 1) * (TILE + GAP) + TILE;
  const run = (t * 0.9 + i * 0.3) % 1;
  return (
    <div style={{ position: "absolute", left: x, top: 506, width: GAP, height: 8, borderRadius: 4, background: bad ? P.coral : P.amber, opacity: u, scale: `${u} 1`, transformOrigin: "left" }}>
      {!bad && <div style={{ position: "absolute", left: run * (GAP - 16), top: -4, width: 16, height: 16, borderRadius: 8, background: P.white }} />}
    </div>
  );
}

function ChainScene({ t }: { t: number }) {
  const s = scene(t, SCENES.chain.from, SCENES.chain.to);
  if (!s.visible) return null;
  const broken = t >= CHAIN.break;
  return (
    <div style={{ ...fill, ...s.style }}>
      <div style={{ position: "absolute", top: 120, width: "100%", padding: "0 140px", boxSizing: "border-box", display: "flex", justifyContent: "center" }}>
        {broken ? (
          <Slam t={t} at={CHAIN.break} size={84} color={P.white}>Change one row. Everything after it breaks.</Slam>
        ) : (
          <Slam t={t} at={17.3} size={84} color={P.white}>Each entry holds the fingerprint of the one before.</Slam>
        )}
      </div>
      {HASH.map((_, i) => (i > 0 ? <Link key={`l${i}`} i={i} t={t} /> : null))}
      {HASH.map((_, i) => (
        <Tile key={i} i={i} t={t} />
      ))}
      <Note color={P.white}>Illustration</Note>
    </div>
  );
}

/* ---------- 4. the check ---------- */

function CheckScene({ t }: { t: number }) {
  const s = scene(t, SCENES.check.from, SCENES.check.to);
  if (!s.visible) return null;
  const ok = t < CHECK.broken;
  const at = ok ? CHECK.intact : CHECK.broken;
  const u = ease(t, at, 0.7);
  const words = ["Intact.", "Broken.", "Empty."];
  const active = ok ? 0 : 1;
  return (
    <div style={{ ...fill, ...s.style }}>
      <div style={{ position: "absolute", top: 110, display: "flex", gap: 40 }}>
        {words.map((w, i) => (
          <span key={w} style={{ ...type, fontSize: 112, color: P.ink, opacity: i === active ? 1 : 0.28, scale: i === active ? "1.06" : "1", transition: "none" }}>
            {w}
          </span>
        ))}
      </div>
      <div
        style={{
          width: 1100,
          background: P.white,
          borderRadius: 36,
          padding: 52,
          fontFamily: FONT,
          boxShadow: "0 34px 80px rgba(26,15,8,0.22)",
          opacity: u,
          translate: `0 ${(1 - u) * 90}px`,
          scale: String(0.94 + 0.06 * u),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <span style={{ width: 84, height: 84, borderRadius: 42, background: ok ? P.mint : P.coral, display: "grid", placeItems: "center" }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
              <path d={ok ? "M5 12.5 L10 17.5 L19 7" : "M6 6 L18 18 M18 6 L6 18"} pathLength={100} strokeDasharray="100 100" strokeDashoffset={100 * (1 - progress(t, at + 0.3, 0.5))} />
            </svg>
          </span>
          <span style={{ fontSize: 64, fontWeight: 700, color: P.ink, letterSpacing: "-0.03em" }}>{ok ? "Intact" : "Broken"}</span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 500, color: P.ink, marginTop: 34, opacity: 0.8 }}>
          {ok ? "Head hash 5d0e77...e82b3a" : "First failing entry: 3. Content does not match its hash."}
        </div>
        <div style={{ fontSize: 26, color: P.ink, opacity: 0.5, marginTop: 14 }}>{ok ? "Every entry in the chain checked" : "Altered demo copy"}</div>
      </div>
      <Note>*Demo data</Note>
    </div>
  );
}

/* ---------- 5. outside the database ---------- */

function OutsideScene({ t }: { t: number }) {
  const s = scene(t, SCENES.outside.from, SCENES.outside.to);
  if (!s.visible) return null;
  const copies: [string, string][] = [
    ["Your records", P.cobalt],
    ["Nightly copy of the latest fingerprint, kept apart", P.sun],
    ["Weekly copy of the hashes, kept elsewhere", P.mint],
  ];
  const pack = ease(t, 45, 0.7);
  return (
    <div style={{ ...fill, ...s.style }}>
      <div style={{ position: "absolute", top: 100 }}>
        <Slam t={t} at={44.3} size={100}>Verify it yourself.</Slam>
      </div>
      {/* The assurance pack, with the verifier inside it. */}
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 330,
          width: 620,
          height: 460,
          borderRadius: 40,
          background: P.white,
          padding: 48,
          fontFamily: FONT,
          boxShadow: "0 34px 80px rgba(26,15,8,0.2)",
          opacity: pack,
          translate: `${(1 - pack) * -200}px 0`,
          rotate: `${(1 - pack) * -6}deg`,
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 600, opacity: 0.5, color: P.ink }}>Assurance pack</div>
        <div style={{ fontSize: 56, fontWeight: 700, color: P.ink, letterSpacing: "-0.03em", lineHeight: 1.05, marginTop: 14 }}>Verifier included</div>
        <div style={{ marginTop: 34, fontSize: 30, color: P.ink, opacity: 0.7, lineHeight: 1.35 }}>Runs on your auditor&apos;s own machine. No sign-in. No connection.</div>
        <div style={{ marginTop: 38, display: "inline-flex", alignItems: "center", gap: 14, padding: "12px 26px", borderRadius: 999, background: P.mint, color: P.ink, fontSize: 30, fontWeight: 700, opacity: ease(t, 47, 0.5) }}>
          <span style={{ width: 14, height: 14, borderRadius: 7, background: P.ink }} />
          Chain intact
        </div>
      </div>
      <div style={{ position: "absolute", right: 150, top: 330, width: 900 }}>
        {copies.map(([c, colour], i) => {
          const u = ease(t, 48 + i * 0.7, 0.6);
          return (
            <div key={c} style={{ display: "flex", alignItems: "center", gap: 28, fontFamily: FONT, fontSize: 40, fontWeight: 600, color: P.ink, background: P.white, borderRadius: 28, padding: "30px 38px", marginBottom: 22, boxShadow: "0 20px 50px rgba(26,15,8,0.16)", opacity: u, translate: `${(1 - u) * 240}px 0` }}>
              <span style={{ flex: "none", width: 30, height: 30, borderRadius: 15, background: colour }} />
              {c}
            </div>
          );
        })}
      </div>
      <Note>*Demo data</Note>
    </div>
  );
}

/* ---------- 6. close ---------- */

function Close({ t }: { t: number }) {
  const s = scene(t, SCENES.close.from, SCENES.close.to + 0.5, 0.5, 0.01);
  if (!s.visible) return null;
  return (
    <div style={{ ...fill, ...s.style }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 28 }}>
          <Mark t={t} appear={54.2} draw={54.6} size={130} />
          <Wordmark t={t} at={54.8} size={130} color={P.ink} />
        </div>
        <div style={{ marginTop: 56, display: "flex", justifyContent: "center" }}>
          <Slam t={t} at={55.2} size={72}>Every tonne traced. The trail behind it checkable.</Slam>
        </div>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 44, color: P.sun, marginTop: 34, ...arrive(t, 56.4) }}>metricora.co.uk</div>
      </div>
    </div>
  );
}

/**
 * The 60 s audit trail film, on bright grounds. Code-built stand-ins for the product screens
 * (scenes 2 and 4) are placeholders: swap them for the demo-tenant recordings from
 * scripts/marketing/record-loops.mjs. Voiceover and captions are added after recording; times live in cues.ts.
 */
export function AuditChain(_props: AuditChainProps) {
  const t = warp(useTime(), WARP_OLD, WARP_NEW);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Audio src={staticFile("audio/audit-chain/vo-main.wav")} />
      <Backdrop t={t} />
      <Question t={t} />
      <RecordScene t={t} />
      <ChainScene t={t} />
      <CheckScene t={t} />
      <OutsideScene t={t} />
      <Close t={t} />
    </AbsoluteFill>
  );
}
