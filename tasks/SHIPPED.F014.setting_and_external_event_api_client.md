# F014 – Setting and ExternalEvent API client, types, and query layer

**Status**: Shipped  
**Type**: Feature  
**Depends On**: `F013_nginx_admin_prefix_and_api_client`  
**Description**: Add the typed client surface the Settings and Logs pages need: list / create / update of polymorphic `Setting` documents (Product and Discount variants) and list of `ExternalEvent` ingress records with source filtering. Client and types only — no pages, components, or routes in this task.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — TanStack Query keys `['resource', id]` / `['resources', filters]`; mutations invalidate related queries; coverage targets (API client 90% lines / 90% functions / 75% branches)
- `../mentorhub_spa_utils/README.md` — **Removed: infinite-scroll list APIs (Removed in 1.0.0)**: no `after_id` / `limit` / `has_more` / `next_cursor`; lists use **offset/size request headers** with a plain JSON array body
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `src/api/client.ts` — F013 base-derived `/admin/api`, bearer token, `401` → logout + IdP redirect, `204` / empty-body handling
- `src/api/types.ts` / `src/api/types.test.ts` — currently only `Error` and `ConfigResponse`
- `src/api/client.test.ts` — existing fetch-mock patterns to extend

### Definitive contract — fetch from the running API

Per `tasks/_PLANNING.md`, the definitive OpenAPI specification comes from the **running Admin API**, not from files in another repository. Start the API and fetch the spec before writing types:

```bash
npm run api
curl -X GET "http://localhost:8389/docs/openapi.yaml"
```

**Expected surface** (verify against the fetched spec; if it differs, follow the spec and record the difference in Execution Notes):

- `GET /api/setting` — query `type` (`Product` | `Discount`), `type[in_list]`, `sort_by` (`name` | `type` | `created.at_time`, default `name`), `order` (`asc` | `desc`, default `asc`); `offset` / `size` **request headers**; returns a JSON array of `Setting`.
- `POST /api/setting` — creates a `ProductSettingCreate` (required `type`, `subscription`, `name`) or `DiscountSettingCreate` (required `type`, `code`, `name`); returns the created `Setting` with `201`.
- `GET /api/setting/{setting_id}` — single `Setting` by 24-hex ObjectId.
- `PATCH /api/setting/{setting_id}` — `SettingUpdate` with mutable fields only (`name`, `description`, `unit_price`, `minimum_members`, `stripe_price_id`, `code`, `free_encounters`, `max_redemptions`, `expires_at`, `status`); returns the updated `Setting`.
- `GET /api/external-event` — query `source` (`cognito` | `stripe`), `sort_by` (`source` | `created.at_time`, default `created.at_time`), `order` (default `desc`); `offset` / `size` **request headers**; returns a JSON array of `ExternalEvent`.

**There is no `DELETE /api/setting/{setting_id}`.** Row deletion in the UI is a **soft delete** performed with `PATCH` on `status`: Product → `archived`, Discount → `inactive`. Also note that `GET /api/setting` has **no `status` filter**, so "active only" is a client-side filter.

Field shapes to model (from the same spec): `ProductSetting` = `_id`, `type: 'Product'`, `subscription`, `name`, `description`, `unit_price`, `minimum_members`, `stripe_price_id`, `status: 'active' | 'archived'`, `created`, `saved`. `DiscountSetting` = `_id`, `type: 'Discount'`, `code`, `name`, `description`, `free_encounters`, `max_redemptions`, `expires_at`, `status: 'active' | 'inactive'`, `created`, `saved`. `ExternalEvent` = `_id`, `source: 'cognito' | 'stripe'`, `external_id`, `payload_hash`, `normalized_body`, `created`. Both `created` and `saved` are `Breadcrumb` (`at_time`, `by_user`, `correlation_id`, `from_ip`).

## Goals

- `src/api/types.ts` adds discriminated-union types: `Breadcrumb`, `ProductSetting`, `DiscountSetting`, `Setting` (union discriminated on `type`), `ProductSettingCreate`, `DiscountSettingCreate`, `SettingCreate`, `SettingUpdate`, `ExternalEvent`, and the `SettingStatus` / `ExternalEventSource` literal unions. Types mirror the fetched spec; no cursor fields anywhere.
- Narrowing helpers (`isProductSetting`, `isDiscountSetting`) live with the types so pages never cast.
- `src/api/client.ts` gains, using the existing `request` helper and the F013 prefixed base:
  - `listSettings(params?: { type?; typeIn?; sortBy?; order?; offset?; size? })` — query string for filters/sort, `offset` / `size` as **request headers**, returns `Setting[]`.
  - `createSetting(body: SettingCreate): Promise<Setting>`.
  - `getSetting(id: string): Promise<Setting>`.
  - `updateSetting(id: string, body: SettingUpdate): Promise<Setting>` (HTTP `PATCH`).
  - `listExternalEvents(params?: { source?; sortBy?; order?; offset?; size? })` — same header/query rules, returns `ExternalEvent[]`.
  - Optional-parameter handling omits unset query keys entirely (no `?type=undefined`).
- A composable `src/composables/useSettings.ts` wraps TanStack Query for the pages:
  - `useProductSettings()` / `useDiscountSettings()` — queries keyed `['settings', { type: 'Product' }]` / `['settings', { type: 'Discount' }]`, exposing only **active** rows (Product `status !== 'archived'`, Discount `status === 'active'`) since the API has no status filter,
  - `createSetting`, `updateSettingField`, and `archiveSetting` mutations that invalidate the matching `['settings', …]` key on success,
  - `archiveSetting` implements the soft delete (`status: 'archived'` for Product, `'inactive'` for Discount) — there is no hard delete.
- A composable `src/composables/useExternalEvents.ts` wraps the log query: keyed `['external-events', { source }]`, `sort_by=created.at_time`, `order=desc` (most recent first), with a reactive `source` filter of `all` | `cognito` | `stripe` where `all` omits the parameter.
- Errors surface as the existing `ApiError` so pages can show a message; no page-level error UI in this task.
- Unit tests cover the new client methods and composables against mocked `fetch` / mocked client, including: header-based `offset` / `size`, omitted optional query keys, `PATCH` verb and body for update, soft-delete status per variant, active-only filtering, descending log order, and `source` filter pass-through. Meet the standards' coverage thresholds for `src/api/**` and `src/composables/**`.
- Do not create or modify pages, routes, components, `vite.config.ts`, `nginx.conf.template`, or the `Dockerfile`.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run api` and `curl http://localhost:8389/docs/openapi.yaml` — confirm the contract above before coding; record any deviation in Execution Notes
- `npm run lint`
- `npm run test`
- `npm run test:coverage` — `src/api/**` and `src/composables/**` meet the configured thresholds
- `npm run build`
- With `npm run api` running, `npm run dev` and exercise the client from the browser console (or a temporary scratch call that is not committed) to confirm `GET /admin/api/setting` and `GET /admin/api/external-event` return arrays for an admin JWT

Packaging and Cypress verification are **F018**.

## Outputs

Paths are relative to **this SPA repository root**.

**Create:**

- `src/composables/useSettings.ts`
- `src/composables/useSettings.test.ts`
- `src/composables/useExternalEvents.ts`
- `src/composables/useExternalEvents.test.ts`

**Update:**

- `src/api/types.ts` — Setting / ExternalEvent / Breadcrumb types and narrowing helpers
- `src/api/types.test.ts` — narrowing-helper coverage
- `src/api/client.ts` — setting and external-event methods
- `src/api/client.test.ts` — new method coverage
- `README.md` — Architecture Overview notes the API surface consumed (`setting`, `external-event`, `config`)

## Execution Notes

### Plan
1. Verified OpenAPI spec from running API (`http://localhost:8389/docs/openapi.yaml`).
2. Update `src/api/types.ts` with `Breadcrumb`, `ProductSetting`, `DiscountSetting`, `Setting`, create/update types, and narrowing helpers (`isProductSetting`, `isDiscountSetting`).
3. Add unit tests for narrowing helpers in `src/api/types.test.ts`.
4. Update `src/api/client.ts` with `listSettings`, `createSetting`, `getSetting`, `updateSetting`, `listExternalEvents`, pagination headers, and query parameter handling.
5. Create `src/composables/useSettings.ts` with TanStack Query hooks (`useProductSettings`, `useDiscountSettings`, `useCreateSetting`, `useUpdateSettingField`, `useArchiveSetting`).
6. Create `src/composables/useExternalEvents.ts` with TanStack Query hook `useExternalEvents`.
7. Add comprehensive unit tests in `src/api/client.test.ts`, `src/composables/useSettings.test.ts`, and `src/composables/useExternalEvents.test.ts`.
8. Update `README.md` to note consumed API surface.
9. Run lint, test:coverage, and build.

### Summary & Test Results
- Added full OpenAPI model types (`ProductSetting`, `DiscountSetting`, `Setting`, `ExternalEvent`, `Breadcrumb`, create/update types) and narrowing helpers (`isProductSetting`, `isDiscountSetting`) to `src/api/types.ts`.
- Added `listSettings`, `createSetting`, `getSetting`, `updateSetting`, and `listExternalEvents` methods to `src/api/client.ts` with offset/size headers and query param formatting.
- Created `src/composables/useSettings.ts` with active-only filters (`useProductSettings`, `useDiscountSettings`), mutations for create, field update, and variant-aware soft delete archiving.
- Created `src/composables/useExternalEvents.ts` with reactive source filtering, default `created.at_time` descending order, and pagination support.
- Unit tests written and verified in `src/api/types.test.ts`, `src/api/client.test.ts`, `src/composables/useSettings.test.ts`, `src/composables/useExternalEvents.test.ts`.
- Updated `README.md` architecture section.
- `npm run lint` passed with 0 errors.
- `npm run test:coverage` passed with 45/45 tests; Coverage exceeded standards:
  - `src/api/**`: 100% lines, 100% functions, 97.29% branches.
  - `src/composables/**`: 98.37% lines, 100% functions, 75.34% branches.
- `npm run build` passed cleanly.
