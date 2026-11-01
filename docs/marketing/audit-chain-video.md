# Audit trail film: script and storyboard

Working title: "Can anyone quietly change the record?"

Used on: the Security page, the Product page (assurance section) and LinkedIn. Source of every claim is in the code and `docs/dev/features/management-and-assurance.md`. Anything not listed under "Claims and where they come from" must not be added to the voiceover or on-screen text.

Footage: the demo tenant (Northgate Civils Ltd, fictional). Every frame that shows product UI carries the `*Demo data` note. No customer names, no invented figures, no claim of legal or regulatory compliance.

## Cuts

| Cut | Length | Ratio | Where |
|---|---|---|---|
| Main film | 60 s | 16:9 | Security page, Product page |
| LinkedIn cut | 20 s | 9:16 and 1:1 | LinkedIn post, captions burned in |
| Loop | 8 s | 16:9, no sound | Hairline section background on the Security page (scene 4 only) |

## Voiceover script (main film, 60 s, about 150 words)

Written to be read at a calm pace, UK English, no music under the key line in scene 3.

**1. The question (0:00 to 0:07)**
"Somebody asks you to prove a number from last year. Not the number. How you know nobody changed it since."

**2. The record (0:07 to 0:17)**
"Every sign-in, import, record edit, calculation run and publication is written to an audit trail. Once written, it is never updated. Never deleted."

**3. The chain (0:17 to 0:32)**
"Each entry carries a fingerprint of the entry before it. Change one row, and the fingerprint of every row after it stops matching. A gap or an edit shows."

**4. The check (0:32 to 0:44)**
"Press Check the audit trail. MetricOra reads the whole chain and tells you one of three things: intact, broken, or empty. If broken, it names the first row that fails, and why."

**5. Outside the database (0:44 to 0:54)**
"Every assurance pack carries a small verifier script. Your auditor can run it on their own machine, on the exported log. And each night a copy of the latest fingerprint is stored away from the rows it protects, with a weekly copy of the hashes kept on GitHub."

**6. Close (0:54 to 1:00)**
"Every tonne traced. And the trail behind it checkable. MetricOra."

## Storyboard (main film)

| # | Time | Visual | On-screen text | Motion and notes |
|---|---|---|---|---|
| 1 | 0:00 to 0:07 | Dark ink background (#131D29). A single number from the demo dashboard (use the real published total shown in the demo tenant) fades in at centre, accent #C2400C underline. | "Last year's number." then "Who could have changed it?" | Slow push in on the number, then a soft question mark of hairline lines. Type in the marketing sans, no serif. |
| 2 | 0:07 to 0:17 | Screen recording: Audit trail page listing events (sign-in, import, calculation run, publish). Rows scroll gently. | "Written once. Never updated." | Highlight row types one by one with a thin accent outline. `*Demo data` bottom-left. |
| 3 | 0:17 to 0:32 | Diagram, built in code: five blocks in a row, each showing a short hash and an arrow from the one before. On the key line, the third block turns accent-red and the fourth and fifth blocks' hashes visibly stop matching. | "Each entry holds the fingerprint of the one before." then "Change one row. Everything after it breaks." | This is the hero scene. Hairline `Stack` or similar line-art feel for the blocks. Music drops out for the key line. Hash strings are illustrative; label the diagram "Illustration". |
| 4 | 0:32 to 0:44 | Screen recording: Audit trail, click "Check the audit trail". Result panel shows Intact with the head hash. Cut to a second take of a broken result naming the first failing row (record this on a deliberately altered copy of the demo database, never production). | "Intact. Broken. Empty." | The broken take must be produced on a throwaway local database and captioned "Altered demo copy". `*Demo data`. |
| 5 | 0:44 to 0:54 | Split: left, a terminal showing `node verify-audit-log.mjs audit-log.csv <organisationId>` and its result; right, a simple diagram of three copies (database, nightly stored head, weekly GitHub hashes). | "Verify it yourself, offline." "Copies kept away from the rows." | Real terminal capture of the shipped script run on a demo export. Keep the organisation id obviously fake. |
| 6 | 0:54 to 1:00 | Paper background (#F9FAFC). MetricOra mark, one line, one button style. | "Every tonne traced. The trail behind it checkable." then metricora.co.uk | Hold two seconds. No App Store badge until approved. |

## LinkedIn cut (20 s, vertical)

Burned-in captions, because most views are muted. Hook in the first 2 seconds, no logo intro.

| Time | Visual | Caption (also the voiceover) |
|---|---|---|
| 0:00 to 0:03 | Scene 3's broken chain, close crop. | "Change one row in the record. Watch what happens." |
| 0:03 to 0:10 | Chain animation, hashes failing in sequence. | "Every entry holds the fingerprint of the one before it. Edit one, and everything after stops matching." |
| 0:10 to 0:16 | The Intact result, then the Broken result naming the failing row. | "One button tells you: intact, broken or empty. If broken, it names the first bad row." |
| 0:16 to 0:20 | End card on paper background. | "Your auditor can check it offline. MetricOra." |

### LinkedIn post copy (UK English, goes beside the video)

Most audit trails are a list. Fine until someone asks you to prove nobody edited it.

We built ours as a chain. Every entry carries a fingerprint of the one before, so change one row and everything after it stops matching. One button checks the whole thing and tells you if it's intact, and if it isn't, which row failed first.

The part I care about more: your auditor doesn't have to take our word for it. Every assurance pack ships with a small script they can run on their own machine against the exported log.

It isn't magic. If someone removed the very newest entries, a chain on its own would still look fine. So we store a copy of the latest fingerprint away from the rows, nightly, and keep a weekly copy of the hashes on GitHub.

Evidence you can check beats evidence you're asked to trust.

www.metricora.co.uk

## Claims and where they come from

| Claim in the film | Source |
|---|---|
| Sign-ins, role changes, imports, record edits, calculation runs, publications, report downloads and reviews are recorded | `CLAUDE.md` Audit Log section; Security page controls copy |
| Entries are append-only, never updated or deleted | `writeAuditLog()` in `lib/db/audit.ts` |
| Each entry hashes the one before it | `lib/audit/chain.ts` (sha256 over a JSON array including the previous hash) |
| Check result is intact, broken or empty; broken names the first bad sequence and why | `verifyAuditChain()`; `GET /api/orgs/{orgId}/audit-chain` |
| Verifier script ships in every assurance pack, zero dependencies | `lib/audit/verify-script.ts`; command `node verify-audit-log.mjs audit-log.csv <organisationId>` |
| Nightly copy of the head stored away from the rows | `lib/audit/anchor.ts` (only on the `supabase` and `r2` storage drivers, which production uses) |
| Weekly copy of the hashes on GitHub | `lib/audit/github-anchor.ts`, `.github/workflows/audit-anchor.yml` |

## Do not say

1. That the trail "cannot be tampered with". The docs state the limit: anyone holding the storage service role key can rewrite a stored anchor, so this raises the bar and is not an independent third party.
2. That it makes anyone "compliant", "certified" or "audit-proof".
3. That rows older than the chain's v2 format are verified. Older rows are reported as legacy, and rows past the six-year retention are redacted and counted as such.
4. Any customer count, testimonial or comparison with another product.

## Open items before production

1. Capture the footage: run `scripts/marketing/record-loops.mjs` for the audit trail and check flow; capture the verifier script in a terminal on a demo export.
2. Record the "Broken" take on a throwaway local database with one edited row.
3. Voiceover: record or generate, then run faster-whisper for the caption file.
4. Build: the main film as a new Remotion composition under `videos/src/videos/audit-chain/`; the vertical cut and the loop as HyperFrames or Remotion, whichever renders the chain diagram more cleanly.
5. Confirm with the owner: the final tagline in scene 6, and whether the GitHub copy should be named on camera.
