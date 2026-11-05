# Design review checklist: signs of slop

Run this against any marketing page or app screen before merging UI work. It is an adaptation of the "signs of slop" list from unslop by Damir Sokolovsky (github.com/heydamir/unslop, licence CC BY 4.0), reworded and trimmed to this repository's design system. Credit stays with the original author in any copy of this file.

The rest of the unslop skill (its nine-pass process, token tables and image-generation advice) is deliberately not adopted. Its advice to generate hero scenes conflicts with the real-product-only rule in `marketing-site.md`.

How to use it: list each sign you find with where it lives, fix them, render again, compare. A page with none gets no changes.

## Surfaces and colour
- Hue-to-hue gradients on surfaces, buttons or active states. Use one neutral from the `--color-mk-*` ramp.
- Gradient text. Use the solid text colour.
- Coloured glows, coloured shadows, radial washes or blurred blobs behind content. Remove.
- Neon borders. Use the hairline (`mk-line`).
- Several near-identical tints for text. Three roles only: text, text-2, text-3.
- More than one accent moment per screen. The ember accent marks the primary action, the selection or the one figure that matters.

## Type
- Weights 700 to 900. Headings stay 400 to 500, with 600 for rare emphasis.
- Uppercase labels with wide tracking. Use sentence case at normal tracking. Table headers and eyebrows included.
- Negative tracking on small text. Tight tracking is for large display text only.
- Mixed number formats on one screen. One format, `tabular-nums` on columns of figures.
- Italic for emphasis.

## Icons and copy
- Emoji as icons or label decoration, sparkle icons for AI. Use the lucide set or nothing.
- Greeting headlines, exclamation marks, hype words (supercharge, seamless, unlock, magic), unverifiable claims ("loved by", "10x faster"). Say what the product does for whom.
- A change figure with no comparison. Say what it compares to.
- Trailing full stops on labels, buttons and headlines.
- Fake-looking data (`$123,456`, `[X]`). Demo figures come from the demo tenant.

## Spacing and layout
- Arbitrary values (`mt-[13px]`). Steps on the 4px scale.
- Rows in one list with different heights or gaps. Uneven padding in sibling cards.
- Everything stacked and centred below a hero. Prefer an asymmetric split or text over a large product view.
- More than one primary and one secondary action in a hero.

## Components and motion
- Glowing pills for counts or status. Quiet mono text or a keycap.
- "New" or "Beta" badges everywhere.
- Rainbow or pill-shaped chart bars, uppercase axis labels, one chart per stat card. One accent per chart, neutral steps for the rest.
- `animate-pulse` or `animate-ping` on anything that is not live, `transition-all`, `hover:scale` on cards, bouncy springs, parallax, animating width, height, top or left.

## Template look
After cleaning, check the page still reads as MetricOra: the product's own nouns in the headline, a real product view, the ember accent. A page that could carry another product's name has fallen back to a template.

## Known, deliberate differences
- Pill buttons and nav (`--radius-button: 999px`) are a brand choice. unslop prefers radius by size.
- Inter body text and Newsreader display headings were chosen by the owner.
