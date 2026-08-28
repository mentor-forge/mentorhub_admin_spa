# F016 – `/admin/settings` tabbed page: Products and Discounts editors

**Status**: Pending  
**Type**: Feature  
**Depends On**: `F015_settings_table_editor_component`  
**Description**: Fill in the `/settings` placeholder with a two-tab page (Products, Discounts) where each tab is a spreadsheet-style editor over the active `Setting` documents of that variant: inline editing, a per-row delete, and an Add button. This is the page the universal spa_utils drawer targets at `/admin/settings`.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — **Automation IDs**, **Data Management** (TanStack Query keys, mutations invalidate related queries, no state duplication)
- `../mentorhub_spa_utils/README.md` — **Universal PageFrame (1.0.0)** (`JOURNEY_APP_PATHS.settings` is `{ journey: 'admin', path: 'settings' }`), **Type-aligned editors**
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `src/pages/SettingsPage.vue` — F012 placeholder carrying `data-automation-id="admin-settings-page"`
- `src/components/SettingsTableEditor.vue` — F015 component and its column-descriptor type
- `src/composables/useSettings.ts` — F014 `useProductSettings` / `useDiscountSettings`, create / update / archive mutations (soft delete)
- `src/api/types.ts` — F014 `ProductSetting` / `DiscountSetting` shapes and narrowing helpers
- `src/router/index.ts` — F012 already routes `/` → `/settings` and `/settings` → `SettingsPage.vue` with `requiresAuth` + `requiresRole: 'admin'`; do not change route paths here

The page renders **inside** `PageFrame` (the app bar title stays `Admin`), so this page must not add an app bar, drawer, or logout control.

**Soft delete only.** The Admin API has no `DELETE /api/setting/{id}`. The row delete button archives: Product `status: 'archived'`, Discount `status: 'inactive'`. Because `GET /api/setting` has no status filter, "active only" filtering happens in `useSettings` (F014) — the page shows what the composable returns.

## Goals

- `src/pages/SettingsPage.vue` keeps `data-automation-id="admin-settings-page"` and renders a Vuetify tab strip plus tab windows:
  - tabs `admin-settings-products-tab` and `admin-settings-discounts-tab` inside `admin-settings-tabs`,
  - Products is the default selected tab,
  - the selected tab is reflected in the URL as a query parameter (`?tab=products` / `?tab=discounts`) and restored on load, so a deep link and a browser refresh keep the operator in place; the route **path** stays `/settings`.
- The Products tab renders `SettingsTableEditor` with `automation-id-prefix="admin-products"` and columns, in order: `name` (sentence), `subscription` (word), `description` (sentence), `unit_price` (count), `minimum_members` (count), `stripe_price_id` (sentence).
- The Discounts tab renders `SettingsTableEditor` with `automation-id-prefix="admin-discounts"` and columns, in order: `name` (sentence), `code` (word), `description` (sentence), `free_encounters` (count), `max_redemptions` (count), `expires_at` (date-time).
- Rows come from `useProductSettings()` / `useDiscountSettings()` (active documents, sorted by `name` ascending via the API `sort_by` default). No local copy of server state.
- Cell save calls the F014 update mutation with a single-field `SettingUpdate` patch for that row's `_id`; on success the matching query is invalidated. `_id`, `type`, `status`, `created`, and `saved` are never editable in a cell.
- Add creates a row immediately through the F014 create mutation so the row has an `_id` and can be edited inline:
  - Product: `{ type: 'Product', name: 'New Product', subscription: <unique placeholder>, status: 'active' }`,
  - Discount: `{ type: 'Discount', name: 'New Discount', code: <unique placeholder>, status: 'active' }`,
  - placeholders for `subscription` / `code` must be unique per click and satisfy the API's no-whitespace 1–40 character pattern, so repeated Add clicks cannot collide,
  - after a successful create the list refreshes and the new row is visible without a manual reload.
- Delete calls the F014 archive mutation for the row's variant after the component's confirmation step; the row disappears from the active list on invalidate.
- Loading and error state: the tab passes the query's loading flag and a human-readable message (from `ApiError`) into the component's `isLoading` / `errorMessage` props. A failed create, save, or delete shows the message and does not clear the operator's other rows.
- `src/pages/SettingsPage.test.ts` covers, with the table component and composables mocked: both tabs register with the expected automation ids, Products renders first, tab selection round-trips through the query parameter, each tab passes its own prefix and column list, save/add/delete handlers call the corresponding mutation with the right payload (including the Product-vs-Discount status value for delete), and error / loading props are forwarded.
- `README.md` documents the Settings page: two tabs, inline spreadsheet editing with save-on-blur, Add, and soft-delete semantics (archived / inactive rather than a hard delete).
- Do not change `src/router/index.ts` paths, `src/App.vue`, `src/components/SettingsTableEditor.vue`, `src/api/**`, `nginx.conf.template`, or the `Dockerfile`.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run lint`
- `npm run test`
- `npm run build`
- With `npm run api` and `npm run dev`, open `http://localhost:8390/admin/settings` in the browser:
  - confirm the two tabs render and toggle,
  - confirm the Products tab renders catalog rows, allows cell editing, adds a new row, and archives a row on delete,
  - confirm the Discounts tab allows the same for discounts,
  - confirm `http://localhost:8390/admin/settings?tab=discounts` opens with the Discounts tab active.

## Execution Notes

### Plan
1. Update `src/pages/SettingsPage.vue` with `v-tabs`, `v-window`, active tab syncing with `route.query.tab`, Products table with `SettingsTableEditor`, and Discounts table with `SettingsTableEditor`.
2. Connect `useProductSettings`, `useDiscountSettings`, `useCreateSetting`, `useUpdateSettingField`, `useArchiveSetting`.
3. Create `src/pages/SettingsPage.test.ts` testing tab switching, router query sync, Add Product, Add Discount, cell saving, and archive deletion.
4. Run lint, unit tests, and build.

### Summary & Test Results
- Implemented `src/pages/SettingsPage.vue` with full `v-tabs` & `v-window` setup, bidirectional URL query `?tab=products|discounts` synchronization, and specialized `SettingsTableEditor` tables for Products (`admin-products`) and Discounts (`admin-discounts`).
- Wired TanStack Query queries & mutations (`useProductSettings`, `useDiscountSettings`, `useCreateSetting`, `useUpdateSettingField`, `useArchiveSetting`), soft-delete semantics, and non-blocking snackbar notifications for error handling.
- Created `src/pages/SettingsPage.test.ts` with 8 unit tests covering tab initialization, route query sync, Add Product / Add Discount mutation triggers, cell editing mutations, soft-archive deletion, and error alerts.
- `npm run lint` passed with 0 errors.
- `npm run test` (61/61) and `npm run test:coverage` passed.
- `npm run build` passed cleanly.
