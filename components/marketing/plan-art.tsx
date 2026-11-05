import { cn } from "@/lib/utils";

/**
 * Background art for the pricing cards. Each plan draws what it sells: one
 * site, three sites linked, a network whose emissions line falls, and an
 * estate of orbits. Pure SVG animated by CSS (`.plan-art` in globals.css), so
 * no script ships, and it stands still under reduced motion and in print.
 * Decorative only: hidden from assistive technology.
 */
export type PlanArtKind = "essentials" | "starter" | "growth" | "enterprise";

const CX = 160;
const CY = 100;

function Essentials() {
  const ribbons = [0, 20, 40, 60];
  return (
    <>
      {ribbons.map((dy, i) => (
        <path
          key={dy}
          className="flow"
          style={{ animationDuration: `${4 + i * 0.9}s`, opacity: 1 - i * 0.18 }}
          d={`M-10 ${118 + dy} C 40 ${86 + dy}, 90 ${150 + dy}, 150 ${118 + dy} S 260 ${86 + dy}, 330 ${118 + dy}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      ))}
      <circle className="ping" cx="236" cy="104" r="5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="236" cy="104" r="4" fill="currentColor" />
    </>
  );
}

function Starter() {
  const nodes = [
    { x: 64, y: 138 },
    { x: 160, y: 56 },
    { x: 256, y: 138 },
  ];
  const links: [number, number][] = [
    [0, 1],
    [1, 2],
    [0, 2],
  ];
  return (
    <>
      {links.map(([a, b], i) => (
        <line
          key={`${a}-${b}`}
          className="flow"
          style={{ animationDuration: `${3 + i * 0.6}s`, animationDirection: i === 2 ? "reverse" : "normal" }}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      ))}
      {nodes.map((n, i) => (
        <g key={`${n.x}-${n.y}`}>
          <circle className="ping" style={{ animationDelay: `${i * 0.9}s` }} cx={n.x} cy={n.y} r="6" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <circle cx={n.x} cy={n.y} r="5" fill="currentColor" />
        </g>
      ))}
    </>
  );
}

function Growth() {
  const ring = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    return { x: Math.round(CX + Math.cos(a) * 98), y: Math.round(CY + Math.sin(a) * 66) };
  });
  return (
    <>
      {ring.map((n, i) => (
        <line
          key={`spoke-${n.x}-${n.y}`}
          className="flow"
          style={{ animationDuration: `${3.4 + (i % 3) * 0.7}s` }}
          x1={CX}
          y1={CY}
          x2={n.x}
          y2={n.y}
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      ))}
      {ring.map((n, i) => {
        const next = ring[(i + 1) % ring.length];
        return <line key={`rim-${n.x}-${n.y}`} x1={n.x} y1={n.y} x2={next.x} y2={next.y} stroke="currentColor" strokeWidth="1" opacity=".45" />;
      })}
      {ring.map((n, i) => (
        <circle key={`node-${n.x}-${n.y}`} className="blink" style={{ animationDelay: `${i * 0.35}s` }} cx={n.x} cy={n.y} r="3.4" fill="currentColor" />
      ))}
      <circle className="ping" cx={CX} cy={CY} r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx={CX} cy={CY} r="7" fill="currentColor" />
      {/* The line every customer is buying: emissions heading down. */}
      <path
        className="draw"
        d="M14 36 C 80 40, 110 84, 170 104 S 262 150, 308 164"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </>
  );
}

function Enterprise() {
  const orbits = [
    { r: 30, dur: 18, dir: "cw", sats: [0] },
    { r: 54, dur: 28, dir: "ccw", sats: [90, 250] },
    { r: 78, dur: 40, dir: "cw", sats: [40, 160, 290] },
    { r: 102, dur: 56, dir: "ccw", sats: [200] },
  ];
  return (
    <>
      {orbits.map((o) => (
        <g key={o.r} className={o.dir === "cw" ? "spin" : "spin spin-rev"} style={{ animationDuration: `${o.dur}s` }}>
          <circle cx={CX} cy={CY} r={o.r} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 7" opacity=".7" />
          {o.sats.map((deg) => {
            const a = (deg * Math.PI) / 180;
            return <circle key={deg} cx={CX + Math.cos(a) * o.r} cy={CY + Math.sin(a) * o.r} r="3.4" fill="currentColor" />;
          })}
        </g>
      ))}
      <circle className="ping" cx={CX} cy={CY} r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx={CX} cy={CY} r="6" fill="currentColor" />
    </>
  );
}

const ART: Record<PlanArtKind, () => React.JSX.Element> = { essentials: Essentials, starter: Starter, growth: Growth, enterprise: Enterprise };

export function PlanArt({ kind, tone = "light", className }: { kind: PlanArtKind; tone?: "light" | "dark"; className?: string }) {
  const Art = ART[kind];
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMin slice"
      className={cn(
        "plan-art pointer-events-none absolute inset-x-0 top-0 h-52 w-full [mask-image:linear-gradient(to_bottom,#000_35%,transparent)]",
        tone === "dark" ? "text-mk-accent-lit opacity-60" : "text-mk-accent opacity-[.38]",
        className,
      )}
    >
      <Art />
    </svg>
  );
}
