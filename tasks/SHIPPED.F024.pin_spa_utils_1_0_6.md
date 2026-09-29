# F024 – Pin `@mentor-forge/mentorhub_spa_utils@1.0.6` (CardGrid removal, DataCardGrid, MarkdownEditor)

**Status**: Shipped  
**Type**: Feature  
**Depends On**: _(none — first task in this wave)_  
**Description**: This repo owns the Admin SPA **1.0.6 pin**. Bump `@mentor-forge/mentorhub_spa_utils` from exact `1.0.5` to exact **`1.0.6`**, refresh the lockfile from CodeArtifact, and align this SPA with the shipped 1.0.6 card and markdown contract. Package `CardGrid` is removed. Do not reintroduce list card dashboards. Do not add `marked` or `dompurify`. Cypress and packaging are **F025**.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — exact semver pins for shared packages; CodeArtifact (`mh` then `npm install`)
- `../mentorhub_spa_utils/README.md` — install pin **1.0.6**; **MhCard / DataCard / DataCardGrid**; **Type-aligned editors** (`markdown` / `MarkdownEditor`). Shared list `CardGrid` left the package in 1.0.6. List card dashboards belong to Discovery. `DataCardGrid` is a no-prop CSS Grid slot wrapper (`class="data-card-grid"`, hardcoded `data-automation-id="data-card-grid"`): 1 column below 641px, 2 from 641px, 4 from 1920px, 16px gap. It is not a Fragment flattener. `MarkdownEditor` props are unchanged (`field`, `modelValue`, `onSave`, `editable`, `visible`, `automationId`, `label`, `hint`, `rules`, `rows`). Resting view is sanitized GFM HTML (`marked` + `dompurify` bundled in spa_utils). Editable fields enter the textarea on click or Enter. Automation ids: root `automationId`, textarea `${automationId}-input`, display `${automationId}-display`, value `markdown-field-display`. Package-root import pulls component CSS.
- `README.md` — currently documents spa_utils **1.0.5** (ownership table, PageFrame, Token tab, Testing, Automation Support)
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `package.json` / `package-lock.json` — currently `"@mentor-forge/mentorhub_spa_utils": "1.0.5"`; no `marked` or `dompurify`
- `src/App.vue` — `PageFrame` with `page-title="Admin"` only plus `provideEditorConfig` (keep; do not add `navItems`, ALB URLs, or role tables)
- `src/pages/AdminPage.vue` — already imports `{ AdminPage }` from spa_utils and passes `GET /admin/api/config` (do not fork Token / Config / Versions / Enumerators locally)
- `src/pages/SettingsPage.vue` — Products / Discounts **tables** via `SettingsTableEditor`. Description columns are `SentenceEditor`, not markdown. Do not convert this page into cards.
- `src/pages/LogsPage.vue` — read-only external-event table. Not a card dashboard.
- `src/components/SettingsTableEditor.vue` — standalone spa_utils `SentenceEditor` / `WordEditor` / `CountEditor` / `DateTimeEditor` (`modelValue` + `onSave`). Do not wrap rows in `DataCard`.
- `src/components/settingsTable.ts` — editor union is `'sentence' | 'word' | 'count' | 'dateTime'`
- `src/main.ts` — no spa_utils stylesheet import; root imports in other modules already pull package CSS for Vite
- `vitest.config.ts` — inlines `@mentor-forge/mentorhub_spa_utils`; no version comment to update unless 1.0.6 changes the inline setting
- `cypress.config.ts` / `cypress/support/e2e.ts` — spa_utils Cypress subpaths `cypress/jwtDefaults`, `cypress/registerJwtSignTask`, `cypress/registerAuthCommands`

**Source issue**: first `mentorhub_admin_spa` issue in the spa_utils **1.0.6** wave. This task delivers **the pin and local source/doc alignment**. Cypress markdown interaction and packaging are **F025**.

**External prerequisite**: `mentorhub_spa_utils` F050–F056 shipped and **`@mentor-forge/mentorhub_spa_utils@1.0.6` is published to CodeArtifact**. Vue `base` + SPA nginx prefix `/admin/` and the catalog / `/admin/config` Settings host are already shipped. Run `mh`, then `npm view @mentor-forge/mentorhub_spa_utils version`. If **1.0.6** is not available, set this task **Status** to `Blocked`, rename the file to `BLOCKED.F024.pin_spa_utils_1_0_6.md`, and stop — do not stay on `1.0.5` and do not point `package.json` at a git URL or sibling path.

This SPA **owns this repo’s pin**. Sibling SPAs pin independently; do not change other repos.

**Survey (planning time — reconfirm, do not assume a later edit added imports):**

- Zero imports of `CardGrid` from `@mentor-forge/mentorhub_spa_utils`. There is no local `CardGrid` component.
- Zero imports of `DataCard`, `DataCardGrid`, `MhCard`, or `MarkdownEditor`. There are no local copies of those components to delete.
- Products / Discounts stay on `SettingsTableEditor`. Collections (including products-style catalogs) stay on Discovery. `/admin/settings` is detail editing of setting rows, not a list card dashboard.
- Cypress `settings.cy.ts` types into always-visible `SentenceEditor` inputs (`admin-products-name-input` / `admin-discounts-name-input`). Those are not `MarkdownEditor`. Leave them for F025.

**Out of scope**: Cypress specs (F025). Do not pass `navItems`, ALB origins, or role tables into `PageFrame`. Do not override logout locally. Do not fork `AdminPage`, `TokenClaimsCard`, or `PageFrame`. Do not rename, redirect, or delete `/settings`, `/logs`, or `/config`. Do not convert Product / Discount `description` from `SentenceEditor` to `MarkdownEditor`. Do not add a products list or any other collection dashboard.

### Wave ordering

Pin + local 1.0.6 alignment (F024) → Cypress confirmation and packaging (F025). Pinning first makes 1.0.6 `MarkdownEditor` resting view and `DataCardGrid` available before F025 checks selectors.

## Goals

- `package.json` pins `"@mentor-forge/mentorhub_spa_utils": "1.0.6"` — exact semver, **no caret**.
- `package-lock.json` resolves `1.0.6` from the CodeArtifact registry after `mh` and `npm install --include=dev`.
- `npm ls @mentor-forge/mentorhub_spa_utils` reports `1.0.6`.
- `package.json` does **not** gain `marked` or `dompurify` (or any other markdown renderer). Those libraries stay bundled inside spa_utils.
- There are zero imports of `CardGrid` from `@mentor-forge/mentorhub_spa_utils`. If a later edit added one, delete that import and the layout that depended on it. Do not replace it with a list card dashboard.
- Products and Discounts remain table editors. `SettingsTableEditor` stays on standalone `SentenceEditor` / `WordEditor` / `CountEditor` / `DateTimeEditor`. Do not wrap rows in `DataCard` or `DataCardGrid`.
- Do not add a local multi-card page just to consume `DataCardGrid`. This SPA has no page that lays out several edit/detail cards. `/admin/config` continues to render packaged `AdminPage`. If implementation discovers a local page that already lays out several edit/detail cards with ad-hoc markup, replace that layout with package `DataCardGrid` + `DataCard` (no props on the grid; children authored in the slot; root class `data-card-grid`; hardcoded `data-automation-id="data-card-grid"`). Do not pass breakpoint props. Do not flatten Fragments. Do not use it as a list dashboard.
- Do not add a `MarkdownEditor` consumer. Existing description fields stay `sentence`. If a compile fix must touch an editor import, keep the same props. Do not install `marked` or `dompurify` to render markdown locally.
- The app still builds and unit-tests: `PageFrame` still receives only `pageTitle` (`page-title="Admin"`). Keep `provideEditorConfig`. IdP bootstrap / `urlAuthBootstrap` / `redirectToIdpLogin` stay as today. Logout `return_to` remains owned by spa_utils.
- `README.md` names the pinned version **1.0.6**. Keep existing `/admin/config` vs `/admin/settings` wording and the 1.0.5 Token / chrome `display_name` facts, updated to say they are owned by spa_utils **1.0.6**. State that package `CardGrid` is gone, list collections stay on Discovery, multi-card edit/detail would use package `DataCardGrid` / `DataCard` (this SPA has none), and `MarkdownEditor` resting view is owned by spa_utils (this SPA does not depend on `marked` or `dompurify`).
- Fix any `src/**` import or type breakage from 1.0.6. Do not add, rename, or delete routes. Keep existing `/settings`, `/logs`, and `/config` pages and the existing `AdminPage` wrapper.
- `vitest.config.ts` may be touched **only** if 1.0.6 changes whether the package must be inlined for Vitest. Do not change coverage thresholds.
- The three spa_utils Cypress subpath imports still resolve under 1.0.6. If a subpath or option name moved, update the import here — do **not** vendor a local copy. Do not rewrite Cypress specs here.

### Craftsmanship Expectations

- Reuse `mentorhub_spa_utils` for shared SPA behavior rather than creating local equivalents.
- Treat DRY as avoiding duplicated knowledge: card chrome and markdown rendering are owned by 1.0.6 `DataCard` / `DataCardGrid` / `MarkdownEditor`. Do not grow a local card grid or a local markdown renderer.
- Keep journey-specific behavior in this SPA (Products / Discounts table editor, Logs).
- Prefer deleting a `CardGrid` import over replacing it. Do not invent a list dashboard because the export disappeared.
- Do not introduce local workarounds that reimplement `DataCardGrid` columns or sanitize markdown in this repo.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `mh` (CodeArtifact auth) then `npm install --include=dev`
- `npm ls @mentor-forge/mentorhub_spa_utils` — confirm **1.0.6**
- Confirmation searches:
  - `rg 'CardGrid' src cypress package.json README.md` — zero component imports; README may mention the removal
  - `rg 'marked|dompurify' package.json package-lock.json src` — zero direct dependencies (lockfile hits only inside the spa_utils tarball are acceptable)
  - `rg 'MarkdownEditor|DataCardGrid|DataCard' src` — zero, unless a pre-existing multi-card page was migrated in this task
  - `rg "from '@mentor-forge/mentorhub_spa_utils'" src cypress.config.ts cypress/support` — every import still resolves
- `npm run lint` — `vue-tsc --noEmit` must be clean
- `npm run test` — full Vitest suite
- `npm run test:coverage` — the `src/api/**`, `src/composables/**`, and `src/components/**` thresholds in `vitest.config.ts` must still hold
- `npm run build` — `vue-tsc` + Vite production build must be clean

Do **not** run `npm run cypress:run` in this task. Leave selector checks and packaging to F025. Do not “fix” Cypress here unless a Cypress helper import fails to compile.

Packaging (`npm run container` / `npm run service`) is **F025**.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `package.json` — `"@mentor-forge/mentorhub_spa_utils": "1.0.6"`; do not add `marked` or `dompurify`
- `package-lock.json` — resolved 1.0.6 from CodeArtifact
- `README.md` — spa_utils version note **1.0.6**; CardGrid removed; collections stay on Discovery; `DataCardGrid` / `DataCard` contract for multi-card edit/detail (none in this SPA); `MarkdownEditor` resting view owned by spa_utils; keep existing `/admin/config` vs `/admin/settings` wording and Token / chrome `display_name` ids

**Update only if 1.0.6 breaks compile or a `CardGrid` import is found:**

- Any `src/**` file that imported `CardGrid` — delete the import and the dependent layout; do not add a list dashboard
- Any local page that already lays out several edit/detail cards — switch that layout to package `DataCardGrid` + `DataCard`
- `vitest.config.ts` — only if 1.0.6 requires a change to the inline setting
- `cypress.config.ts`, `cypress/support/e2e.ts` — only if a spa_utils Cypress subpath or option moved in 1.0.6
- Any other `src/**` import or type that fails to compile against 1.0.6

Do not change the `/config`, `/settings`, or `/logs` routes. Do not pass disallowed `PageFrame` props. Do not change Cypress specs in this task unless a compile of test helpers breaks. Do not change `src/router/index.ts`, `vite.config.ts`, `nginx.conf.template`, or `Dockerfile`. Do not change `SettingsTableEditor` editor types. Do not rename Product / Discount fields. Do not add `src/main.ts` stylesheet import unless the production build proves package CSS is missing.

## Execution Notes

### Plan
1. Run `mh`, then `npm view @mentor-forge/mentorhub_spa_utils version`. If not `1.0.6`, set Status Blocked, rename task, stop.
2. Bump `package.json` pin from exact `1.0.5` → exact `1.0.6` (no caret). Do not add `marked` / `dompurify`.
3. `npm install --include=dev` to refresh `package-lock.json` from CodeArtifact.
4. Confirm `npm ls @mentor-forge/mentorhub_spa_utils` reports `1.0.6`.
5. Update `README.md` version notes to **1.0.6**; document CardGrid removal, Discovery owns list collections, DataCardGrid/DataCard for multi-card edit/detail (none here), MarkdownEditor resting view owned by spa_utils (no local marked/dompurify). Keep `/admin/config` vs `/admin/settings` and Token/chrome `display_name` wording.
6. Reconfirm zero CardGrid / DataCard / DataCardGrid / MarkdownEditor imports in `src`. No src layout migration expected. Fix compile breakage from 1.0.6 only if it appears.
7. Run confirmation `rg` searches, then `lint`, `test`, `test:coverage`, `build`. Do not run Cypress or packaging.
8. Leave Status Pending; do not rename, commit, or push.

### Summary
Succeeded. CodeArtifact had `@mentor-forge/mentorhub_spa_utils@1.0.6`. Pinned exact `1.0.6` in `package.json`, refreshed lockfile via `mh` + `npm install --include=dev`, and updated `README.md` ownership / Token / chrome version notes. No `src/**` compile fixes needed; no CardGrid import to delete; no DataCardGrid / MarkdownEditor consumers added. Left Status Pending (no rename, commit, or push).

### Files changed
- `package.json` — pin `"@mentor-forge/mentorhub_spa_utils": "1.0.6"`
- `package-lock.json` — resolved `mentorhub_spa_utils-1.0.6.tgz` from CodeArtifact (transitive `marked` / `dompurify` under spa_utils only)
- `README.md` — spa_utils **1.0.6**; CardGrid gone; collections on Discovery; DataCardGrid/DataCard contract (none here); MarkdownEditor resting view owned by spa_utils; Token/chrome `display_name` ids updated to 1.0.6
- `tasks/PENDING.F024.pin_spa_utils_1_0_6.md` — Execution Notes only

### Intentionally not changed
- No `src/**`, `vitest.config.ts`, `cypress.config.ts`, `cypress/support/**`, routes, PageFrame props, `vite.config.ts`, nginx, Dockerfile, or Cypress specs
- Did not add `marked` / `dompurify` to `package.json`
- Did not convert SettingsTableEditor / Products / Discounts to DataCard / DataCardGrid / MarkdownEditor
- Did not run Cypress or packaging (F025)

### Confirmation searches
- `rg 'CardGrid' src cypress package.json README.md` — zero component imports; README only mentions removal
- `rg 'marked|dompurify' package.json package-lock.json src` — zero in `package.json` / `src`; lockfile hits only as spa_utils transitive deps (`dompurify@3.4.16`, `marked@18.0.14`)
- `rg 'MarkdownEditor|DataCardGrid|DataCard' src` — zero
- `rg "from '@mentor-forge/mentorhub_spa_utils'" src cypress.config.ts cypress/support` — imports still present in App, AdminPage, LogsPage, SettingsTableEditor, router, initAuth, useAuth, useRoles, api/client(+test), cypress.config.ts, cypress/support/e2e.ts

### Test results
- `npm ls @mentor-forge/mentorhub_spa_utils` → `@mentor-forge/mentorhub_spa_utils@1.0.6`
- `npm run lint` — **pass** (`vue-tsc --noEmit` clean)
- `npm run test` — **pass** (10 files, 69 tests)
- `npm run test:coverage` — **pass** (10 files, 69 tests); thresholds hold — `src/api/**` 100/97.29/100/100; `src/composables/**` 98.37/75.34/100/98.37; `src/components/**` 100/87.17/92.3/100
- `npm run build` — **pass** (`vue-tsc` + Vite production build; 643 modules)

### Orchestrator confirmation (2026-09-29)
Re-ran `npm ls` (`1.0.6`), CardGrid / marked / DataCard searches, `npm run lint`, `npm run test:coverage` (69 passed; api 100/97.29/100/100, composables 98.37/75.34/100/98.37, components 100/87.17/92.3/100), and `npm run build`. Gates passed. Marked shipped.
