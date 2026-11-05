# Feature triage (November 2026)

Status on 5 November 2026: no paying customers. Outreach is by phone and LinkedIn.

This document sorts everything the product does into four groups so the first customers see one clear job. **Nothing is deleted.** Parked features keep their code, routes, migrations and tests, and come back when a paying customer asks for them.

## The wedge

UK contractors bidding public work need a PPN 006 Carbon Reduction Plan, and their clients increasingly ask for monthly site carbon and waste figures. The first offer is:

1. Collect site evidence (waste tickets, delivery notes, fuel receipts, bills) through upload links and imports, with a review queue.
2. Calculate on DEFRA factors with a full audit trail.
3. Produce the Carbon Reduction Plan, the GHG Protocol report and the monthly project pack.

Everything below is judged against that offer.

## What the deeper look found

- **The app is wider than any one buyer.** The sidebar has about 85 entries across 8 groups. There are 69 org pages, 145 org API folders and 102 folders under `lib/`. A sustainability manager seeing this on a first demo sees a platform to learn, not a problem solved.
- **The trial shows everything.** `PLAN_FEATURES.trial` previews Growth, so a prospect starts on the widest view. For the wedge, the trial should show the wedge.
- **The wedge already exists in pricing.** The Essentials plan (£199 a year, one site, CRP and GHG Protocol reports only) is the right shape. That's a good sign: the narrow product is already built and only needs to be what people see first.
- **The pricing has four paid tiers before one customer.** Essentials, Starter, Growth and Enterprise. Until there are ten customers, a single pilot price is easier to sell and easier to learn from.
- **£199 a year won't pay for the help a first customer needs.** Early customers will need their first CRP built with them. A paid "CRP done with you" setup fee, on top of the plan, fits what they actually need.
- **The simple menu is the right idea.** `SIMPLE_MENU` in `components/org-sidebar.tsx` already groups the app into seven tasks. A focus mode can reuse it.
- **Three `lib/` folders have no callers outside their own tests:** `lib/distributed`, `lib/auditing` and `lib/routing`. They still run in every test pass. Leave them for now; decide when convenient.

## Group 1: Core (show by default)

These are the product. Keep them polished, fast and in the main menu.

| Feature | Where | Why it stays |
|---|---|---|
| Dashboard | `dashboard` | First screen; shows the headline figures. |
| Imports and records | `imports`, `records` | How data gets in. |
| Monthly checklist | `checklist` | Tells the user what is missing this month. |
| Field submissions and upload links | `submissions`, `lib/field-submissions` | Evidence from site without an app install. |
| Fuel | `fuel` | Largest Scope 1 source on site. |
| Waste, carrier checks, monthly project pack | `waste`, `lib/waste` | Clients ask for this monthly. |
| Calculations | `calculations`, `lib/calculation` | The engine. |
| Carbon Reduction Plan | `carbon-reduction-plan`, `lib/crp` | The wedge report. |
| Reports (CRP, GHG Protocol, SECR) | `reports` | Output the buyer pays for. |
| Bid carbon pack | `lib/bids` | Directly supports bidding. |
| Boundary, base year, completeness | `boundary`, `base-year`, `completeness` | A CRP needs a base year and a stated boundary. |
| Targets | `targets` | A CRP needs a net zero commitment. |
| Audit trail and trace a figure | `audit`, `lineage` | Answers "where did this number come from". |
| Settings, members, suppliers | `settings` | Needed to run an account. |

## Group 2: Second wave (show under "More")

Useful to a contractor, but not part of the first conversation. Keep them reachable and maintained. Move one into Core when two design partners use it.

| Feature | Where | Note |
|---|---|---|
| Contracts and tenders (Find a Tender watches) | `contracts`, `tenders` | Strong fit for bidders; second after the CRP lands. |
| Social value (National TOMs) | `social-value` | UK public bids weigh it; already gated to Growth. |
| PAS 2080 | `lib/pas2080` | Infrastructure contractors only. |
| Embodied carbon from delivery notes | `embodied-carbon` | Good differentiator once data flows. |
| Plant and telematics | `plant` | Needs a customer with telematics feeds. |
| Material movements | `material-movements` | Pairs with Doted's soil and aggregate work. |
| KPI report and analytics | `kpis`, `analytics` | Useful once there is a year of data. |
| Site map | `map` | Good demo moment; not a buying reason. |
| Environment permits, incidents, enforcement notices | `environment`, `enforcement-notices` | Site compliance; adjacent to waste. |
| Regulatory calendar | `compliance/deadlines` | Needs quarterly upkeep. |
| Commuting | `commuting` | Scope 3 category; low priority for contractors. |
| Pathway and offsets | `pathway`, `offsets` | Follows targets. |
| Assurance pack and verifier links | `assurance`, `lib/assurance` | Needed when a customer gets verified. |

## Group 3: Parked (hide by default, keep everything)

Hidden from the menu and the trial. Routes, data, migrations and tests stay. Each comes back when a paying customer asks.

| Feature | Where | Why parked |
|---|---|---|
| TCFD, TNFD, materiality, climate disclosure | `tcfd`, `tnfd`, `materiality`, `climate-disclosure` | Large-company reporting; not the first buyer. |
| Transition plan, SBTi roadmap, scenarios | `transition-plan`, `sbti`, `scenarios` | Follows a mature inventory. |
| ESRS E1 gap and framework crosswalk | `compliance/esrs-e1`, `compliance/crosswalk` | CSRD scope; not UK SME contractors. |
| Internal carbon price | `settings` (carbon price), `lib/carbon-price` | Large-company practice. |
| Carbon intelligence (alerts, signals) | `carbon-intelligence` | Needs data volume first. |
| Carbon by account and invoice review | `carbon-by-account`, `finance/invoice-review` | Finance-led buyer; different sale. |
| Accounting integrations (Xero, QuickBooks, Sage) | `integrations/accounting` | Upkeep cost; CSV covers it for now. |
| Supplier performance | `suppliers/performance` | Needs many suppliers' data. |
| Single sign-on | `settings/sso` | Enterprise requirement. |
| Management systems, PQQ | `management-systems`, `lib/pqq` | A separate product (ISO). |
| H&S incidents, method statements | `hs-incidents`, `method-statements` | Safety software is its own market. |
| Biodiversity, ecology scans, water, legal register, aspects | `biodiversity`, `ecology`, `water`, `environment/legal-register`, `environment/aspects` | ISO 14001 and nature reporting; later. |
| Programmes | `programmes` | Multi-project portfolio view; later. |
| Case studies and noticeboard | `case-studies` | Marketing content inside the app. |
| Live dashboard stream | `dashboard/stream` | Already Enterprise-only. |
| Forecasting service, dbt, causal analysis | `services/forecast`, `lib/forecasting`, `lib/causal-inference` | No customer data to model yet. |
| Abu Dhabi export and Arabic pilot | `lib/exports/abu-dhabi-mrv.ts`, `lib/i18n/ui-locale.ts` | Different market. |
| Non-UK factor libraries and regions | `lib/factors`, `lib/compliance/regions.ts` | Keep the data loaded; stop marketing other countries. |
| Native Flutter app | `mobile/` | Keep the code. Upload links cover field capture until a partner needs offline use. |

## Group 4: Foundations (invisible, never cut)

Customers never see these as features, but procurement teams and auditors test them. They are the reason to trust the numbers.

- Calculation engine, unit normalisation, factor selection and immutable calculations (`lib/calculation`).
- Factor libraries and licence attribution (`lib/factors`, `lib/reports/attribution.ts`).
- Published snapshots and the report and dashboard reconciliation test.
- Audit log hash chain and offline verifier (`lib/audit`).
- Multi-tenancy, RBAC, `orgRefsError()` and the cross-tenant tests (`lib/security`, `tests/security`).
- Job dispatch (`lib/jobs/dispatch.ts`), storage, email, billing (`lib/billing`).
- Formatting through `formatters()`, saved views, the form kit and shared table.
- The real-claims rule for marketing and reports.

## Unused code to review later

These are only called by their own tests. They aren't a priority and nothing has to change now.

- `lib/distributed` (computation worker pool)
- `lib/auditing` (data lineage, snapshot assurance)
- `lib/routing` (Valhalla client)

## How to hide without deleting (proposal, not built)

1. Add a module list per organisation: an additive `enabled_modules` column, with Core and Second wave on by default. Pilot organisations can be switched by hand.
2. Filter the sidebar, the quick find palette and the dashboard panels by that list.
3. A parked page opened by URL shows a short message: "This area is switched off for your organisation. Turn it on in Settings, Modules." That follows the "say where to fix it" rule.
4. Change the trial to show Core and Second wave only, not the full Growth view.
5. Leave all API routes working, so data and tests are untouched.

This is one additive migration, a nav filter and a page guard. No feature code changes.

## When to revisit

- When there are 5 design partners: move anything two of them use from Second wave into Core.
- When there are 10 paying customers: review pricing tiers and unpark anything a customer has asked for twice.
- Every quarter: recheck the regulatory calendar and the CPI table, whatever the module state.
