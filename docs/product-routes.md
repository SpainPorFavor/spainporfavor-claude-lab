# Product Routes (Canonical)

> The funnel branches on visa product. This document is the single source of truth for those branches. **EU Registration and Digital Nomad Visa are never to be conflated**, in code or in copy.
>
> **Code source of truth: `shared/visaRoutes.ts`** (introduced in PR-2). All slug matchers, checklist generators, and case-creation entry points use the resolver and type-guard exported from that module. Do not add new slug heuristics elsewhere.

---

## The Five Products

| Product ID (slug) | Display Name | Server price (cents) | Dependent price (cents) | Timeline | Source |
|---|---|---|---|---|---|
| `eu-registration` | EU Registration Certificate | 34900 | 19900 | 2–3 weeks | `server/products.ts` |
| `digital-nomad-visa` | Digital Nomad Visa (DNV) | 69900 | 39900 | 4–6 weeks | `server/products.ts` |
| `non-lucrative-visa` | Non-Lucrative Visa (NLV) | 64900 | 34900 | 6–8 weeks | `server/products.ts` |
| `student-visa` | Student Visa (Estancia por Estudios) | 54900 | — | 4–6 weeks | `server/products.ts` |
| `work-visa` | Work Visa (Autorización Cuenta Ajena) | 79900 | 44900 | 8–12 weeks | `server/products.ts` |

These slugs are the canonical identifiers. Any new code that branches on visa type must use these exact strings.

---

## The Three Route Configs (current state)

Three product groups have explicit funnel copy, badges, and document checklists. Everything else falls into a generic bucket.

| Route group | Members | Activation copy | Cockpit copy | Intake copy | Checklist |
|---|---|---|---|---|---|
| `eu` | `eu-registration` | `euConfig` in `activationRouteConfig.ts` | `euCockpitConfig` in `portalCockpitConfig.ts` | `EU_REGISTRATION_CONFIG` in `documentIntakeConfig.ts` | `EU_REGISTRATION_CHECKLIST` in `server/documentChecklists.ts` |
| `dnv` | `digital-nomad-visa` | `dnvConfig` in `activationRouteConfig.ts` | `dnvCockpitConfig` in `portalCockpitConfig.ts` | `DNV_CONFIG` in `documentIntakeConfig.ts` | `DNV_CHECKLIST` in `server/documentChecklists.ts` |
| `generic` | `non-lucrative-visa`, `student-visa`, `work-visa`, and any unknown | `genericConfig` | `genericCockpitConfig` | `GENERIC_CONFIG` | NLV / Student / Work checklists (per-product) — but the **fallback in `getChecklistForVisaType` defaults to DNV today, which is a bug**. See §"Known route-mismatch risks". |

---

## EU Registration vs Digital Nomad Visa — Strict Separation

These are the two products whose logic the rebuild must keep apart. Quick reference:

| | EU Registration | Digital Nomad Visa |
|---|---|---|
| Audience | EU citizens registering residence in Spain | Non-EU remote workers moving to Spain |
| Identity doc | Passport **or** EU national ID (front + back) | Passport only |
| Step 3 CTA | "Upload My Passport or EU ID Now" | "Upload My Passport Now" |
| Case ID prefix | `SPF-EU` | `SPF-DNV` |
| Headline | "Payment confirmed — your EU Registration Certificate case is open" | "Payment confirmed — your Digital Nomad Visa case is open" |
| Required documents | passport/EU-ID, proof of address, employment/self-employment/student/sufficient-resources evidence, health insurance/EHIC/S1, fee payment proof, EX-18 form | passport, employment letter, company registration, bank statements, criminal record, health insurance, degree or 3+ yrs experience, passport photo |
| Apostille burden | Low — most docs don't need one | High — criminal record, company registration, degree all need apostille |
| Translation burden | Low | High |
| Goal step | "Appointment-ready / registration completed" | "Application ready / submitted" |
| Blocker cards | padrón, S1/EHIC, EX-18/790, appointment prep | criminal record apostille, health insurance check, employer/client proof, applying-from-Spain-vs-abroad |

**Never** show DNV's "remote work permission" requirement to an EU Registration applicant. **Never** show EU's "EX-18 form" requirement to a DNV applicant.

---

## How Visa Type Flows Through the System Today

```
Home quiz → recommendation.visa (display name like "Digital Nomad Visa (DNV)")
   │
   ▼ VISA_NAME_TO_PRODUCT_ID[label] || "digital-nomad-visa"  ← silent DNV fallback (BUG)
   │
   ▼ /order?product=<productId>
   │
   ▼ createPaymentIntent({ productId, ... }) — server validates against VISA_PRODUCTS map
   │
   ▼ Stripe metadata.product_id = <productId>
   │
   ▼ Webhook → createCaseWithSlots({ visaType: <productId>, ... })
   │
   ▼ getChecklistForVisaType(visaType)  ← unknown visaType silently returns DNV_CHECKLIST (BUG)
   │
   ▼ documentSlots rows
   │
   ▼ Read by:
     - ApplicationSuccess.tsx (via getRouteConfig)
     - DocumentIntake.tsx (via getIntakeRouteConfig + resolveProductType)
     - Portal.tsx (via getCockpitConfig)
```

Today there are **four independent slug matchers** each with its own fallback. The Claude rebuild will consolidate them; until then, every matcher must use the same slug list.

---

## Known Route-Mismatch Risks

1. ~~**`getChecklistForVisaType` defaults to DNV** for unknown visa types.~~ **Closed in PR-2.** The function now takes a `PaidVisaProduct` typed parameter, has an exhaustive switch with no default, and throws at runtime if a caller bypasses types. See `server/documentChecklists.ts`.
2. ~~**`Home.tsx` line ~473** defaults to `"digital-nomad-visa"` when the recommendation label is not in `VISA_NAME_TO_PRODUCT_ID`.~~ **Closed in PR-2.** The handler now blocks navigation and shows a toast error when the recommendation cannot be mapped.
3. ~~**Slug matchers in the four config files use different `slug.includes(...)` heuristics**, so the same `cases.visaType` value can be classified as EU in one place and Generic in another.~~ **Closed in PR-2.** All four matchers (`getRouteConfig`, `getCockpitConfig`, `resolveProductType`, `getIntakeRouteConfig`) now delegate to `resolveRouteGroup()` from `shared/visaRoutes.ts`. No `.includes()` heuristics remain.
4. **`resolveDocumentType` in `documentRequirementConfig.ts` has no case for `employment_evidence`**, the document type used by the EU Registration checklist. EU users see a disabled, unexplained button on the intake page. The fix is to add the missing mappings. _(Out of scope for PR-2 — this is document-type resolution, not visa-route resolution. Tracked for a future PR.)_

---

## Rule for Adding a New Visa Product

Do not add a new product without:

1. A new row in `server/products.ts` (`VISA_PRODUCTS`).
2. A new row in this document.
3. A new checklist in `server/documentChecklists.ts`.
4. An explicit case in every slug matcher (no `includes(...)` shortcuts).
5. A new section in `docs/funnel-map.md` if the funnel steps for that product differ.
6. Activation, cockpit, intake configs added in parallel.

If any of these are missing, the product is not ready to ship.
