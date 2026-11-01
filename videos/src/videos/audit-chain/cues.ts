/**
 * The audit trail film as data (docs/marketing/audit-chain-video.md). Seconds, 60 s total.
 * Scenes read these times and nothing else, so a voiceover retime is a change here only.
 */
import voice from "./voice.json";

/** Length follows the voiceover (scripts/audit-voiceover.py writes voice.json). */
export const DURATION = voice.main.total;

/**
 * The scenes below are authored on the original 60 s timeline. The voiceover sets how long each
 * takes, so the film plays that timeline through a piecewise-linear warp: OLD scene boundaries
 * map to NEW ones that start each scene 0.3 s before its line is spoken.
 */
const S = voice.main.starts;
export const WARP_OLD = [0, 7, 17, 32, 44, 54, 60];
export const WARP_NEW = [0, S.m2 - 0.3, S.m3 - 0.3, S.m4 - 0.3, S.m5 - 0.3, S.m6 - 0.3, DURATION];

export function warp(t: number, from: number[], to: number[]): number {
  if (t <= to[0]) return from[0];
  for (let i = 1; i < to.length; i++) {
    if (t <= to[i]) return from[i - 1] + ((t - to[i - 1]) / (to[i] - to[i - 1])) * (from[i] - from[i - 1]);
  }
  return from[from.length - 1];
}

export const SCENES = {
  question: { from: 0, to: 7.4 },
  record: { from: 7, to: 17.4 },
  chain: { from: 17, to: 32.4 },
  check: { from: 32, to: 44.4 },
  outside: { from: 44, to: 54.4 },
  close: { from: 54, to: 60 },
} as const;

/** Chain scene: the edited block and when each beat lands. */
export const CHAIN = {
  blocks: 5,
  edited: 2,
  appear: 18.0,
  stagger: 0.35,
  edit: 24.0,
  break: 25.2,
};

/** Check scene: the two takes. */
export const CHECK = { intact: 33.0, broken: 38.5 };
