# F021 – 1.0.1 catalog, `/admin/config` Cypress and packaging

**Status**: Shipped  
**Type**: Feature  
**Depends On**: `F020_host_admin_page_at_config`  
**Description**: Point Cypress at the spa_utils **1.0.1** hamburger catalog, prove Settings opens this SPA’s `/admin/config` (not `/admin/settings`), cover Token claims, admin-gate `/config`, and verify logout `return_to=/discovery/`. Run the packaged SPA as the acceptance gate for F-AS03.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — E2E covers pages; automation ids are a stable UI API
- `../mentorhub_spa_utils/README.md` — **Universal PageFrame (1.0.1)**: catalog table; removed ids `nav-products-link`, `nav-customer-link`, `nav-customer-members-link`; new `nav-events-link`; kept `nav-settings-link` whose href is `hostingConfigHref()` (hosting origin, **no** `:8080` rewrite); Notifications + Settings **admin-only**; empty/missing roles → Home + Events; logout `return_to` = `buildJourneyUrl('discovery')` → `/discovery/`; Token tab ids `admin-token-profile-id-display`, `admin-token-customer-id-display`, `admin-token-mentor-id-display`
- `README.md` — Testing / Automation Support still describe 1.0.0 admin rows (`nav-products-link`) and treat Notifications as always present
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `cypress.config.ts` — `baseUrl` stays `http://localhost:8390`; `chromeWebSecurity: false` stays (role-guard leaves `:8390` for `:8080/discovery/`)
- `cypress/support/e2e.ts` — `registerAuthCommands({ visitPath: '/admin/' })` (`/` redirects to `/settings`; that remains valid for an **admin** seed)
- `cypress/support/commands.ts` — `visitPrefixed`
- `cypress/e2e/navigation.cy.ts` — still encodes the **1.0.0** catalog: ordered admin rows are Home + Products + Notifications + Settings; Settings uses `assertAlbHref` → `:8080/admin/settings`; logout only asserts `return_to` is present and comments that PageFrame returns to the **root** origin
- `cypress/e2e/settings.cy.ts` — Products / Discounts on `/admin/settings`; **keep** (detail page, not hamburger Settings)
- `cypress/e2e/logs.cy.ts` — `/admin/logs`; keep
- `cypress/e2e/deployment.cy.ts` — nginx prefix / API proxy; keep (no catalog rewrite unless a selector breaks)
- `src/router/index.ts` — `/config` (F020), `/settings`, `/logs`; every in-app route is `requiresRole: 'admin'`; role-gate uses `window.location.replace(buildJourneyUrl('discovery', ''))` (cross-origin `:8080/discovery/`)

Cypress runs against **8390**. Collection hamburger `href`s from `buildJourneyUrl` still include **`:8080`**. **Settings is the exception:** `hostingConfigHref()` stays on the current origin (`http://localhost:8390/admin/config`), not welcome `:8080`, and not `/admin/settings`.

This SPA does **not** host Events. `nav-events-link` is a Discovery ALB href (`http://localhost:8080/discovery/events`). Assert the `href`; do not follow it and do not add `/events` here.

**Admin SPA constraint:** every Vue route requires `admin`. A mentee / mentor / empty-role login is redirected to Discovery before the drawer can be asserted on this host. Do **not** add a local Home (or weaken `requiresRole`) to make a least-privileged catalog screenshot possible. Prove “Notifications and Settings only for `admin`” by (1) the admin catalog including those rows and (2) a non-admin visit to `/admin/config` leaving the page. Spa_utils still compiles Home + Events for empty/missing roles; that catalog is owned by spa_utils tests, not this SPA.

`npm run dev` and `npm run service` both bind host port **8390**. Cypress runs against `npm run service`.

`cy.login()` with no argument seeds an **admin** token. Use `cy.login(['admin'])` for Settings. Use a login **without** `admin` (for example `cy.login(['mentee'])`) only for the config-gate redirect. Pick roles deliberately — do not assert “only two rows exist” against a default `cy.login()`.

## Goals

- **Catalog (admin-only login):** ordered rows are Home, Events, Notifications, Settings. Mentor browse rows (`nav-resources-link`, `nav-paths-link`, `nav-plans-link`) are absent. Home `href` is welcome `:8080/discovery/`. Events `href` is welcome `:8080/discovery/events`. Notifications `href` is `:8080/discovery/notifications`. Profile avatar still targets `/customer/profile/` on `:8080`. **Settings** `href` is `http://localhost:8390/admin/config` (hosting origin). Assert **before** click: includes `:8390`, does **not** include `:8080`, does **not** include `/admin/settings`, does **not** include `/admin/admin`. Clicking it stays on this SPA at pathname `/admin/config` (`admin-config-page` visible).
- **Removed hamburger rows:** `nav-products-link`, `nav-customer-link`, and `nav-customer-members-link` are **absent** for the admin login that can stay on this SPA. Do not restore them locally. Products **editing** remains on `/admin/settings` (`settings.cy.ts`); Products **collection** browsing remains on Discovery.
- **Notifications and Settings only for `admin`.** An admin login shows those rows. A login without `admin` must not remain on `/admin/config` showing AdminPage (see Config gate). Do not add a local page so a mentee can open this SPA’s drawer.
- **Token tab:** after admin Settings navigation, stub `GET /admin/api/config` (or `**/admin/api/config`) with a `token` object carrying `profile_id`, `customer_id`, and `mentor_id`. Open the Token tab (`admin-tab-token`) and assert `admin-token-profile-id-display`, `admin-token-customer-id-display`, `admin-token-mentor-id-display` (read-only input values, matching spa_utils `TokenClaimsCard`).
- **Config gate:** a login **without** `admin` visiting `/admin/config` must **not** remain on that path showing AdminPage. The existing guard calls `window.location.replace(buildJourneyUrl('discovery', ''))` (cross-origin `:8080/discovery/`). Cypress cannot follow that the way it follows same-origin Home — prove the negative at the boundary: pathname is no longer `/admin/config` and Token/config chrome is not shown. If the browser unloads toward `:8080/discovery/` (existing `@discoveryShell` intercept pattern), that is success. Do **not** add a local Home fallback to make the test easier. An admin visit stays on `/admin/config`.
- **Logout:** after `nav-logout-link`, IdP stub still loads and `return_to` is welcome origin `http://localhost:8080/discovery/` — not a hardcoded `127.0.0.1` SPA URL, not bare `/` as the only path, not `/admin/` or `/admin/settings` as the return. Update or delete the F011/F018 comment that treated missing `/discovery/` as a spa_utils limitation.
- Existing prefix / API / history-fallback / unauthenticated-deep-link / runtime-config / title coverage in `navigation.cy.ts` still passes. `settings.cy.ts` still covers `/admin/settings` (Products / Discounts). `logs.cy.ts` and `deployment.cy.ts` still pass; touch them only if a 1.0.1 catalog id or `/admin/settings` vs `/admin/config` assertion breaks.
- `/admin/settings` **must still resolve** as the detail page. Prefer asserting `/admin/config` as the hamburger Settings host. Unauthenticated `return_to` for a deep link to `/admin/settings` may remain `/admin/settings` (IdP returns to the page that was requested).
- No `/admin/admin` in `cy.url()` or `href`.
- `README.md` Testing / Automation Support lists 1.0.1 ids: Events for authenticated users (visible on this host only for `admin`, because other roles leave); Notifications + Settings **admin-only**; Settings → hosting `/admin/config`; Products / Customer / Customer Members absent from the hamburger.

### Craftsmanship Expectations

- Use spa_utils PageFrame automation ids; do not invent a local drawer.
- Assert Settings at the layer that owns it (`hostingConfigHref` on the current origin) and Events/Home/Notifications at the layer that owns them (`buildJourneyUrl` on welcome `:8080`). A test that only checks the final page without the href origin would miss a `:8080` rewrite bug on Settings, or a leftover `/admin/settings` hamburger target.
- Do not restore Products / Customer / Members rows to make an old assertion pass. Do not retarget `settings.cy.ts` at `/admin/config`.
- Keep journey-specific Settings and Logs specs intact; this task is catalog + config + logout, not a CRUD rewrite.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run lint`
- `npm run test`
- `npm run test:coverage`
- `npm run build`

**Packaging verification** (required — last task of the F-AS03 / 1.0.1 set):

- `npm run container` — build the SPA container image
- `npm run service` — run db + API + SPA containers
- `npm run cypress:run` — headless end-to-end tests (long running); **all** specs must pass against `http://localhost:8390/admin/...`

Do not run `npm run dev` and `npm run service` at the same time — both bind host port **8390**.

Record results in **Execution Notes**. The gate that would look correct while bypassing the intended boundary is: Settings `href` rewritten to `:8080` or `/admin/settings`; a non-admin remaining on `/admin/config`; or logout `return_to` pointing at SPA root `/` or `/admin/` instead of `/discovery/`. Include those negative assertions.

Env notes from prior waves: `GITHUB_FOREVER_TOKEN` as `GITHUB_TOKEN` if the file token is denied by GHCR; `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` before `mh up` so logout specs do not hang on a Tailscale IdP host.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `cypress/e2e/navigation.cy.ts` — 1.0.1 catalog (admin), Settings `http://localhost:8390/admin/config`, Events `:8080/discovery/events`, removed Products/Customer/Members ids, admin-only Notifications/Settings, Token tab claims, `/admin/config` role gate, logout `return_to=/discovery/`
- `cypress/e2e/deployment.cy.ts` — only if a prefix assertion must mention `/config`
- `cypress/e2e/settings.cy.ts`, `cypress/e2e/logs.cy.ts` — only if a 1.0.1 catalog or hamburger Settings selector breaks (`settings.cy.ts` must remain on `/admin/settings`)
- `cypress/support/commands.ts` / `cypress/support/e2e.ts` — only if visit helpers need a config-page path
- `cypress/fixtures/**` — only if Token/config intercepts need a fixture
- `README.md` — Testing / Automation Support 1.0.1 hamburger ids and Settings host (`/admin/config` vs `/admin/settings` detail page)

Do not restore a local drawer. Do not change the spa_utils pin. Do not add an Events route or list dashboards. Do not pass disallowed `PageFrame` props.

## Execution Notes

Plan:
- Update `cypress/e2e/navigation.cy.ts` for the spa_utils 1.0.1 catalog: admin drawer ordering, Events href on welcome `:8080`, removed hamburger ids, Settings href on the hosting `:8390/admin/config`, AdminPage Token tab claims, non-admin `/admin/config` redirect boundary, and logout `return_to=http://localhost:8080/discovery/`.
- Leave `cypress/e2e/settings.cy.ts` on `/admin/settings` and keep `logs.cy.ts` unchanged unless Cypress exposes a selector break.
- Update `README.md` Testing / Automation Support wording so it reflects 1.0.1 drawer ids and the `/admin/config` Settings host.
- Run the required lint, unit, coverage, build, container, service, and packaged Cypress checks from the repo root. Use `GITHUB_FOREVER_TOKEN` as `GITHUB_TOKEN` and `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` only if needed for packaging/service.

Implemented:
- Updated `cypress/e2e/navigation.cy.ts` to assert the 1.0.1 admin catalog order (`Home`, `Events`, `Notifications`, `Settings`), welcome-origin Home / Events / Notifications hrefs, removed Products / Customer / Customer Members drawer ids, absent mentor browse rows for admin, Settings `href=http://localhost:8390/admin/config` before click, `/admin/config` after click, Token claim ids/values, admin and non-admin `/admin/config` guard behavior, and logout `return_to=http://localhost:8080/discovery/`.
- Kept `cypress/e2e/settings.cy.ts` on `/admin/settings`; no changes were needed in `settings.cy.ts`, `logs.cy.ts`, `deployment.cy.ts`, support commands, fixtures, router, or the spa_utils pin.
- Updated `README.md` Testing / Automation Support to describe 1.0.1 drawer ids, admin-only Notifications / Settings, mentor-only browse rows, removed Products / Customer / Customer Members ids, and `/admin/config` as the hamburger Settings host.

Test results:
- `npm run lint` — passed (`vue-tsc --noEmit`).
- `npm run test` — passed: 10 test files, 69 tests.
- `npm run test:coverage` — passed: 10 test files, 69 tests; all files coverage 98.27% statements, 82.78% branches, 93.75% functions, 98.27% lines.
- `npm run build` — passed; Vite emitted existing warnings for non-module `/admin/runtime-config.js` script bundling and chunks over 500 kB.
- `npm run container` — passed; built `ghcr.io/mentor-forge/mentorhub_admin_spa:latest` (`sha256:751dfcc00727dbaa1cec814ee7bf5e09bee584fec66c0d4b572c5818669f66cf`). Docker emitted `JSONArgsRecommended`; npm install reported 5 audit vulnerabilities and install-script warnings during image build.
- `npm run service` — passed; `mh down && mh up admin && npm run open` started db, API, welcome, and Admin SPA containers.
- `npm run cypress:run` — passed against `http://localhost:8390`: `deployment.cy.ts` 9/9, `logs.cy.ts` 3/3, `navigation.cy.ts` 9/9, `settings.cy.ts` 4/4; total 25/25 passing, 0 failing.

Env workarounds:
- Exported `GITHUB_TOKEN` from `GITHUB_FOREVER_TOKEN` when present before `npm run container` / `npm run service`.
- Ran `npm run service` with `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` so logout/IdP specs stay on the local Developer Edition IdP.
