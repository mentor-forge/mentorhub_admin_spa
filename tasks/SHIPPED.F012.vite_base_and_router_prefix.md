# F012 – Vite `base` `/admin/`, router `BASE_URL`, and the three-route table

**Status**: Shipped  
**Type**: Feature  
**Depends On**: `F011_adopt_page_frame`  
**Description**: Mount the app at Vite `base: '/admin/'` with `createWebHistory(import.meta.env.BASE_URL)` so browser URLs are `/admin/...` and never `/admin/admin/...`. Establish the final route table for this SPA (`/config`, `/settings`, `/logs`) with thin placeholder pages for Settings and Logs, add base-aware runtime-config injection, and add a prefixed dev proxy. Do not change `nginx.conf.template`, the `Dockerfile`, or `src/api/client.ts` in this task.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — container runtime config: load the generated `runtime-config.js` from `index.html` **before** the app bundle via a Vite `transformIndexHtml` plugin
- `../mentorhub_spa_utils/README.md` — IdP login URL resolution order (`window.__MENTORHUB_RUNTIME__.IDP_LOGIN_URI` → `VITE_IDP_LOGIN_URI` → fallback)
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `tasks/PENDING.F010.pin_spa_utils_1_0_0.md` — wave-ordering rationale
- `vite.config.ts` — today: no `base`, no runtime-config inject, `server.port` 8390, `server.proxy` `/api` → `http://localhost:8389`
- `src/router/index.ts` — after F011: `/` → redirect `/admin`, `/admin` (AdminPage, `requiresRole: 'admin'`); no `/home`
- `src/pages/AdminPage.vue` — wraps the shared spa_utils `AdminPage` with the `/api/config` query
- `index.html` — Vite entry; `<link rel="icon" href="/vite.svg">` and `/src/main.ts` (asset URLs follow `base` automatically)
- `src/App.vue` — after F011 this is `v-app` → `PageFrame` → `router-view` with no local logout URL to make base-aware

**External prerequisite**: Developer Edition welcome nginx (mentorhub L022) already forwards the **full** URI `http://<host>:8080/admin/` to this container with `X-Forwarded-Prefix: /admin`, and compose passes `IDP_LOGIN_URI` to the `admin_spa` service. Do not change welcome nginx, the cloud ALB, or CloudFormation. Direct port **8390** stays published.

**Locked route decisions** (three browser routes plus the shared admin page):

| Browser URL | Vue path | Page |
|---|---|---|
| `http://<host>:8080/admin/` | `/` | redirect to `/settings` |
| `http://<host>:8080/admin/settings` | `/settings` | tabbed Products / Discounts editor (F016) |
| `http://<host>:8080/admin/logs` | `/logs` | external-event log list (F017) |
| `http://<host>:8080/admin/config` | `/config` | shared spa_utils `AdminPage` (runtime config viewer) |

**Avoid `/admin/admin`:** with `base: '/admin/'` there must be no Vue route whose path is `/admin`. The shared admin page moves from Vue `/admin` to Vue **`/config`**; `JOURNEY_APP_PATHS.settings` in spa_utils already points the universal drawer at `/admin/settings`.

Admin **webhook ingress** (F-AA01, Stripe/Cognito) is a separate Admin **API** URL and must never be served under this browser prefix.

## Goals

- `vite.config.ts` sets `base: '/admin/'`. There is exactly one base and one build — do not add a second root-only build or profile.
- `src/router/index.ts` uses `createWebHistory(import.meta.env.BASE_URL)` and the route table above:
  - `/` redirects to `/settings`,
  - `/settings` → `src/pages/SettingsPage.vue`, `meta: { requiresAuth: true, requiresRole: 'admin' }`,
  - `/logs` → `src/pages/LogsPage.vue`, same meta,
  - `/config` → `src/pages/AdminPage.vue` (existing wrapper), same meta,
  - no route named or pathed `/admin`, and no `/home`.
- `src/pages/SettingsPage.vue` and `src/pages/LogsPage.vue` are created as **thin placeholders** in this task: a page container carrying the final automation id (`admin-settings-page`, `admin-logs-page`) and a heading. F016 and F017 fill them in; the ids and file names must not change later.
- The unauthenticated guard builds a base-aware IdP return URL so a deep link returns to the prefixed page, e.g. origin + `import.meta.env.BASE_URL` + the route path without its leading slash (`/settings` → `http://<host>:8390/admin/settings`). It must never produce `/admin/admin/...` or drop the prefix.
- Runtime-config injection is added and is **base-aware**:
  - a `transformIndexHtml` (order `pre`) Vite plugin seeds `window.__MENTORHUB_RUNTIME__` and injects `<script src="${base}runtime-config.js">` **before** the module bundle, and rewrites the `vite.svg` icon href to the base,
  - `public/runtime-config.js.template` contains the `envsubst` source assigning `IDP_LOGIN_URI` onto `window.__MENTORHUB_RUNTIME__`,
  - `public/runtime-config.js` is committed as the harmless dev-server placeholder (container startup overwrites the generated copy in F013),
  - `.env.development` sets `VITE_IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` so `npm run dev` keeps working; `IDP_LOGIN_URI` stays `http://<HOST_NAME>:8080/login.html` in the container.
- `server.proxy` gains `'/admin/api'` → `http://localhost:8389` with a rewrite that strips `/admin` so the API still sees `/api/...`, and keeps the existing `/api` proxy for direct-port debugging.
- `README.md` documents that `npm run dev` serves the app at `http://localhost:8390/admin/`, and lists the four in-app URLs from the table above.
- Do not change `nginx.conf.template`, `Dockerfile`, `package.json`, or `src/api/client.ts` — the API client stays on `/api` until F013.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run lint`
- `npm run test` — update any unit test that asserts the old `/admin` route or `/home`
- `npm run build` — then inspect `dist/index.html`: asset, favicon, and `runtime-config.js` URLs all start with `/admin/`; there is no `/admin/admin` anywhere in the generated HTML
- `npm run api` then `npm run dev` — manual check:
  - `http://localhost:8390/admin/` redirects in-app to `http://localhost:8390/admin/settings`
  - `http://localhost:8390/admin/logs` and `http://localhost:8390/admin/config` render (config shows the shared AdminPage with live `/api/config` data)
  - a non-admin login on any of those routes is redirected out to the Discovery journey home
  - the browser network tab shows `runtime-config.js` requested from `/admin/runtime-config.js`

Packaging verification (`npm run container`, `npm run service`) is **F013**, because nginx still serves only `/`. Cypress is **F018**.

## Outputs

Paths are relative to **this SPA repository root**.

**Create:**

- `src/pages/SettingsPage.vue` — placeholder with `data-automation-id="admin-settings-page"`
- `src/pages/LogsPage.vue` — placeholder with `data-automation-id="admin-logs-page"`
- `public/runtime-config.js.template` — `envsubst` source for `IDP_LOGIN_URI`
- `public/runtime-config.js` — dev placeholder
- `.env.development` — `VITE_IDP_LOGIN_URI`

**Update:**

- `vite.config.ts` — `base`, runtime-config inject plugin, `/admin/api` dev proxy
- `src/router/index.ts` — history base, `/`, `/settings`, `/logs`, `/config`; base-aware IdP return URL
- `README.md` — prefixed dev URL and route table

Do not change `nginx.conf.template`, `Dockerfile`, `package.json`, or `src/api/client.ts` in this task.

## Execution Notes

### Plan
1. Create placeholder `src/pages/SettingsPage.vue` and `src/pages/LogsPage.vue`.
2. Create `public/runtime-config.js.template`, `public/runtime-config.js`, and `.env.development`.
3. Update `vite.config.ts` with `base: '/admin/'`, `injectRuntimeConfig` plugin, and `/admin/api` dev proxy.
4. Update `src/router/index.ts` with `createWebHistory(import.meta.env.BASE_URL)` and routes `/settings`, `/logs`, `/config`, redirect `/` -> `/settings`, and base-aware IdP return URL.
5. Update `README.md` with prefixed URL and route table documentation.
6. Verify with lint, unit tests, and build check on `dist/index.html`.

### Summary & Test Results
- Created placeholder `SettingsPage.vue` (`admin-settings-page`) and `LogsPage.vue` (`admin-logs-page`).
- Added `public/runtime-config.js.template`, `public/runtime-config.js`, and `.env.development`.
- Configured Vite `base: '/admin/'`, runtime config HTML transformation plugin, and `/admin/api` dev proxy.
- Updated `src/router/index.ts` to use `createWebHistory(import.meta.env.BASE_URL)` and route table (`/` -> `/settings`, `/settings`, `/logs`, `/config`).
- Base-aware IdP return URL constructed in `router.beforeEach`.
- Updated `README.md` with prefixed dev URLs and route table.
- `npm run lint` passed with 0 errors.
- `npm run test` passed (25/25 tests across 5 test files).
- `npm run build` succeeded; verified `dist/index.html` prefixes all assets, icons, and `runtime-config.js` with `/admin/`.
