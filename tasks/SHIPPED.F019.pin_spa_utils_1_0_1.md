# F019 – Pin `@mentor-forge/mentorhub_spa_utils@1.0.1`

**Status**: Shipped  
**Type**: Feature  
**Depends On**: _(none — first task in this wave)_  
**Description**: This repo owns the Admin SPA **1.0.1 pin** (issue F-AS03 / GitHub #6). Bump `@mentor-forge/mentorhub_spa_utils` from exact `1.0.0` to exact **`1.0.1`**, refresh the lockfile from CodeArtifact, and fix any compile or unit-test breakage from the 1.0.1 catalog, logout `return_to=/discovery/`, Settings `hostingConfigHref`, and Token claims. Do **not** change routes in this task.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — exact semver pins for shared packages; CodeArtifact (`mh` then `npm install`)
- `../mentorhub_spa_utils/README.md` — install pin **1.0.1**; **Universal PageFrame** (1.0.1 catalog: Home, Events, Resources, Paths, Plans; Notifications + Settings **admin-only**; Settings = `hostingConfigHref()` → `{origin}/{prefix}/config`; empty/missing roles → Home + Events); logout `logout()` then `redirectToIdpLogin(buildJourneyUrl('discovery'))` → `/discovery/`; **Admin config and Token claims**; removed hamburger ids `nav-products-link`, `nav-customer-link`, `nav-customer-members-link`; new `nav-events-link`
- `README.md` — currently documents spa_utils **1.0.0**; In-App Route Table already lists `/admin/config` as the runtime-config viewer and `/admin/settings` as Products / Discounts; Automation Support still lists 1.0.0 rows (`nav-products-link` admin-gated, `nav-notifications-link` always present)
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `package.json` / `package-lock.json` — currently `"@mentor-forge/mentorhub_spa_utils": "1.0.0"`
- `src/App.vue` — `PageFrame` with `page-title="Admin"` only plus `provideEditorConfig` (keep; do not add `navItems`, ALB URLs, or role tables)
- `src/initAuth.ts` — `bootstrapAuthFromUrl()` (keep IdP bootstrap / `urlAuthBootstrap` / `redirectToIdpLogin` as today)
- `src/pages/AdminPage.vue` — already imports `{ AdminPage }` from spa_utils (do not change the host wrapper here)
- `src/router/index.ts` — `/config` already loads `AdminPage.vue` with `requiresAuth` + `requiresRole: 'admin'`; `/settings` is the Products / Discounts editor (F016); F020 owns wording `/config` as the hamburger Settings / `hostingConfigHref` host
- `cypress/e2e/navigation.cy.ts` — still encodes the **1.0.0** catalog (admin Home + Products + Notifications + Settings → `/admin/settings` via `assertAlbHref` on `:8080`; logout comment that `return_to` is the root origin)
- `vitest.config.ts` — inlines `@mentor-forge/mentorhub_spa_utils`; no version comment to update unless 1.0.1 changes the inline setting

**Source issue**: [F-AS03](https://github.com/mentor-forge/mentorhub_admin_spa/issues/6) ("Pin spa_utils 1.0.1 and host AdminPage at /admin/config"). This task delivers **only** the pin.

**External prerequisite**: `mentorhub_spa_utils` F041–F046 shipped and **`@mentor-forge/mentorhub_spa_utils@1.0.1` is published to CodeArtifact**. Vue `base` + SPA nginx prefix `/admin/` are already shipped (F012–F013 / mentorhub L022). Run `mh`, then `npm view @mentor-forge/mentorhub_spa_utils version`. If **1.0.1** is not available, set this task **Status** to `Blocked`, rename the file to `BLOCKED.F019.pin_spa_utils_1_0_1.md`, and stop — do not stay on `1.0.0` and do not point `package.json` at a git URL.

This SPA is the **first** `mentorhub_admin_spa` issue in the 1.0.1 wave and **owns this repo’s pin**. Sibling SPAs pin independently; do not change other repos.

**Out of scope**: README Settings-host wording vs `/admin/settings` detail page (F020). Cypress catalog / Settings / Token / logout `return_to` assertions (F021). Do not pass `navItems`, ALB origins, or role tables into `PageFrame`. Do not override logout locally. Do not restore Products / Customer / Customer Members drawer rows. Do not add list dashboards. Do not rename, redirect, or delete `/settings` or `/logs`.

### Wave ordering

Pin (F019) → config route as Settings host (F020) → Cypress and packaging (F021). Pinning first makes the 1.0.1 `PageFrame` catalog, `hostingConfigHref()`, Token claim labels, and logout `return_to` available before F020 documents `/admin/config` as the hamburger Settings destination. Cypress still encodes the 1.0.0 catalog, so **do not run** `npm run cypress:run` here.

## Goals

- `package.json` pins `"@mentor-forge/mentorhub_spa_utils": "1.0.1"` — exact semver, **no caret**.
- `package-lock.json` resolves `1.0.1` from the CodeArtifact registry after `mh` and `npm install --include=dev`.
- `npm ls @mentor-forge/mentorhub_spa_utils` reports `1.0.1`.
- The app still builds and unit-tests: `PageFrame` still receives only `pageTitle` (`page-title="Admin"`). Keep `provideEditorConfig` (Settings table editors depend on it). IdP bootstrap / `urlAuthBootstrap` / `redirectToIdpLogin` stay as today. Logout `return_to` remains owned by spa_utils — do not add a local logout handler and do not re-introduce `handleLogout`.
- `README.md` names the pinned version **1.0.1** in ownership / component notes. Document the 1.0.1 hamburger catalog in prose (Home, Events, Resources, Paths, Plans; Notifications and Settings **admin-only**; Settings lands on this SPA’s `/config` once F020 ships; Products / Customer / Customer Members are **not** hamburger rows). Do not invent a local nav config API. Keep the existing In-App Route Table rows for `/admin/config` and `/admin/settings`; F020 owns calling `/admin/config` the hamburger Settings / `hostingConfigHref` host (Token / Config Items / Versions / Enumerators, no `:8080` rewrite) and keeping `/admin/settings` as the Products / Discounts detail page.
- Fix any `src/**` import or type breakage from 1.0.1. Do not add, rename, or delete routes in this task. Keep existing `/settings`, `/logs`, and `/config` pages and the existing `AdminPage` wrapper.
- `vitest.config.ts` may be touched **only** if 1.0.1 changes whether the package must be inlined for Vitest. Do not change coverage thresholds.
- The three spa_utils Cypress subpath imports still resolve under 1.0.1: `cypress/jwtDefaults`, `cypress/registerJwtSignTask`, and `cypress/registerAuthCommands`. If a subpath or option name moved, update the import here — do **not** vendor a local copy. Do not rewrite `navigation.cy.ts` catalog expectations here.

### Craftsmanship Expectations

- Reuse `mentorhub_spa_utils` for shared SPA behavior rather than creating local equivalents.
- Treat DRY as avoiding duplicated knowledge: catalog, logout `return_to`, and Settings href are owned by 1.0.1 `PageFrame` / `hostingConfigHref` / `buildJourneyUrl`. Do not grow a parallel hamburger.
- Keep journey-specific behavior in this SPA (Products / Discounts editor, Logs); do not restore Products / Customer / Members drawer rows locally.
- Prefer deleting obsolete local behavior when responsibility has moved to spa_utils. Do not introduce local workarounds for 1.0.1 catalog or logout.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `mh` (CodeArtifact auth) then `npm install --include=dev`
- `npm ls @mentor-forge/mentorhub_spa_utils` — confirm **1.0.1**
- `npm run lint` — `vue-tsc --noEmit` must be clean
- `npm run test` — full Vitest suite
- `npm run test:coverage` — the `src/api/**`, `src/composables/**`, and `src/components/**` thresholds in `vitest.config.ts` must still hold
- `npm run build` — `vue-tsc` + Vite production build must be clean

Do **not** run `npm run cypress:run` in this task. Existing Cypress still encodes the 1.0.0 catalog (`nav-products-link`, Settings → `/admin/settings` on `:8080`, Notifications always present, logout to root origin). Leave those specs to F021. Do not “fix” them here unless a unit test or `vue-tsc` fails.

Packaging (`npm run container` / `npm run service`) is **F021**.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `package.json` — `"@mentor-forge/mentorhub_spa_utils": "1.0.1"`
- `package-lock.json` — resolved 1.0.1 from CodeArtifact
- `README.md` — spa_utils version note and 1.0.1 catalog ownership (keep the existing `/admin/config` and `/admin/settings` route-table rows; do not rewrite `/admin/config` as the hamburger Settings host yet)
- `vitest.config.ts` — only if 1.0.1 requires a change to the inline setting
- `cypress.config.ts`, `cypress/support/e2e.ts` — only if a spa_utils Cypress subpath or option moved in 1.0.1
- Any `src/**` import or type that fails to compile against 1.0.1

Do not change the `/config`, `/settings`, or `/logs` routes. Do not pass disallowed `PageFrame` props. Do not change Cypress specs in this task unless a compile of test helpers breaks. Do not change `src/router/index.ts`, `vite.config.ts`, `nginx.conf.template`, or `Dockerfile`.

## Execution Notes

### Plan (pre-implementation)

1. Confirmed `@mentor-forge/mentorhub_spa_utils@1.0.1` is published (`mh` + `npm view` → `1.0.1`).
2. Bump `package.json` exact pin from `1.0.0` → `1.0.1`; run `npm install --include=dev` to refresh lockfile from CodeArtifact.
3. Update `README.md`: ownership table and Automation Support prose for 1.0.1 hamburger catalog (Home, Events, Resources, Paths, Plans; Notifications + Settings admin-only; Settings → `/config` once F020 ships; Products / Customer / Customer Members not in drawer). Keep existing In-App Route Table rows unchanged.
4. Fix any `src/**` compile or unit-test breakage; touch `vitest.config.ts` / Cypress helper imports only if 1.0.1 requires it. Do not change routes, PageFrame props, or Cypress catalog specs.
5. Run full test matrix: `npm ls`, `lint`, `test`, `test:coverage`, `build`.

### Results (2026-09-01)

**Status:** Succeeded — no compile or unit-test breakage from 1.0.1.

**Files changed:**
- `package.json` — exact pin `1.0.1`
- `package-lock.json` — resolved `@mentor-forge/mentorhub_spa_utils@1.0.1` from CodeArtifact
- `README.md` — spa_utils version **1.0.1**, 1.0.1 hamburger catalog ownership prose, Automation Support ids (removed `nav-products-link`; added Events/Resources/Paths/Plans admin rows; noted F021 owns Cypress catalog updates)

**No changes needed:** `src/**`, `vitest.config.ts`, `cypress.config.ts`, `cypress/support/e2e.ts` — 1.0.1 is drop-in for existing imports and Cypress subpaths.

**Test results (all pass):**
| Command | Result |
|---------|--------|
| `npm ls @mentor-forge/mentorhub_spa_utils` | `@mentor-forge/mentorhub_spa_utils@1.0.1` |
| `npm run lint` | pass (`vue-tsc --noEmit` clean) |
| `npm run test` | pass — 10 files, 69 tests |
| `npm run test:coverage` | pass — thresholds met (`src/api/**`, `src/composables/**`, `src/components/**`) |
| `npm run build` | pass (`vue-tsc` + Vite production build) |

**Follow-ups:** F020 (document `/admin/config` as hamburger Settings host), F021 (Cypress catalog + packaging).
