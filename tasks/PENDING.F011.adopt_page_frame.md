# F011 – Adopt spa_utils `PageFrame`, remove local chrome and the Home page

**Status**: Pending  
**Type**: Feature  
**Depends On**: `F010_pin_spa_utils_1_0_0`  
**Description**: Replace this SPA's local app bar, navigation drawer, and logout handler with the imported `PageFrame`, and delete the local Home page that duplicates Discovery. Provide runtime editor config at the app root so later Settings tabs can use spa_utils editors without touching `src/App.vue` again. Routes keep their current paths in this task; the `/admin/` base path and route restructure are F012.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — **Universal PageFrame (1.0.0)** (allowed props, compiled role-gated hamburger catalog, "local nav config is disallowed"), **Cross-SPA URLs** (`buildJourneyUrl`, `JOURNEY_APP_PATHS`, `resolveAlbOrigin`), **Runtime enumerators** (`provideEditorConfig`)
- `README.md` — Architecture Overview lists `pages/ HomePage, AdminPage`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `tasks/PENDING.F010.pin_spa_utils_1_0_0.md` — wave-ordering rationale
- `src/App.vue` — local `v-app-bar`, `v-app-bar-nav-icon`, `v-navigation-drawer`, `nav-home-link` / `nav-admin-link` / `nav-logout-link` list items, and `handleLogout`
- `src/pages/HomePage.vue` — local welcome card to be removed
- `src/router/index.ts` — `/` → redirect `/admin`; `/home` (Home); `/admin` (requiresRole `admin`); role-gate fallback `next({ name: 'Home' })`
- `src/composables/useConfig.ts` — app-owned `GET /api/config` startup fetch
- `src/composables/useRoles.ts` — local `hasRole` wrapper (drawer role gating moves into spa_utils)
- `src/main.ts` / `src/initAuth.ts` — IdP bootstrap; keep as today

`PageFrame` is exported from the package **root** and already wraps `v-main`. Drawer rows are absolute `href` values built by `buildJourneyUrl` (other SPAs), not Vue Router `to`. Logout is built into the drawer footer (`nav-logout-link`).

**Allowed props only:** `pageTitle` (required) and optional display-only `customerName`. Do **not** pass `navItems`, URL maps, ALB origin, role tables, or extra drawer slots. The Admin SPA must not re-implement the hamburger catalog.

The compiled catalog already routes admins to **Products** (`/discovery/products`) and **Settings** (`/admin/settings`), so a local Products or Home list page in this SPA would duplicate Discovery.

## Goals

- `src/App.vue` becomes a single host `v-app` wrapping `PageFrame`:

  ```vue
  <v-app>
    <PageFrame page-title="Admin">
      <router-view />
    </PageFrame>
  </v-app>
  ```

  - `pageTitle` is `Admin`. Omit `customerName` and let spa_utils read the JWT claim.
  - Remove the local `v-app-bar`, `v-app-bar-title`, `v-app-bar-nav-icon`, `v-navigation-drawer`, drawer `v-list` items, `drawer` ref, `router.afterEach` drawer close, `handleLogout`, and the local `useRoles` / `hasAdminRole` usage in this component.
- `src/App.vue` keeps the authenticated startup config fetch (`useConfig().loadConfig()` in `onMounted`, guarded by `isAuthenticated`, with the existing `console.warn` on failure) and adds `provideEditorConfig(config)` from spa_utils so type-aligned editors used by F015–F017 resolve runtime enumerators. Do not add a second startup fetch or a second title bar.
- `src/pages/HomePage.vue` is deleted, and the `/home` route is removed from `src/router/index.ts`. Home for every journey is Discovery (`/discovery/`) via the compiled catalog.
- The router role gate no longer targets a local `Home` route. When `requiresRole` is not satisfied, leave the SPA for the Discovery journey home:
  - build the target with `buildJourneyUrl` (or `JOURNEY_APP_PATHS.home`),
  - navigate with `window.location.replace(...)` and call `next(false)`,
  - do not silently render an admin page to a non-admin user.
- The unauthenticated `requiresAuth` guard still calls `redirectToIdpLogin(window.location.origin + to.fullPath)` and `next(false)`; `router.afterEach` still sets `document.title = 'Admin'`. (Base-aware return URLs are F012.)
- Route paths stay `/` → redirect `/admin` and `/admin` (AdminPage) in this task. Do not rename `/admin`, do not add `/settings`, `/logs`, or `/config` yet — that is F012 and F016/F017.
- No local navigation config module is introduced. No `data-automation-id` beginning with `nav-` is defined in this repo; the drawer, title, profile, and logout ids come from spa_utils (`nav-drawer-toggle`, `page-frame-title`, `nav-profile-link`, `nav-products-link`, `nav-settings-link`, `nav-logout-link`).
- `README.md` Architecture Overview and description reflect: `PageFrame` from spa_utils 1.0.0 is the navigation shell, `HomePage` is gone, and Products / catalog lists live on Discovery.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run lint`
- `npm run test` — existing `src/composables/*.test.ts` and `src/api/*.test.ts` still pass. If a unit test references `HomePage` or local drawer markup, update or remove it in this task.
- `npm run build`
- `npm run dev` — manual check at `http://localhost:8390/`: the shared app bar renders with the title `Admin`, the hamburger opens the spa_utils drawer, an admin login shows **Products** and **Settings** rows as absolute `:8080` URLs, and logout leaves via the IdP. There must be no second app bar and no local Home row.

Cypress specs and packaging verification are **F018** (this repo has no Cypress harness yet). Do not leave a unit test asserting `nav-home-link` or `nav-admin-link`.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `src/App.vue` — `PageFrame` shell, `provideEditorConfig`, chrome removed
- `src/router/index.ts` — `/home` route removed; role-gate fallback leaves for Discovery
- `README.md` — PageFrame as nav shell; page list without `HomePage`

**Delete:**

- `src/pages/HomePage.vue`

Do not pass disallowed `PageFrame` props. Do not change `vite.config.ts`, `nginx.conf.template`, `Dockerfile`, `package.json`, or `src/api/client.ts` in this task.

## Execution Notes

_Reserved for the task execution agent: plan, commands run, test results, follow-ups._
