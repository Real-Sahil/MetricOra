import { AbsoluteFill, Audio, staticFile } from "remotion";

import { clamp01, progress, useTime } from "../../kit/time";
import { Mark, Wordmark } from "../../ui/Logo";
import { ease } from "../../ui/motion";
import { FONT, MONO } from "../../ui/tokens";
import { fill, mix, P, type as typeStyle } from "./AuditChain";
import { warp } from "./cues";
import voice from "./voice.json";

export const VERTICAL_DURATION = voice.vertical.total;

/** Authored on a 20 s timeline; the voiceover sets the real scene boundaries. */
const VS = voice.vertical.starts;
const OLD = [0, 3.5, 10, 16, 20];
const NEW = [0, VS.v2 - 0.2, VS.v3 - 0.2, VS.v4 - 0.2, VERTICAL_DURATION];
export type AuditChainVerticalProps = { fps: number };

/**
 * LinkedIn cut, 9:16, 20 s, captions burned in (docs/marketing/audit-chain-video.md).
 * Same palette and claims as the main film. Beats: hook (break first), explain, check, close.
 */
const BEATS = {
  hook: { from: 0, to: 3.5 },
  explain: { from: 3.5, to: 10 },
  check: { from: 10, to: 16 },
  close: { from: 16, to: 20 },
};
const CHECK_BROKEN = 12.8;

const GROUNDS: [number, string][] = [
  [0, P.cobalt],
  [10, P.mint],
  [12.8, P.amber],
  [16, P.cream],
];

function groundAt(t: number) {
  let i = 0;
  while (i + 1 < GROUNDS.length && t >= GROUNDS[i + 1][0]) i++;
  const prev = GROUNDS[Math.max(0, i - 1)][1];
  const u = i === 0 ? 1 : clamp01((t - GROUNDS[i][0]) / 0.5);
  return mix(prev, GROUNDS[i][1], u);
}

function Backdrop({ t }: { t: number }) {
  const base = groundAt(t);
  const a = t < 10 ? P.sky : t < 16 ? P.cream : P.amber;
  const b = t < 10 ? P.cobaltDeep : t < 16 ? P.sun : P.sun;
  const d = (k: number, r: number) => Math.sin(t * 0.4 + k) * r;
  return (
    <AbsoluteFill style={{ background: base }}>
      <div style={{ position: "absolute", width: 1400, height: 1400, borderRadius: "50%", left: -500 + d(0, 120), top: -600 + d(1.7, 120), background: `radial-gradient(circle, ${a} 0%, ${a}00 62%)`, opacity: 0.8 }} />
      <div style={{ position: "absolute", width: 1400, height: 1400, borderRadius: "50%", right: -600 + d(3, 120), bottom: -500 + d(4.4, 100), background: `radial-gradient(circle, ${b} 0%, ${b}00 62%)`, opacity: 0.75 }} />
    </AbsoluteFill>
  );
}

/** Burned-in caption, sitting above the platform's bottom UI. */
function Caption({ t, from, to, children, color = P.ink, top = false }: { t: number; from: number; to: number; children: string; color?: string; top?: boolean }) {
  const u = Math.min(ease(t, from, 0.4), 1 - clamp01((t - (to - 0.3)) / 0.3));
  if (u <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, ...(top ? { top: 130 } : { bottom: 300 }), padding: "0 70px", boxSizing: "border-box", textAlign: "center", fontFamily: FONT, fontWeight: 700, fontSize: 62, lineHeight: 1.15, letterSpacing: "-0.02em", color, opacity: u, translate: `0 ${(1 - u) * 30}px` }}>
      {children}
    </div>
  );
}

const HASH = ["a41f9c", "7be20d", "c93a15", "5d0e77", "e82b3a"];
const BROKEN = ["a41f9c", "7be20d", "0000ff", "3c91b8", "91d4c2"];
const EDITED = 2;

/** Five entries stacked, edited at `breakAt`; `start` is when they appear. */
function Stack({ t, start, breakAt, from, to }: { t: number; start: number; breakAt: number; from: number; to: number }) {
  const vis = Math.min(clamp01((t - from) / 0.01), 1 - clamp01((t - (to - 0.25)) / 0.25));
  if (vis <= 0) return null;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: vis }}>
      {HASH.map((_, i) => {
        const appear = start + i * 0.18;
        const u = ease(t, appear, 0.5);
        const failAt = breakAt + (i - EDITED) * 0.25;
        const bad = i >= EDITED && t >= breakAt;
        const hit = bad ? clamp01((t - failAt) / 0.5) : 0;
        const failed = bad && t >= failAt;
        const shake = bad && hit > 0 && hit < 1 ? Math.sin(hit * 40) * 12 * (1 - hit) : 0;
        const hash = (failed ? BROKEN : HASH)[i];
        const prev = i === 0 ? "000000" : (t >= breakAt && i > EDITED && t >= failAt ? BROKEN : HASH)[i - 1];
        const top = 470 + i * 200;
        return (
          <div key={i}>
            {i > 0 && (
              <div style={{ position: "absolute", left: 540 - 4, top: top - 50, width: 8, height: 50, borderRadius: 4, background: failed ? P.coral : P.amber, opacity: u, scale: `1 ${u}`, transformOrigin: "top" }} />
            )}
            <div
              style={{
                position: "absolute",
                left: 100,
                top,
                width: 880,
                height: 150,
                borderRadius: 30,
                background: failed ? P.coral : P.white,
                color: failed ? P.white : P.ink,
                padding: "0 44px",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontFamily: MONO,
                fontWeight: 600,
                fontSize: 32,
                boxShadow: failed ? "0 24px 60px rgba(255,77,61,0.5)" : "0 24px 60px rgba(10,24,110,0.4)",
                opacity: u,
                translate: `${shake}px ${(1 - u) * 90}px`,
              }}
            >
              <span style={{ fontFamily: FONT, fontSize: 34, fontWeight: 700 }}>Entry {i + 1}</span>
              <span style={{ textAlign: "right", lineHeight: 1.3 }}>
                <span style={{ opacity: 0.65 }}>prev {prev}</span>
                <br />
                hash {hash}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CheckCard({ t }: { t: number }) {
  if (t < BEATS.check.from || t >= BEATS.check.to) return null;
  const ok = t < CHECK_BROKEN;
  const at = ok ? BEATS.check.from + 0.2 : CHECK_BROKEN;
  const u = ease(t, at, 0.6);
  const words = ["Intact.", "Broken.", "Empty."];
  const active = ok ? 0 : 1;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", top: 240, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 28 }}>
        {words.map((w, i) => (
          <span key={w} style={{ ...typeStyle, fontSize: 86, color: P.ink, opacity: i === active ? 1 : 0.28, scale: i === active ? "1.06" : "1" }}>{w}</span>
        ))}
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, top: 600, background: P.white, borderRadius: 40, padding: 52, boxSizing: "border-box", fontFamily: FONT, boxShadow: "0 34px 80px rgba(26,15,8,0.22)", opacity: u, translate: `0 ${(1 - u) * 80}px` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <span style={{ width: 96, height: 96, borderRadius: 48, background: ok ? P.mint : P.coral, display: "grid", placeItems: "center" }}>
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
              <path d={ok ? "M5 12.5 L10 17.5 L19 7" : "M6 6 L18 18 M18 6 L6 18"} pathLength={100} strokeDasharray="100 100" strokeDashoffset={100 * (1 - progress(t, at + 0.3, 0.5))} />
            </svg>
          </span>
          <span style={{ fontSize: 72, fontWeight: 700, color: P.ink, letterSpacing: "-0.03em" }}>{ok ? "Intact" : "Broken"}</span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 32, fontWeight: 500, color: P.ink, marginTop: 36, opacity: 0.8, lineHeight: 1.35 }}>
          {ok ? "Head hash 5d0e77...e82b3a" : "First failing entry: 3. Content does not match its hash."}
        </div>
        <div style={{ fontSize: 30, color: P.ink, opacity: 0.5, marginTop: 16 }}>{ok ? "Every entry in the chain checked" : "Altered demo copy"}</div>
      </div>
    </div>
  );
}

function Close({ t }: { t: number }) {
  if (t < BEATS.close.from) return null;
  return (
    <div style={{ ...fill, justifyItems: "center" }}>
      <div style={{ textAlign: "center", marginTop: -160 }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 24 }}>
          <Mark t={t} appear={16.1} draw={16.4} size={110} />
          <Wordmark t={t} at={16.6} size={110} color={P.ink} />
        </div>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 48, color: P.sun, marginTop: 48, opacity: ease(t, 18.2, 0.5) }}>metricora.co.uk</div>
      </div>
    </div>
  );
}

export function AuditChainVertical(_props: AuditChainVerticalProps) {
  const t = warp(useTime(), OLD, NEW);
  const showNote = (t >= 0 && t < 10) || (t >= 10 && t < 16);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Audio src={staticFile("audio/audit-chain/vo-vertical.wav")} />
      <Backdrop t={t} />
      {/* Hook: the break first, on a quick fuse. */}
      <Stack t={t} start={0.2} breakAt={1.7} from={BEATS.hook.from} to={BEATS.hook.to} />
      <Caption t={t} from={0.2} to={3.5} color={P.white} top>Change one row in the record. Watch what happens.</Caption>
      {/* Explain: the same chain, slower. */}
      <Stack t={t} start={3.7} breakAt={7.0} from={BEATS.explain.from} to={BEATS.explain.to} />
      <Caption t={t} from={3.7} to={10} color={P.white} top>Every entry holds the fingerprint of the one before it. Edit one, and everything after stops matching.</Caption>
      {/* Check */}
      <CheckCard t={t} />
      <Caption t={t} from={10.3} to={16} color={P.ink}>One button tells you: intact, broken or empty. If broken, it names the first bad row.</Caption>
      {/* Close */}
      <Close t={t} />
      <Caption t={t} from={16.3} to={20.1} color={P.ink}>Your auditor can check it offline. MetricOra.</Caption>
      {showNote && (
        <div style={{ position: "absolute", left: 70, bottom: 230, fontFamily: FONT, fontWeight: 600, fontSize: 26, color: t < 10 ? P.white : P.ink, opacity: 0.75 }}>
          {t < 10 ? "Illustration" : "*Demo data"}
        </div>
      )}
    </AbsoluteFill>
  );
}
