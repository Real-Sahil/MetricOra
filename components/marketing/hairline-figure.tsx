"use client";

// Hairline line figures (MIT, @lucasmarkes/hairline). Loaded after the page shell so the library
// stays out of the first paint; the server renders an empty 5:4 box, so nothing shifts.
import dynamic from "next/dynamic";
import type { CSSProperties } from "react";

const Box = () => <div aria-hidden="true" className="aspect-[5/4] w-full" />;

const Exploded = dynamic(() => import("@lucasmarkes/hairline/react").then((m) => m.Exploded), { ssr: false, loading: Box });
const Branches = dynamic(() => import("@lucasmarkes/hairline/react").then((m) => m.Branches), { ssr: false, loading: Box });
const Vault = dynamic(() => import("@lucasmarkes/hairline/react").then((m) => m.Vault), { ssr: false, loading: Box });
const Terrain = dynamic(() => import("@lucasmarkes/hairline/react").then((m) => m.Terrain), { ssr: false, loading: Box });
const Rail = dynamic(() => import("@lucasmarkes/hairline/react").then((m) => m.Rail), { ssr: false, loading: Box });
const Plot = dynamic(() => import("@lucasmarkes/hairline/react").then((m) => m.Plot), { ssr: false, loading: Box });

// The plate is filled, so it must be the colour the figure sits on.
function plate(color: string): CSSProperties {
  return { ["--hairline-plate" as string]: color };
}

type Base = { label: string; plateColor?: string; className?: string };

/** Marketing pages are light only, so the figure is pinned to the light theme. */
export function ExplodedFigure({ label, plateColor = "#F9FAFC", className }: Base) {
  return <Exploded theme="light" label={label} style={plate(plateColor)} className={className} />;
}

export function BranchesFigure({ label, plateColor = "#FFFFFF", className }: Base) {
  return <Branches theme="light" label={label} style={plate(plateColor)} className={className} />;
}

/** In-app empty state: follows the app theme, on the card surface. */
export function PlotFigure({ label, className }: Omit<Base, "plateColor">) {
  return <Plot label={label} style={plate("var(--surface, #fff)")} className={className} />;
}

export function VaultFigure({ label, plateColor = "#FFFFFF", className }: Base) {
  return <Vault theme="light" label={label} style={plate(plateColor)} className={className} />;
}

export function TerrainFigure({ label, className }: Omit<Base, "plateColor">) {
  return <Terrain label={label} style={plate("var(--surface, #fff)")} className={className} />;
}

export function RailFigure({ label, className }: Omit<Base, "plateColor">) {
  return <Rail label={label} style={plate("var(--surface, #fff)")} className={className} />;
}
