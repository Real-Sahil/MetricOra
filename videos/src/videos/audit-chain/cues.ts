/**
 * The audit trail film as data (docs/marketing/audit-chain-video.md). Seconds, 60 s total.
 * Scenes read these times and nothing else, so a voiceover retime is a change here only.
 */
export const DURATION = 60;

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
