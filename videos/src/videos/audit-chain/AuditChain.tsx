import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, staticFile } from "remotion";

import { useTime, progress } from "../../kit/time";
import { Mark, Wordmark } from "../../ui/Logo";
import { arrive, ease, scene } from "../../ui/motion";
import { C, FONT, MONO } from "../../ui/tokens";
import { CHAIN, CHECK, DURATION, SCENES } from "./cues";

loadFont({ family: "Geist", url: staticFile("fonts/Geist-Variable.woff2"), weight: "100 900" });
loadFont({ family: "Geist Mono", url: staticFile("fonts/GeistMono-Variable.woff2"), weight: "100 900" });

export { DURATION };
export type AuditChainProps = { fps: number; debug?: boolean };

const fill: React.CSSProperties = { position: "absolute", inset: 0, display: "grid", placeItems: "center" };
const headline: React.CSSProperties = { fontFamily: FONT, fontWeight: 600, color: C.onDark, letterSpacing: "-0.02em" };

/** Demo-data note, the only caption under product material (CLAUDE.md, marketing site). */
function DemoNote({ label = "*Demo data" }: { label?: string }) {
  return <div style={{ position: "absolute", left: 64, bottom: 44, fontFamily: FONT, fontSize: 24, color: C.onDark3 }}>{label}</div>;
}

/** Illustrative short hashes. Never real: the diagram is labelled "Illustration". */
const HASH = ["a41f9c", "7be20d", "c93a15", "5d0e77", "e82b3a"];
const BROKEN = ["a41f9c", "7be20d", "0000ff", "3c91b8", "91d4c2"];

function Question({ t }: { t: number }) {
  const s = scene(t, SCENES.question.from, SCENES.question.to);
  if (!s.visible) return null;
  return (
    <div style={{ ...fill, ...s.style }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ ...headline, fontSize: 150, ...arrive(t, 0.4) }}>Last year&apos;s number.</div>
        <div style={{ ...headline, fontSize: 96, color: C.accentLit, marginTop: 36, ...arrive(t, 3.2) }}>Who could have changed it?</div>
      </div>
    </div>
  );
}

const EVENTS = [
  ["Sign-in", "Admin"],
  ["Import committed", "Editor"],
  ["Calculation run", "System"],
  ["Snapshot published", "Admin"],
  ["Report downloaded", "Auditor"],
];

function RecordScene({ t }: { t: number }) {
  const s = scene(t, SCENES.record.from, SCENES.record.to);
  if (!s.visible) return null;
  return (
    <div style={{ ...fill, ...s.style }}>
      <div style={{ width: 1240, background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 36, fontFamily: FONT }}>
        <div style={{ fontSize: 30, fontWeight: 600, color: C.text, marginBottom: 20 }}>Audit trail</div>
        {EVENTS.map(([what, who], i) => (
          <div key={what} style={{ display: "flex", justifyContent: "space-between", fontSize: 28, padding: "18px 0", borderTop: `1px solid ${C.border}`, color: C.text2, ...arrive(t, 8 + i * 0.7, 10) }}>
            <span>{what}</span>
            <span style={{ color: C.muted }}>{who}</span>
          </div>
        ))}
      </div>
      <div style={{ ...headline, position: "absolute", top: 120, fontSize: 80, ...arrive(t, 10.5) }}>Written once. Never updated.</div>
      <DemoNote />
    </div>
  );
}

function Block({ i, hash, prev, bad, x }: { i: number; hash: string; prev: string; bad: boolean; x: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: 400,
        width: 280,
        height: 200,
        borderRadius: 12,
        border: `2px solid ${bad ? C.accentLit : C.onDark3}`,
        background: bad ? "rgba(251,138,75,0.12)" : C.stage2,
        padding: 22,
        fontFamily: MONO,
        fontSize: 26,
        color: C.onDark,
      }}
    >
      <div style={{ color: C.onDark3, fontSize: 22 }}>Entry {i + 1}</div>
      <div style={{ marginTop: 16, color: C.onDark2 }}>prev {prev}</div>
      <div style={{ marginTop: 8, color: bad ? C.accentLit : C.onDark }}>hash {hash}</div>
    </div>
  );
}

function ChainScene({ t }: { t: number }) {
  const s = scene(t, SCENES.chain.from, SCENES.chain.to);
  if (!s.visible) return null;
  const broken = t >= CHAIN.break;
  const hashes = broken ? BROKEN : HASH;
  return (
    <div style={{ ...fill, ...s.style }}>
      <div style={{ ...headline, position: "absolute", top: 150, fontSize: 84, textAlign: "center", width: "100%", ...arrive(t, 18.2) }}>
        {broken ? "Change one row. Everything after it breaks." : "Each entry holds the fingerprint of the one before."}
      </div>
      {hashes.map((h, i) => {
        const x = 110 + i * 340;
        const bad = broken && i >= CHAIN.edited;
        const prev = i === 0 ? "000000" : HASH[i - 1];
        const shown = t >= CHAIN.appear + i * CHAIN.stagger;
        return (
          <div key={i} style={{ opacity: shown ? 1 : 0 }}>
            <Block i={i} hash={h} prev={broken && i === CHAIN.edited + 1 ? HASH[i - 1] : i > 0 ? hashes[i - 1] : prev} bad={bad} x={x} />
            {i > 0 ? (
              <div style={{ position: "absolute", left: x - 60, top: 492, width: 60, height: 4, background: broken && i > CHAIN.edited ? C.accentLit : C.onDark3 }} />
            ) : null}
          </div>
        );
      })}
      <div style={{ position: "absolute", bottom: 44, left: 64, fontFamily: FONT, fontSize: 24, color: C.onDark3 }}>Illustration</div>
    </div>
  );
}

function Result({ at, ok }: { at: number; ok: boolean }) {
  return (
    <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 36, width: 1000, fontFamily: FONT }}>
      <div style={{ display: "inline-block", fontSize: 30, fontWeight: 600, padding: "8px 20px", borderRadius: 999, background: ok ? C.approvedBg : C.amberBg, color: ok ? C.approvedFg : C.amberFg }}>
        {ok ? "Intact" : "Broken"}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 26, color: C.text2, marginTop: 24 }}>
        {ok ? "Head hash 5d0e77...e82b3a" : "First failing entry: 3. Content does not match its hash."}
      </div>
      <div style={{ fontSize: 22, color: C.muted, marginTop: 12 }}>{at === CHECK.broken ? "Altered demo copy" : "Checked every entry in the chain"}</div>
    </div>
  );
}

function CheckScene({ t }: { t: number }) {
  const s = scene(t, SCENES.check.from, SCENES.check.to);
  if (!s.visible) return null;
  const ok = t < CHECK.broken;
  return (
    <div style={{ ...fill, ...s.style }}>
      <div style={{ ...headline, position: "absolute", top: 130, fontSize: 84 }}>Intact. Broken. Empty.</div>
      <div style={{ opacity: ease(t, ok ? CHECK.intact : CHECK.broken, 0.4) }}>
        <Result at={ok ? CHECK.intact : CHECK.broken} ok={ok} />
      </div>
      <DemoNote />
    </div>
  );
}

function OutsideScene({ t }: { t: number }) {
  const s = scene(t, SCENES.outside.from, SCENES.outside.to);
  if (!s.visible) return null;
  const copies = ["The database", "Nightly copy of the latest hash", "Weekly copy of the hashes on GitHub"];
  return (
    <div style={{ ...fill, ...s.style }}>
      <div style={{ ...headline, position: "absolute", top: 110, fontSize: 80 }}>Verify it yourself, offline.</div>
      <div style={{ position: "absolute", left: 120, top: 320, width: 820, background: "#0F1411", border: `1px solid ${C.stage3}`, borderRadius: 12, padding: 32, fontFamily: MONO, fontSize: 26, color: C.onDark2, ...arrive(t, 45) }}>
        <div>$ node verify-audit-log.mjs audit-log.csv ORG_ID</div>
        <div style={{ color: C.onDark, marginTop: 20, opacity: progress(t, 46.2, 0.3) }}>Chain intact. Head hash 5d0e77...e82b3a</div>
      </div>
      <div style={{ position: "absolute", right: 120, top: 320, width: 700, fontFamily: FONT }}>
        {copies.map((c, i) => (
          <div key={c} style={{ fontSize: 34, color: C.onDark, padding: "22px 28px", marginBottom: 16, borderRadius: 12, border: `1px solid ${C.stage3}`, background: C.stage2, ...arrive(t, 48 + i * 0.8) }}>
            {c}
          </div>
        ))}
      </div>
      <DemoNote label="*Demo data. Organisation id replaced." />
    </div>
  );
}

function Close({ t }: { t: number }) {
  const s = scene(t, SCENES.close.from, SCENES.close.to + 0.5, 0.5, 0.01);
  if (!s.visible) return null;
  return (
    <div style={{ ...fill, ...s.style }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 24 }}>
          <Mark t={t} appear={54.2} draw={54.6} size={110} />
          <Wordmark t={t} at={54.8} size={110} />
        </div>
        <div style={{ ...headline, fontSize: 64, marginTop: 56, ...arrive(t, 55.2) }}>Every tonne traced. The trail behind it checkable.</div>
        <div style={{ fontFamily: FONT, fontSize: 40, color: C.accentLit, marginTop: 28, ...arrive(t, 56.2) }}>metricora.co.uk</div>
      </div>
    </div>
  );
}

/**
 * The 60 s audit trail film. Code-built stand-ins for the product screens (scenes 2 and 4)
 * are placeholders: swap them for the demo-tenant recordings from scripts/marketing/record-loops.mjs.
 * Voiceover and captions are added after recording; times live in cues.ts.
 */
export function AuditChain(_props: AuditChainProps) {
  const t = useTime();
  return (
    <AbsoluteFill style={{ background: C.stage, overflow: "hidden" }}>
      <Question t={t} />
      <RecordScene t={t} />
      <ChainScene t={t} />
      <CheckScene t={t} />
      <OutsideScene t={t} />
      <Close t={t} />
    </AbsoluteFill>
  );
}
