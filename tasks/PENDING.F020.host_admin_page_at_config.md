# F020 – Host packaged `AdminPage` at `/admin/config` (hamburger Settings)

**Status**: Pending  
**Type**: Feature  
**Depends On**: `F019_pin_spa_utils_1_0_1`  
**Description**: Confirm Vue `path: '/config'` under the existing journey `base` so hamburger Settings (`hostingConfigHref()`) lands on **this** SPA at `/admin/config`. Reuse the existing packaged `AdminPage` wrapper. Keep `/admin/settings` as the Products / Discounts **detail** page — it is **not** the hamburger Settings target after 1.0.1. Gate `/config` with the **admin** role; non-admins redirect away. Do not pass nav config into `PageFrame`.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — **Universal PageFrame**: Settings is **admin-only** and uses `hostingConfigHref()` → `{origin}/{journeyPrefix}/config` (not `/admin/settings`, not welcome-port rewrite). For **this** SPA the journey prefix is `/admin/`, so the compiled href is `{origin}/admin/config` — that is correct here and is **not** the destination for other journeys. **Admin config and Token claims**: Token tab ids `admin-token-profile-id-display`, `admin-token-customer-id-display`, `admin-token-mentor-id-display`
- `README.md` — In-App Route Table already lists `/admin/config` as the runtime-config viewer and `/admin/settings` as Products / Discounts; F019 documented the 1.0.1 catalog in prose but did not yet call `/admin/config` the hamburger Settings host
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `src/router/index.ts` — `/config` already loads `src/pages/AdminPage.vue` with `requiresAuth` + `requiresRole: 'admin'`; `/settings` loads `SettingsPage.vue` (Products / Discounts); `/logs` loads `LogsPage.vue`; `/` redirects to `/settings`; missing role calls `window.location.replace(buildJourneyUrl('discovery', ''))` then `next(false)`
- `src/pages/AdminPage.vue` — already imports `{ AdminPage }` from `@mentor-forge/mentorhub_spa_utils` and feeds `GET` config via `api.getConfig()`
- `src/pages/SettingsPage.vue` — Products / Discounts editor; **keep** (issue: `/admin/settings` may remain as a detail page)
- `src/App.vue` — `PageFrame` with `page-title="Admin"` only
- `src/initAuth.ts` — keep IdP bootstrap / `urlAuthBootstrap` as today
- `vite.config.ts` — `base: '/admin/'` already shipped (F012); Vue `path: '/config'` is browser URL `/admin/config`

spa_utils 1.0.1 compiles hamburger Settings to **this** SPA’s `/admin/config` on the **current origin** (Vite/container `:8390` during Cypress; welcome `:8080` when entered through ALB). The hamburger must not be given local `navItems`. Do not hard-code ALB URLs or role tables on `PageFrame`.

F012 already registered `/config` so the 1.0.0 drawer could keep targeting `/admin/settings` (then `JOURNEY_APP_PATHS.settings`) while AdminPage lived at `/config`. **F-AS03 supersedes that hamburger target:** Settings now lands on hosting `/config`. Do **not** redirect `/settings` to `/config` and do **not** make `/settings` an alias of AdminPage — `/admin/settings` stays the Products / Discounts editor. `JOURNEY_APP_PATHS.settings` may still exist in spa_utils for card/deep-link consumers; this SPA must not point the hamburger at it.

**Out of scope**: Cypress click-through, Token tab, catalog rows, logout `return_to`, and non-admin redirect coverage (F021). Do not add Events or any list dashboard. Do not change the spa_utils pin. Do not delete Logs.

## Goals

- Vue route `path: '/config'` (public URL **`/admin/config`** under existing Vite `base` `/admin/`) continues to render the existing packaged `AdminPage` wrapper. Import remains `{ AdminPage }` from `@mentor-forge/mentorhub_spa_utils`. Do not duplicate the prefix inside the route `path` (that would produce `/admin/admin/config`). If `/config` is already correct, do not add a second admin-page route.
- Gate `/config` with the **admin** role using the same `requiresRole: 'admin'` pattern as `/settings` and `/logs`. Unauthenticated callers still hit IdP via the existing `requiresAuth` guard (`redirectToIdpLogin`). Authenticated non-admins redirect away via the existing `window.location.replace(buildJourneyUrl('discovery', ''))` fallback — do not invent a local Home page to absorb the gate.
- **Keep `/settings`** as `SettingsPage.vue` (Products / Discounts). It is a journey-specific **detail** page, not the hamburger Settings target. Keep `/` → `/settings`. Keep `/logs`.
- Do **not** pass `navItems`, ALB URLs, or role tables into `PageFrame`. Settings is already in the compiled 1.0.1 catalog (`hostingConfigHref()` → `{origin}/admin/config` on this host).
- README In-App Route Table (and ownership notes) names `/admin/config` as the hamburger Settings / AdminPage host (Token / Config Items / Versions / Enumerators). Note that hamburger Settings stays on the hosting origin (no `:8080` rewrite). `/admin/settings` remains listed as the Products / Discounts editor — **not** the `nav-settings-link` destination.
- No new local admin chrome. Token claim labels/ids are owned by spa_utils 1.0.1 `TokenClaimsCard`. Do not restore Products / Customer / Customer Members hamburger rows locally. Products editing stays on `/admin/settings`; Products **collection** browsing stays on Discovery.

### Craftsmanship Expectations

- Reuse the packaged `AdminPage`; do not fork Config/Token UI locally.
- Treat DRY as avoiding duplicated knowledge: the hamburger Settings href is `hostingConfigHref()`, not an Admin-owned URL table and not `/admin/settings`.
- Prefer keeping one AdminPage host (`/config`). Do not merge `/settings` into AdminPage to “simplify” the hamburger.
- Keep journey-specific Settings and Logs pages in this SPA; do not reintroduce collection lists that belong on Discovery.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run lint`
- `npm run test`
- `npm run test:coverage` — thresholds unchanged
- `npm run build`

Do not add Cypress here (F021). Router unit tests are optional (`src/router/**` is excluded from coverage). If a router test is added, cover: admin can resolve `/config` with `requiresRole: 'admin'`; `/settings` still resolves to Settings (not AdminPage); authenticated non-admin `requiresRole` does not stay on `/config` (existing Discovery fallback is correct). Do not weaken Settings / Logs page unit tests.

Optional smoke (`npm run api` then `npm run dev` at `http://localhost:8390/admin/`): an admin token can open `/admin/config`; a non-admin token is sent away; `/admin/settings` and `/admin/logs` still render. Do not treat this as a substitute for F021.

Do not run `npm run dev` and `npm run service` at the same time — both bind host port **8390**.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `src/router/index.ts` — only if `/config` is missing, mis-pathed, or missing the admin gate (expected: already correct; do not alias `/settings` to `/config`)
- `src/pages/AdminPage.vue` — only if the wrapper must change to stay the single AdminPage host
- `README.md` — `/admin/config` as the hamburger Settings / AdminPage host; `/admin/settings` remains the Products / Discounts detail page
- A colocated router unit test **only if** one is added for the `/config` role gate (`src/router/index.test.ts`)

Do not add Events or list pages. Do not pass disallowed `PageFrame` props. Do not change the spa_utils pin. Do not rewrite `cypress/e2e/navigation.cy.ts` or `cypress/e2e/settings.cy.ts` in this task.

## Execution Notes

_Reserved for the task execution agent._
