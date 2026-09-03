# F022 – Pin `@mentor-forge/mentorhub_spa_utils@1.0.3` (`token.display_name`)

**Status**: Pending  
**Type**: Feature  
**Depends On**: _(none — first task in this wave)_  
**Description**: This repo owns the Admin SPA **1.0.3 pin** ([F-AS04 / GitHub #8](https://github.com/mentor-forge/mentorhub_admin_spa/issues/8)). Bump `@mentor-forge/mentorhub_spa_utils` from exact `1.0.2` to exact **`1.0.3`**, refresh the lockfile from CodeArtifact, and replace any local use of token `name` with token `display_name`. Do **not** change routes in this task.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — exact semver pins for shared packages; CodeArtifact (`mh` then `npm install`)
- `../mentorhub_spa_utils/README.md` — install pin **1.0.3**; **PageFrame** shows JWT `display_name` next to the avatar (`nav-profile-name-display`) with **no** fallback to `name` / `given_name` / `email` / `user_id` / `sub`; Token tab (`TokenClaimsCard`) field `display_name` with id `admin-token-display-name-display`; missing string claims display `N/A`
- `README.md` — currently documents spa_utils **1.0.2**; Token claim ids listed as `admin-token-profile-id-display`, etc., without `display_name`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `package.json` / `package-lock.json` — currently `"@mentor-forge/mentorhub_spa_utils": "1.0.2"`
- `src/App.vue` — `PageFrame` with `page-title="Admin"` only plus `provideEditorConfig` (keep; do not add `navItems`, ALB URLs, or role tables)
- `src/pages/AdminPage.vue` — already imports `{ AdminPage }` from spa_utils and passes `GET /admin/api/config` (do not fork TokenClaimsCard locally)
- `src/api/types.ts` — `ConfigResponse.token` is currently `{ claims?: Record<string, unknown> }`
- `src/api/types.test.ts` — token fixture uses nested `claims` (`sub`, `roles`)
- `src/api/client.test.ts` — config mock `token: { claims: {} }`
- `src/composables/useConfig.ts` / `src/composables/useConfig.test.ts` — enumerator `name` fields are **not** the token display claim
- `src/composables/useRoles.ts` / `src/composables/useRoles.test.ts` — config token `roles` fallback; do not invent token `name`
- `src/components/SettingsTableEditor.vue` — Product / Discount document `name` editors; **do not rename**
- `vitest.config.ts` — inlines `@mentor-forge/mentorhub_spa_utils`; no version comment to update unless 1.0.3 changes the inline setting

**Source issue**: [F-AS04](https://github.com/mentor-forge/mentorhub_admin_spa/issues/8) ("Bump spa_utils 1.0.3 — replace any use of token.name with token.display_name"). This task delivers **the pin and any local token-claim source/type/doc alignment**. Cypress Token-tab / chrome assertions and packaging are **F023**.

**External prerequisite**: `mentorhub_spa_utils` F047–F049 shipped and **`@mentor-forge/mentorhub_spa_utils@1.0.3` is published to CodeArtifact**. Vue `base` + SPA nginx prefix `/admin/` and the 1.0.1 catalog / `/admin/config` Settings host are already shipped (F012–F021). Run `mh`, then `npm view @mentor-forge/mentorhub_spa_utils version`. If **1.0.3** is not available, set this task **Status** to `Blocked`, rename the file to `BLOCKED.F022.pin_spa_utils_1_0_3.md`, and stop — do not stay on `1.0.2` and do not point `package.json` at a git URL or sibling path.

This SPA **owns this repo’s pin**. Sibling SPAs pin independently; do not change other repos.

**Token vs document `name`:** Product `name`, Discount `name`, enumerator `name`, and collection `name` are **not** the authenticated token display claim. Only JWT / `/admin/api/config` `token` display-field usage that still says `name` becomes `display_name`.

**Out of scope**: Cypress catalog, Token-tab, or chrome specs (F023). Do not pass `navItems`, ALB origins, or role tables into `PageFrame`. Do not override logout locally. Do not add a local `display_name ?? name` shim. Do not fork `TokenClaimsCard` or `PageFrame` chrome. Do not rename, redirect, or delete `/settings`, `/logs`, or `/config`.

### Wave ordering

Pin + local token-claim alignment (F022) → Cypress `display_name` coverage and packaging (F023). Pinning first makes 1.0.3 `PageFrame` chrome and `TokenClaimsCard` `display_name` available before F023 asserts them in the browser.

## Goals

- `package.json` pins `"@mentor-forge/mentorhub_spa_utils": "1.0.3"` — exact semver, **no caret**.
- `package-lock.json` resolves `1.0.3` from the CodeArtifact registry after `mh` and `npm install --include=dev`.
- `npm ls @mentor-forge/mentorhub_spa_utils` reports `1.0.3`.
- There are zero local reads of token `name` in SPA source, unit tests, or README where the value is meant to come from the authenticated token / `/admin/api/config` token contract. Remaining `name` hits are document or enumerator fields.
- If `ConfigResponse.token` (or unit fixtures that model that payload) still encode a token display field as `name`, change it to `display_name`. Do not invent a nested-vs-flat compatibility layer; keep the existing `AdminPage` pass-through of `config.token`.
- The app still builds and unit-tests: `PageFrame` still receives only `pageTitle` (`page-title="Admin"`). Keep `provideEditorConfig`. IdP bootstrap / `urlAuthBootstrap` / `redirectToIdpLogin` stay as today. Logout `return_to` remains owned by spa_utils.
- `README.md` names the pinned version **1.0.3**. Document that Token-tab `display_name` (`admin-token-display-name-display`) and PageFrame chrome `nav-profile-name-display` are owned by spa_utils 1.0.3. Do not invent a local display-name mapping.
- Fix any `src/**` import or type breakage from 1.0.3. Do not add, rename, or delete routes. Keep existing `/settings`, `/logs`, and `/config` pages and the existing `AdminPage` wrapper.
- `vitest.config.ts` may be touched **only** if 1.0.3 changes whether the package must be inlined for Vitest. Do not change coverage thresholds.
- The three spa_utils Cypress subpath imports still resolve under 1.0.3: `cypress/jwtDefaults`, `cypress/registerJwtSignTask`, and `cypress/registerAuthCommands`. If a subpath or option name moved, update the import here — do **not** vendor a local copy. Do not rewrite `navigation.cy.ts` Token or chrome expectations here.

### Craftsmanship Expectations

- Reuse `mentorhub_spa_utils` for shared SPA behavior rather than creating local equivalents.
- Treat DRY as avoiding duplicated knowledge: Token-tab fields and avatar chrome are owned by 1.0.3 `TokenClaimsCard` / `PageFrame`. Do not grow a parallel Token UI.
- Keep journey-specific behavior in this SPA (Products / Discounts editor, Logs).
- Do not introduce local workarounds that accept both token `name` and `display_name`. Prefer proving no production-code change is needed over speculative typing churn.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `mh` (CodeArtifact auth) then `npm install --include=dev`
- `npm ls @mentor-forge/mentorhub_spa_utils` — confirm **1.0.3**
- Confirmation searches:
  - `rg 'token\.name|token\[.name.\]|token\.get\(.name.\)' src README.md`
  - `rg 'display_name' src README.md`
  - Review remaining `name` hits in `src` and prove they are Product / Discount / enumerator / collection fields, not token display claims
- `npm run lint` — `vue-tsc --noEmit` must be clean
- `npm run test` — full Vitest suite
- `npm run test:coverage` — the `src/api/**`, `src/composables/**`, and `src/components/**` thresholds in `vitest.config.ts` must still hold
- `npm run build` — `vue-tsc` + Vite production build must be clean

Do **not** run `npm run cypress:run` in this task. Existing Cypress Token stubs omit `display_name` and do not assert `admin-token-display-name-display` or `nav-profile-name-display`. Leave those specs to F023. Do not “fix” them here unless a unit test or `vue-tsc` fails.

Packaging (`npm run container` / `npm run service`) is **F023**.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `package.json` — `"@mentor-forge/mentorhub_spa_utils": "1.0.3"`
- `package-lock.json` — resolved 1.0.3 from CodeArtifact
- `README.md` — spa_utils version note **1.0.3**; Token / chrome `display_name` ownership (`admin-token-display-name-display`, `nav-profile-name-display`); keep existing `/admin/config` vs `/admin/settings` wording
- `src/api/types.ts` — only if token typing should include `display_name` (do not add a `name` alias)
- `src/api/types.test.ts` / `src/api/client.test.ts` — only if token fixtures modeled a display claim as `name`
- `src/composables/useConfig.ts` / `src/composables/useConfig.test.ts` / `src/composables/useRoles.ts` / `src/composables/useRoles.test.ts` — only if they read a token display field
- `vitest.config.ts` — only if 1.0.3 requires a change to the inline setting
- `cypress.config.ts`, `cypress/support/e2e.ts` — only if a spa_utils Cypress subpath or option moved in 1.0.3
- Any `src/**` import or type that fails to compile against 1.0.3

Do not change the `/config`, `/settings`, or `/logs` routes. Do not pass disallowed `PageFrame` props. Do not change Cypress specs in this task unless a compile of test helpers breaks. Do not change `src/router/index.ts`, `vite.config.ts`, `nginx.conf.template`, or `Dockerfile`. Do not rename Product / Discount `name` fields.

## Execution Notes
