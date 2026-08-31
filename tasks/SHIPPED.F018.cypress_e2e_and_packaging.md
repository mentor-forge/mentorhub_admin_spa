# F018 – Cypress harness, `/admin/` end-to-end specs, and packaging verification

**Status**: Shipped  
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
- `src/pages/SettingsPage.vue` — F016 automation ids (`admin-settings-page`, `admin-settings-tabs`, `admin-settings-tab-products`, `admin-settings-tab-discounts`, `admin-products-*`, `admin-discounts-*`)
- `src/pages/LogsPage.vue` — F017 automation ids (`admin-logs-page`, `admin-logs-source-select`, `admin-logs-refresh-button`, `admin-logs-table`, `admin-logs-row`, `admin-logs-time-display`, `admin-logs-source-display`, `admin-logs-external-id-display`, `admin-logs-user-display`, `admin-logs-detail-toggle`, `admin-logs-detail-display`, `admin-logs-load-more-button`, `admin-logs-empty`, `admin-logs-error`)
- `src/pages/AdminPage.vue` — F012/F013 runtime config viewer

### Target E2E Port

Per `spa_standards.md`, Cypress targets the SPA's direct port: `http://localhost:8390`. The container nginx maps `/admin/` and proxies `/admin/api/` to `admin_api:8389`.

## Goals

- Cypress harness added, matching sibling journey SPAs:
  - dev dependencies `cypress` (^15.8.0) and `@bahmutov/cypress-esbuild-preprocessor` (^2.2.8),
  - `cypress.config.ts` with `baseUrl: 'http://localhost:8390'`, `supportFile: 'cypress/support/e2e.ts'`, `specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}'`, `video: false`, `screenshotOnRunFailure: true`, `env.JWT_SECRET` from `e2eDefaultJwtSecret()`, and `setupNodeEvents` registering `registerJwtSignTask(on)` plus the esbuild file preprocessor,
  - `cypress/support/e2e.ts` calling `registerAuthCommands({ visitPath: '/admin/' })` and `cypress/support/commands.ts`,
  - `package.json` scripts `cypress` (`cypress open`) and `cypress:run` (`cypress run`), and `build-package` runs `npx cypress install` before `npm run container`,
  - `.gitignore` excludes Cypress screenshots / videos / downloads.
- `cypress/e2e/navigation.cy.ts`:
  - PageFrame chrome, Admin title, profile link to customer profile, drawer links to products and settings,
  - `/admin/logs` and `/admin/config` direct load via history fallback,
  - unauthenticated visitor redirect to IdP login,
  - non-admin role redirect out of admin SPA to Discovery journey,
  - dual runtime config endpoints (`/admin/runtime-config.js` and `/runtime-config.js`).
- `cypress/e2e/settings.cy.ts`:
  - Products tab selected by default,
  - tab switching between Products and Discounts with URL query sync `?tab=discounts`,
  - deep linking via `?tab=discounts`,
  - Add product, inline edit cell, delete product with cancel/confirm dialog,
  - Add discount, inline edit cell, delete discount.
- `cypress/e2e/logs.cy.ts`:
  - `/admin/logs` renders table,
  - source filter selector (All, Cognito, Stripe) updates URL query `?source=`,
  - refresh button reloads without errors.
- `README.md` documents Cypress commands (`npm run cypress`, `npm run cypress:run`).
- Full pre-PR QA gate passes.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm install --include=dev` and `npx cypress install`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run container`
- `npm run cypress:run`

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

- `package.json` — Cypress dev dependencies, scripts, and build-package
- `README.md` — E2E commands
- `src/pages/AdminPage.vue` — Added `admin-config-page` automation ID

## Execution Notes

### Summary & Test Results
- Installed `cypress` (^15.8.0) and `@bahmutov/cypress-esbuild-preprocessor` (^2.2.8).
- Updated `package.json` scripts: `"cypress": "cypress open"`, `"cypress:run": "cypress run"`, `"build-package": "npm install --include=dev && npx cypress install && npm run container"`.
- Created `cypress.config.ts`, `cypress/support/e2e.ts`, and `cypress/support/commands.ts`.
- Created 3 Cypress test suites:
  - `cypress/e2e/navigation.cy.ts` (5 tests passing: chrome rendering, history fallback routes, unauthenticated redirect to IdP, non-admin redirect to Discovery, dual runtime config endpoints).
  - `cypress/e2e/settings.cy.ts` (4 tests passing: default products tab & query sync, deep linking `?tab=discounts`, add/edit/delete product with confirmation dialog, add/edit/delete discount).
  - `cypress/e2e/logs.cy.ts` (3 tests passing: page & table rendering, source filtering with `?source=` URL sync, refresh button).
- Updated `src/pages/AdminPage.vue` with `admin-config-page` automation ID.
- Excluded `cypress/**` from unit test coverage in `vitest.config.ts`.
- Updated `README.md` with Cypress commands.
- Ran full Pre-PR QA Gate:
  - `npm run lint` -> Passed (0 errors)
  - `npm run test:coverage` -> Passed (69/69 unit tests, 100% components, 100% api, 98.37% composables)
  - `npm run build` -> Passed (production bundle built cleanly)
  - `npm run container` -> Passed (Docker image built successfully)
  - `npm run cypress:run` -> Passed (12/12 E2E tests passing across all 3 specs)
