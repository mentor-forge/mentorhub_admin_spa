# F018 – Cypress harness, `/admin/` end-to-end specs, and packaging verification

**Status**: Pending  
**Type**: Feature  
**Depends On**: `F017_logs_page`  
**Description**: Add the Cypress v15 harness this repo does not yet have, write end-to-end specs against the shipped `/admin/` prefix, spa_utils `PageFrame` automation ids, and the Settings / Logs pages, then run the full packaging verification against the container stack. This task closes the acceptance criteria of both source issues (F-AS01, F-AS02).

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — **E2E Testing** Cypress v15.8, `cypress/e2e/**/*.cy.ts`, `cypress/support/`, custom login command, automation-id selectors; `npx cypress install` after the package version changes
- `../mentorhub_spa_utils/README.md` — **Universal PageFrame (1.0.0)** drawer ids and role gating; **Cross-SPA URLs** (drawer hrefs are absolute welcome/ALB `:8080` URLs, never direct debug ports); package Cypress helper entry points `@mentor-forge/mentorhub_spa_utils/cypress/jwtDefaults`, `/cypress/registerJwtSignTask`, `/cypress/registerAuthCommands`
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `package.json` — no `cypress` dependency and no `cypress` / `cypress:run` scripts yet; `build-package` does not run `npx cypress install`
- `src/pages/SettingsPage.vue`, `src/pages/LogsPage.vue`, `src/pages/AdminPage.vue`, `src/components/SettingsTableEditor.vue` — automation ids established in F012 and F015–F017
- `nginx.conf.template`, `Dockerfile` — F013 prefix and runtime-config behavior under test

**Automation ids under test** (do not invent new ones here; if a needed id is missing, add it to the owning component and note it in Execution Notes):

- spa_utils chrome: `nav-drawer-toggle`, `page-frame-title`, `nav-profile-link`, `nav-products-link`, `nav-settings-link`, `nav-logout-link`
- pages: `admin-settings-page`, `admin-settings-tabs`, `admin-settings-products-tab`, `admin-settings-discounts-tab`, `admin-logs-page`, `admin-logs-source-select`, `admin-logs-table`, `admin-logs-row`, `admin-logs-empty`, `admin-logs-load-more-button`, `admin-logs-detail-toggle`
- table editor: `admin-products-table` / `admin-discounts-table`, `{prefix}-add-button`, `{prefix}-row`, `{prefix}-{field}-input`, `{prefix}-delete-button`, `{prefix}-delete-confirm-button`, `{prefix}-empty`

Cypress `baseUrl` is the **direct debug port** `http://localhost:8390`, and every visit is under the prefix (`/admin/`, `/admin/settings`, `/admin/logs`, `/admin/config`). Never visit `/admin` as a second Vue path segment, and never assert `/admin/admin`. Drawer hrefs must resolve to `http://localhost:8080/...` (the welcome origin), not `:8390`.

## Goals

- Cypress harness added, matching sibling journey SPAs:
  - dev dependencies `cypress` (v15.8+) and `@bahmutov/cypress-esbuild-preprocessor` (esbuild is required because the packaged spa_utils Cypress helpers are TypeScript inside `node_modules`),
  - `cypress.config.ts` with `baseUrl: 'http://localhost:8390'`, `supportFile: 'cypress/support/e2e.ts'`, `specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}'`, `video: false`, `screenshotOnRunFailure: true`, `env.JWT_SECRET` from `e2eDefaultJwtSecret()`, and `setupNodeEvents` registering `registerJwtSignTask(on)` plus the esbuild file preprocessor,
  - `cypress/support/e2e.ts` calling `registerAuthCommands({ visitPath: '/admin/' })` so `cy.login([...roles])` seeds a signed JWT and lands on the prefixed app; `cypress/support/commands.ts` as the local extension point,
  - `package.json` scripts `cypress` (`cypress open`) and `cypress:run` (`cypress run`), and `build-package` runs `npx cypress install` before `npm run container`,
  - `.gitignore` excludes Cypress screenshots / videos / downloads if not already covered.
- `cypress/e2e/navigation.cy.ts` — prefix and chrome:
  - `cy.visit('/admin/')` lands on `/admin/settings` (the in-app default) and `page-frame-title` reads `Admin`,
  - `/admin/logs` and `/admin/config` load directly through the history fallback,
  - an admin login opens the drawer via `nav-drawer-toggle` and sees `nav-products-link` → `http://localhost:8080/discovery/products` and `nav-settings-link` → `http://localhost:8080/admin/settings`; no href contains `:8390` or `/admin/admin`,
  - `nav-profile-link` → `http://localhost:8080/customer/profile/` and `nav-logout-link` is present,
  - a non-admin login (for example `['mentee']`) visiting `/admin/settings` does not render `admin-settings-page`,
  - no spec references removed local ids (`nav-home-link`, `nav-admin-link`) or a `/home` route.
- `cypress/e2e/settings.cy.ts` — Products and Discounts:
  - Products tab is selected by default and `admin-products-table` renders,
  - `admin-products-add-button` adds a row, the new row's `admin-products-name-input` accepts a value that survives a reload,
  - editing a numeric cell (`admin-products-unit_price-input`) persists,
  - the row delete flow (`admin-products-delete-button` → `admin-products-delete-confirm-button`) removes the row from the active list and it stays gone after a reload,
  - switching to `admin-settings-discounts-tab` shows `admin-discounts-table`; add, edit `admin-discounts-code-input`, and delete behave the same,
  - `/admin/settings?tab=discounts` deep-links to the Discounts tab,
  - specs create the rows they assert on and clean up by deleting them, so repeated runs stay stable.
- `cypress/e2e/logs.cy.ts` — external events:
  - `/admin/logs` renders `admin-logs-page` and either `admin-logs-row` entries in descending time order or `admin-logs-empty`,
  - selecting a source in `admin-logs-source-select` filters the visible rows and updates the URL query; `?source=stripe` deep-links to the filtered view,
  - the detail toggle reveals the normalized payload,
  - the spec tolerates an empty ingress collection (assert the empty state rather than failing) since this repo must not seed another domain's data.
- `README.md` documents the Cypress workflow: `npm run service` (or `npm run api` + `npm run dev`), then `npm run cypress` / `npm run cypress:run`, base URL `http://localhost:8390` with prefixed visits, and that direct port 8390 exists for Cypress and debugging while `:8080/admin/` is the supported browser entry.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm install --include=dev` (after `mh`) and `npx cypress install`
- `npm run lint`
- `npm run test`
- `npm run build`
- **Packaging verification:**
  - `npm run container` — build the SPA container image
  - `npm run service` — start db + admin API + admin SPA containers
  - `npm run cypress:run` — headless end-to-end tests against the packaged stack (long running); all three specs must pass
- Re-confirm the F013 curl spot-checks still hold on the packaged stack: `/` redirects to `/admin/`, `/admin/settings` and `/admin/logs` return the app shell, `/admin/runtime-config.js` is `200` `no-store` with the compose `IDP_LOGIN_URI`, and `/admin/api/config` reaches `admin_api`.
- Confirm the webhook ingress URL is **not** reachable under `/admin/` from this container (no ingress location was added).

## Outputs

Paths are relative to **this SPA repository root**.

**Create:**

- `cypress.config.ts`
- `cypress/support/e2e.ts`
- `cypress/support/commands.ts`
- `cypress/e2e/navigation.cy.ts`
- `cypress/e2e/settings.cy.ts`
- `cypress/e2e/logs.cy.ts`

**Update:**

- `package.json` — Cypress dev dependencies, `cypress` / `cypress:run` scripts, `build-package` cypress install
- `package-lock.json` — resolved Cypress dependencies
- `.gitignore` — Cypress artifacts
- `README.md` — E2E workflow and URL boundaries
- Any component or page that is missing an automation id the specs require (record each addition in Execution Notes)

## Execution Notes

_Reserved for the task execution agent: plan, commands run, test results, follow-ups._
