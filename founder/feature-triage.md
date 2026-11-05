# Feature triage (November 2026)

Status on 5 November 2026: no paying customers. Outreach is by phone and LinkedIn.

This document sorts everything the product does so the first customers see one clear job. **Nothing is deleted.** Parked features keep their code, routes, data, migrations and tests, and come back when a paying customer asks for them.

## The wedge

UK contractors bidding public work need a PPN 006 Carbon Reduction Plan, and their clients increasingly ask for monthly site carbon and waste figures. The first offer is:

1. Collect site evidence (waste tickets, delivery notes, fuel receipts, bills) through upload links and imports, with a review queue.
2. Calculate on DEFRA factors with a full audit trail.
3. Produce the Carbon Reduction Plan, the GHG Protocol report and the monthly project pack.

Everything below is judged against that offer.

## The product in numbers

| Measure | Count |
|---|---|
| Org pages (top-level areas) | 69 |
| Sidebar entries | about 85, in 8 groups |
| API route files | 511 |
| Database models | 245 |
| Migrations | 255 |
| Test files | 589 |
| `lib/` folders | 102 |
| Runtime dependencies | 90 |
| Scheduled database jobs (pg_cron) | 18 |
| GitHub workflows (5 on a schedule) | 15 |

For comparison, a focused product with a CRP and a monthly site pack would need roughly a fifth of this. The code quality is not the issue: there is only one real TODO in the whole app (`app/api/auth/sign-up/supplier/route.ts:89`), and the test count is high. The issue is width.

## Where the effort went

Lines of code per area (pages, API routes and the area's `lib/` folder, tests excluded). Top 20:

| Area | Lines | Group |
|---|---|---|
| Reports | 12,478 | Core |
| Settings | 9,955 | Core |
| Management systems | 7,930 | Decision needed |
| Compliance (calendar, ESRS, crosswalk, assurance readiness) | 5,922 | Mixed |
| Contracts | 5,664 | Second wave |
| Integrations | 5,048 | Parked |
| Imports | 4,669 | Core |
| Social value | 4,531 | Second wave |
| Suppliers | 3,991 | Second wave |
| Waste | 3,810 | Core |
| Assurance | 3,198 | Second wave |
| Records | 3,146 | Core |
| Environment | 3,071 | Second wave |
| Analytics | 2,772 | Second wave |
| Submissions | 2,716 | Core |
| Biodiversity | 2,402 | Parked |
| Pilot kit | 2,249 | Core (sales tool) |
| Dashboard | 2,117 | Core |
| Audit | 2,027 | Core |
| Carbon intelligence | 1,809 | Parked |

What this shows:

- **Management systems is the third-largest area**, bigger than waste, imports or the CRP. More effort went into ISO registers than into the wedge report.
- **The Carbon Reduction Plan area is 1,069 lines** (plus `lib/crp`). The thing a contractor buys is one of the smaller parts of the product.
- **Parked areas add up.** Integrations, biodiversity, carbon intelligence, method statements, ecology, TCFD, TNFD, materiality, SBTi and scenarios total about 17,000 lines.
- **Some sizeable areas have little or no testing.** Carbon intelligence (1,809 lines), method statements (1,562), ecology (1,539), TNFD, H&S incidents and enforcement notices have no tests that name them. That's another reason to park rather than show them to a prospect.

## Findings

### 1. The first screen doesn't lead with the wedge

- Onboarding has five steps: organisation settings, **invite a member**, reporting period, import data, run a calculation. A sustainability manager trying it alone is asked to invite a colleague before seeing any value.
- The guided CRP wizard exists and is good: nine steps from period to "check and generate", and it says what is missing. But on onboarding it's a side box ("Bidding for public contracts?"), not the main path.
- **Change:** make "Start your Carbon Reduction Plan" the first step, and make inviting a member optional.

### 2. The trial shows everything

`PLAN_FEATURES.trial` previews Growth, so a prospect lands in the widest view, with about 85 menu entries. The trial should show Core and Second wave only.

### 3. Pricing and the wedge disagree

- **The bid carbon pack is Growth-only (£299 a month)**, yet it's one of the most direct bid tools. A contractor on Essentials or Starter can't use it.
- **Starter sells "one management system framework, such as ISO 14001"**, and the plan comparison lists ISO 14001, 45001 and 9001 and Xero sync. Hiding those areas would break what the pricing page promises, and the real-claims rule says marketing states only what the product delivers. Any area hidden from a paid plan must come off that plan's list first.
- **Four paid tiers before one customer.** One pilot price is easier to sell and to learn from until there are about 10 customers.
- **Essentials at £199 a year is the right shape and too thin in price.** First customers will need their CRP built with them. A paid "CRP done with you" setup fee fits what they actually need.

### 4. Management systems: a decision, not a park

On product grounds alone I'd park ISO management systems: it's a separate market with established tools. But there are two reasons not to decide that in a document:

- The founder is a qualified lead auditor for ISO 45001, 14001 and 9001. That's founder-market fit few carbon tools have.
- Black Rock's construction and FM clients already deal with ISO certification, so this may be the warmer door.

The honest test is which one the first 20 conversations ask about. If prospects ask about ISO before carbon, the wedge should be "ISO registers plus carbon", not "carbon plus everything". Until then, keep management systems in Second wave, where Starter's promise still holds.

### 5. Upkeep is already high for a team with no revenue

- **18 scheduled database jobs** and 10 monitors run whether anyone uses the feature or not. They include tenders, management systems, carbon budgets, waste documents and subcontractor reminders.
- **15 GitHub workflows**, 5 on a schedule (audit anchor, backup, data upkeep, security scan, uptime).
- **Data that ages:** DEFRA factors yearly, CPI tables yearly, the regulatory calendar quarterly, factor libraries for five countries.
- **Change:** keep backup, uptime, security scan, audit anchor and DEFRA upkeep. Let monitors for parked areas skip organisations that don't have the area switched on.

### 6. Marketing is mostly on target

The homepage already speaks to UK contractors ("Built around how UK contractors work", "The three documents most contractors need", "Bring one site and one year of data"). The remaining drift:

- The homepage lists ESRS E1, GRI 305, IFRS S2 and CDP. That widens the message without helping a contractor buy.
- Solutions pages exist for construction, the public sector and waste haulage. Three audiences is two too many before the first sale.

### 7. Unused code

These folders are only called by their own tests. They still run in every test pass. Leave them; decide when convenient.

- `lib/distributed` (computation worker pool)
- `lib/auditing` (data lineage, snapshot assurance)
- `lib/routing` (Valhalla client)

## Group 1: Core (show by default)

| Feature | Where | Why it stays |
|---|---|---|
| Carbon Reduction Plan wizard | `carbon-reduction-plan`, `lib/crp` | The wedge. Make it the first step. |
| Dashboard | `dashboard` | First screen after setup. |
| Imports and records | `imports`, `records` | How data gets in. |
| Monthly checklist | `checklist` | Tells the user what's missing this month. |
| Field submissions and upload links | `submissions`, `lib/field-submissions` | Site evidence without an app install. |
| Fuel | `fuel` | Largest Scope 1 source on site. |
| Waste, carrier checks, monthly project pack | `waste`, `lib/waste` | Clients ask for this monthly. |
| Calculations and snapshots | `calculations`, `snapshots`, `lib/calculation` | The engine and the published figures. |
| Reports (CRP, GHG Protocol, SECR) | `reports` | What the buyer pays for. |
| Bid carbon pack | `lib/bids` | Directly supports bidding. Should not be Growth-only. |
| Boundary, base year, completeness | `boundary`, `base-year`, `completeness` | A CRP needs a base year and a stated boundary. |
| Targets | `targets` | A CRP needs a net zero commitment. |
| Audit trail and trace a figure | `audit`, `lineage` | Answers "where did this number come from". |
| Data quality and duplicate checks | `data-quality`, `anomalies` | Protects the figures before a report. |
| Pilot kit | `pilot` | The sales tool for design partners. |
| Settings, members, suppliers | `settings` | Needed to run an account. |

## Group 2: Second wave (show under "More")

Useful to a contractor, but not part of the first conversation. Keep them reachable and maintained. Move one into Core when two design partners use it.

| Feature | Where | Note |
|---|---|---|
| Management systems and PQQ | `management-systems`, `lib/pqq` | Decision needed (finding 4). Sold on Starter, so stays visible. |
| Contracts and tenders (Find a Tender watches) | `contracts`, `tenders` | Strong fit for bidders; second after the CRP lands. |
| Social value (National TOMs) | `social-value` | UK public bids weigh it; already Growth-only. |
| PAS 2080 | `lib/pas2080` | Infrastructure contractors only. |
| Embodied carbon from delivery notes | `embodied-carbon` | Good differentiator once data flows. |
| Plant and telematics | `plant` | Needs a customer with telematics feeds. |
| Material movements | `material-movements` | Pairs with Doted's soil and aggregate work. |
| Supplier portal and supplier reports | `suppliers`, `supplier-reports` | Scope 3 requests to subcontractors. |
| KPI report and analytics | `kpis`, `analytics` | Useful once there's a year of data. |
| Site map | `map` | Good demo moment; not a buying reason. |
| Environment permits, incidents, enforcement notices | `environment`, `environmental-permits`, `environmental-incidents`, `enforcement-notices` | Site compliance; next to waste. |
| Regulatory calendar | `compliance/deadlines` | Needs quarterly upkeep. |
| Assurance pack, readiness and engagements | `assurance`, `assurance-engagements`, `compliance/assurance-readiness` | Needed when a customer gets verified. |
| Commuting | `commuting` | Scope 3 category; low priority for contractors. |
| Pathway and offsets | `pathway`, `offsets` | Follows targets. |
| Tasks | `tasks` | Supports review work. |

## Group 3: Parked (hide by default, keep everything)

Hidden from the menu and the trial. Routes, data, migrations and tests stay. Each comes back when a paying customer asks. Before parking anything a paid plan lists, take it off the pricing page.

| Feature | Where | Lines | Why parked |
|---|---|---|---|
| Accounting and other integrations (Xero, QuickBooks, Sage, Zapier) | `integrations` | 5,048 | Upkeep cost; CSV covers it for now. Remove "Xero sync" from Growth's list first. |
| Biodiversity, ecology scans, water, legal register, aspects | `biodiversity`, `biodiversity-assessments`, `ecology`, `water`, `environment/legal-register`, `environment/aspects` | about 5,000 | ISO 14001 and nature reporting. Unpark together with management systems if that wins. |
| Carbon intelligence (alerts, signals) | `carbon-intelligence` | 1,809 | Needs data volume first; untested. |
| H&S incidents and method statements | `hs-incidents`, `hs-incident-reports`, `method-statements` | about 2,950 | Safety software is its own market; mostly untested. |
| TCFD, TNFD, materiality, climate disclosure | `tcfd`, `tnfd`, `materiality`, `climate-disclosure` | about 3,440 | Large-company reporting. |
| Transition plan, SBTi roadmap, scenarios | `transition-plan`, `sbti`, `scenarios` | about 2,550 | Follows a mature inventory. |
| ESRS E1 gap and framework crosswalk | `compliance/esrs-e1`, `compliance/crosswalk` | part of compliance | CSRD scope; not UK SME contractors. |
| Carbon by account and invoice review | `carbon-by-account`, `finance` | about 1,040 | Finance-led buyer; different sale. |
| Automation | `automation` | 666 | No customer workflows to automate yet; untested. |
| Programmes | `programmes` | 357 | Portfolio view; later. |
| Case studies and noticeboard | `case-studies` | 482 | Marketing content inside the app. |
| Internal carbon price | `lib/carbon-price` | small | Large-company practice. |
| Single sign-on | `settings/sso` | small | Enterprise requirement. |
| Live dashboard stream | `dashboard/stream` | small | Already Enterprise-only. |
| Forecasting service, dbt, causal analysis | `services/forecast`, `lib/forecasting`, `lib/causal-inference` | | No customer data to model yet. |
| Abu Dhabi export and Arabic pilot | `lib/exports/abu-dhabi-mrv.ts`, `lib/i18n/ui-locale.ts` | | Different market. |
| Non-UK factor libraries and regions | `lib/factors`, `lib/compliance/regions.ts` | | Keep the data loaded; stop marketing other countries. |
| Native Flutter app | `mobile/` | | Keep the code. Upload links cover field capture until a partner needs offline use. |

## Group 4: Foundations (invisible, never cut)

Customers never see these as features, but procurement teams and auditors test them. They're the reason to trust the numbers.

- Calculation engine, unit normalisation, factor selection and immutable calculations (`lib/calculation`).
- Factor libraries and licence attribution (`lib/factors`, `lib/reports/attribution.ts`).
- Published snapshots and the report and dashboard reconciliation test.
- Audit log hash chain and offline verifier (`lib/audit`).
- Multi-tenancy, RBAC, `orgRefsError()` and the cross-tenant tests (`lib/security`, `tests/security`).
- Job dispatch (`lib/jobs/dispatch.ts`), storage, email, billing (`lib/billing`).
- Formatting through `formatters()`, saved views, the form kit and the shared table.
- Backups, uptime checks, security scans and the weekly audit anchor.
- The real-claims rule for marketing and reports.

## Changes in priority order

None of these deletes a feature.

1. **Onboarding:** CRP wizard first; inviting a member optional.
2. **Trial:** show Core and Second wave, not the full Growth view.
3. **Pricing:** move the bid carbon pack down to Starter (or into pilots); take parked items off the plan lists; offer one pilot price with a "CRP done with you" setup fee.
4. **Focus mode:** a per-organisation list of switched-on areas (one additive migration), used to filter the sidebar, quick find and dashboard panels. A parked page opened by URL shows: "This area is switched off for your organisation. Turn it on in Settings, Modules." API routes stay working. **Done (menu, quick find, page notice, Settings, Modules); dashboard panels not yet filtered.**
5. **Monitors:** skip organisations that don't have the area switched on. Done: permit expiry, enforcement notices, tenders, carbon budgets and management system reminders skip organisations that switched their area off; Core monitors always run.
6. **Marketing:** trim the homepage framework list to SECR, PPN 006 and GHG Protocol; lead with the construction solutions page. Done on the homepage (framework list, compliance heading, "Built first for UK main contractors"); the product page keeps its full list.
7. **Later:** review the three unused `lib/` folders, and add tests to any parked area before it's unparked.

## When to revisit

- **After 20 discovery calls:** settle the management systems question (finding 4).
- **At 5 design partners:** move anything two of them use from Second wave into Core.
- **At 10 paying customers:** review the pricing tiers and unpark anything a customer has asked for twice.
- **Every quarter:** recheck the regulatory calendar and the CPI table, whatever the module state.
