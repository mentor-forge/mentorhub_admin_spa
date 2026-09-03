# Mentor Hub — Admin SPA

## Current State
Guidance for LLM Code Assistants - NOTE: We are currently pre-release. At this time, no changes should consider backward compatibility. Likewise, while we anticipate versioning releases in the future at this point, no consideration should be given to bumping any versions beyond managing the internal api_utils spa_utils dependencies. We are in a rapid iteration phase where features can be deprecated and removed without pause. When working in this repo we should keep our eyes out for potential re-usable code that could be migrated to spa_utils. This code should be implemented locally, and issues opened in the spa_utils repo when it is time to migrate code.

UI Components should stick to Vuetify styling, and leverage re-usable input components from SPA utils when possible. If a spa_utils component need to be updated, the code can be copied to this repo, edited, tested, and migrated to the utils repo like new re-usable components are.

## Prerequisites
- Mentor Hub [Developers Edition](https://github.com/mentor-forge/mentorhub/blob/main/CONTRIBUTING.md)
- Developer [SPA Standard Prerequisites](https://github.com/mentor-forge/mentorhub/blob/main/DeveloperEdition/standards/spa_standards.md)

## Quick Start

```sh
npm run service
```

| Service | Port | URL |
|---------|------|-----|
| Developer Edition login (IdP) | **8080** | `http://127.0.0.1:8080/login.html` |
| Admin SPA (welcome / ALB — **supported browser entry**) | **8080** | `http://<host>:8080/admin/` |
| Admin SPA (Vite dev or container — **direct-port debugging only**) | **8390** | `http://localhost:8390/admin/` |
| Admin API | **8389** | this SPA's nginx at `/admin/api/` (and `/api/` for direct-port debug) |

> [!WARNING]
> `npm run dev` and `npm run service` both bind host port **8390** and cannot run at the same time.

The supported browser entry is `http://<host>:8080/admin/` through Developer Edition welcome / ALB. `http://localhost:8390/admin/` is for Cypress, OpenAPI, and debugging only. API calls from the app use `/admin/api/` and reach `admin_api` through this SPA's nginx.

`npm run dev` serves the app at `http://localhost:8390/admin/`.

### In-App Route Table

Vue route `path` strings stay unprefixed. Vite `base: '/admin/'` prefixes the browser URL. There is no Vue route whose path is `/admin` — that would produce `/admin/admin/...`.

| Browser URL | Vue Path | Page |
|---|---|---|
| `http://localhost:8390/admin/` | `/` | redirect → `/settings` |
| `http://localhost:8390/admin/settings` | `/settings` | `SettingsPage.vue` (Products / Discounts detail — **not** hamburger Settings) |
| `http://localhost:8390/admin/logs` | `/logs` | `LogsPage.vue` (external-event audit) |
| `http://localhost:8390/admin/config` | `/config` | `AdminPage.vue` (hamburger **Settings** host — Token / Config Items / Versions / Enumerators) |

Hamburger **Settings** (`nav-settings-link`) uses spa_utils `hostingConfigHref()` → `{origin}/admin/config` on the **hosting origin** (welcome `:8080` when entered through ALB; `:8390` during direct-port debug). It does **not** rewrite to welcome `:8080` from a debug port and does **not** target `/admin/settings`.

## Developer Commands

```sh
## install dependencies (run `mh` first for CodeArtifact auth)
npm ci

## install Cypress binaries
npx cypress install

## type-check
npm run lint

## package code for deployment
npm run build

## run Vite dev server on http://localhost:8390/admin/ (assumes API is running)
npm run dev

## run unit tests
npm run test:unit

## run unit tests with coverage
npm run test:coverage

## open Cypress E2E test runner
npm run cypress

## run Cypress E2E tests headless
npm run cypress:run

## de down and start db + admin-api containers
npm run api

## de down and start db + admin-api + admin-spa containers and open browser
npm run service

## open page in the browser (http://localhost:8390/admin/)
npm run open

## build SPA docker container locally (run `mh` first)
npm run container
```

## Architecture Overview

```
src/
  api/              # Admin domain API client (setting, external-event, config)
  components/       # SettingsTableEditor (local; spa_utils harvest candidate)
  pages/            # SettingsPage, LogsPage, AdminPage
  composables/      # useAuth (spa_utils re-export), useConfig, useRoles, useSettings, useExternalEvents
  router/           # Auth + admin-role guards; BASE_URL history; /settings, /logs, /config
  plugins/          # Vuetify
```

### Ownership Boundaries

| Layer | Owns |
|-------|------|
| **This SPA** | Admin journey pages: `/config` (hamburger Settings / packaged AdminPage), `/settings` (Products / Discounts detail), `/logs`; page state; Setting / ExternalEvent / Config API client; `SettingsTableEditor` presentation |
| **`spa_utils` 1.0.3** | Auth/JWT bootstrap, IdP redirect, `PageFrame` chrome (JWT `display_name` next to the avatar as `nav-profile-name-display` when present; no fallback to `name` / `given_name` / `email` / `user_id` / `sub`), role-gated hamburger catalog (Home, Resources, Paths for any authenticated user; Plans **mentor**; Notifications, Events, and Settings **admin-only**), `buildJourneyUrl` / `hostingConfigHref` / ALB origin rules, typed editors used inside the table |
| **Discovery SPA** | Products collection browsing (`/discovery/products`); this SPA must not host a Products list |
| **nginx (this container)** | `/admin/` document prefix, SPA history fallback, `/admin/api/` → `admin_api`, dual runtime-config paths, cache headers |
| **Admin API** | Authorization enforcement (`admin` role), Setting mutations, ExternalEvent reads, webhook ingress (never under `/admin/`) |

Uses `@mentor-forge/mentorhub_spa_utils` **1.0.3** `PageFrame` as the navigation shell. Local nav config is disallowed — do not pass `navItems`, URL maps, or ALB origins. Cross-SPA drawer hrefs are absolute welcome/ALB `:8080` URLs from `buildJourneyUrl`, never direct debug ports (`:8390`, etc.). Hamburger **Settings** uses `hostingConfigHref()` → `{origin}/admin/config` on this SPA; Products / Customer / Customer Members are **not** drawer rows. `/admin/settings` is the Products / Discounts **detail** page only — it is not the `nav-settings-link` destination. PageFrame chrome `nav-profile-name-display` is owned by spa_utils 1.0.3 and shows JWT `display_name` only — this SPA does not map a local display name.

### Deployment Prefix & Runtime Config Invariants

- Browser document and assets load under `/admin/` (Vite `base` + nginx rewrite onto a flat dist root).
- HTML and `/admin/runtime-config.js` / `/runtime-config.js` are `Cache-Control: no-store` (never `immutable`).
- Fingerprinted `/admin/assets/*` may be `public, immutable`.
- `location ^~ /admin/api/` wins over the static-asset regex so `/admin/api/*.js` cannot be cached as an asset.
- Prefixed and root `runtime-config.js` serve the **same** container-generated file for this image. The Admin SPA must not silently consume another journey's runtime config; the HTML shell must request `/admin/runtime-config.js`.
- Runtime config is injected at container start from compose `IDP_LOGIN_URI` — it is not baked into the immutable build artifact.
- Webhook ingress (Stripe/Cognito) is served on Admin API directly and is **never** exposed under `/admin/`.

### Admin Config, Settings & Logs Features

- **Config (`/admin/config`)**: Packaged spa_utils `AdminPage` (Token claims, Config Items, Versions, Enumerators) fed by `GET /admin/api/config`. Admin role required. This is the hamburger **Settings** destination (`hostingConfigHref()`). Token-tab `display_name` (`admin-token-display-name-display`) and the other claim ids (`admin-token-profile-id-display`, etc.) are owned by spa_utils 1.0.3 `TokenClaimsCard`; missing string claims display `N/A`. This SPA does not invent a local display-name mapping.
- **Settings (`/admin/settings`)**: Tabbed **Products** and **Discounts** tables via local `SettingsTableEditor` (harvest-compatible prop contract; cells use spa_utils `SentenceEditor` / `WordEditor` / `CountEditor` / `DateTimeEditor`). Soft-delete archives (`status: 'archived'` Products, `status: 'inactive'` Discounts). Active tab syncs with `?tab=products|discounts`. Journey-specific detail page — not the hamburger Settings target.
- **Logs (`/admin/logs`)**: Read-only external-event ingress audit, newest first, provider filter (`All` / `Cognito` / `Stripe`) via `?source=`, expandable JSON detail, offset/size "Load More".

### Harvest Candidate (keep local until second consumer)

`SettingsTableEditor` is journey-independent spreadsheet chrome built to the spa_utils harvest contract (callback-driven, no hard-coded domain URLs, spa_utils cell editors). Keep it local until a second SPA needs the same control; then harvest per the spa_utils README harvest rule. Do not invent a parallel prop API that would block promotion.

## Testing

### Unit Tests
- Vitest; coverage targets per SPA standards
- Covers API client, composables, `SettingsTableEditor`, Settings / Logs page logic

### E2E Tests
- Cypress against the packaged SPA on `http://localhost:8390` (`npm run service` must be running; do not run `npm run dev` at the same time)
- Prefer `cy.visitPrefixed(...)` over raw `cy.visit` for in-app routes — it asserts `PerformanceNavigationTiming` so a Vue Router rewrite cannot mask an un-prefixed document fetch
- Specs cover Settings / Logs workflows, spa_utils `PageFrame` chrome (this SPA’s `/admin/config` Settings host and admin gate), Token-tab / chrome `display_name` from spa_utils **1.0.3** (`admin-token-display-name-display`, `nav-profile-name-display`), and the nginx deployment boundary (`deployment.cy.ts`: redirects, history fallback, cache headers, dual runtime-config, authenticated admin and least-privilege `/admin/api` proxy). Hamburger catalog role gates are tested in spa_utils, not here.
- UI role gating is UX; API authorization is proven separately via Bearer requests through `/admin/api/`
- `chromeWebSecurity: false` is required so Cypress can observe the role-guard's cross-origin `location.replace` to welcome `:8080/discovery/` (localStorage does not cross `:8390` → `:8080`)

## Automation Support

Cypress targets spa_utils `PageFrame` ids for chrome, not local ones. Hamburger catalog
role gates and collection hrefs are tested in spa_utils — this SPA only asserts host chrome
and routes:

- Always present when an authenticated user can remain on this SPA: `nav-drawer-toggle`, `page-frame-title`, `nav-profile-link`
- spa_utils **1.0.3** ids this host asserts (not local `nav-*` ids):
  - Token tab `admin-token-display-name-display` — config intercept `token.display_name`; missing claim renders `N/A` (no `name` / `given_name` / `email` fallback)
  - PageFrame chrome `nav-profile-name-display` inside `nav-profile-link` — JWT `display_name` next to the avatar; omitted when the claim is blank or missing
- This SPA hosts Settings at `/admin/config` (`nav-settings-link`, admin-only; `/admin/settings` is the Products / Discounts detail page, not this link)

Do not define host `nav-*` ids in this SPA. Page-level ids follow `{domain}-{page}-{element}` (`admin-settings-*`, `admin-logs-*`, `admin-config-page`).

## CI

`.github/workflows/docker-push.yml` builds and pushes `ghcr.io/mentor-forge/mentorhub_admin_spa:latest`.

## Configuration
- **Supported browser entry**: `http://<host>:8080/admin/` via Developer Edition welcome / ALB
- **Direct-port debugging only**: `http://localhost:8390/admin/`; `http://localhost:8390/` and `/admin` redirect to `/admin/`
- **API proxy**: client calls `/admin/api/` (derived from Vite `base`); container nginx proxies to `http://${API_HOST}:${API_PORT}/api/` on `admin_api` (**8389**). Direct-port `/api/` kept for debugging
- Runtime enumerators come from `GET /admin/api/config`, not OpenAPI
- Container uses `API_HOST`, `API_PORT`, and `IDP_LOGIN_URI` at startup; same image every environment
