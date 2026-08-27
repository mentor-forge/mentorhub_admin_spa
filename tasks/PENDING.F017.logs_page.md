# F017 – `/admin/logs` external-event list, most recent first, filterable by source

**Status**: Pending  
**Type**: Feature  
**Depends On**: `F016_settings_tabs_page`  
**Description**: Fill in the `/logs` placeholder with a read-only list of `ExternalEvent` ingress records ordered newest first, with a source filter (All / Cognito / Stripe) and access to each record's normalized payload.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — **Automation IDs**, **Data Management**
- `../mentorhub_spa_utils/README.md` — `formatDate` utility; **Removed in 1.0.0**: no infinite scroll, no cursor fields — lists use offset/size headers with a plain JSON array body
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `src/pages/LogsPage.vue` — F012 placeholder carrying `data-automation-id="admin-logs-page"`
- `src/composables/useExternalEvents.ts` — F014 query keyed `['external-events', { source }]`, `sort_by=created.at_time`, `order=desc`, reactive `all` | `cognito` | `stripe` filter
- `src/api/types.ts` — F014 `ExternalEvent` (`_id`, `source`, `external_id`, `payload_hash`, `normalized_body`, `created`)
- `src/router/index.ts` — F012 already routes `/logs` → `LogsPage.vue` with `requiresAuth` + `requiresRole: 'admin'`; do not change route paths here

Ingress records are append-only audit rows: the page is **read-only** — no create, edit, or delete controls, and no reuse of `SettingsTableEditor`.

The API returns arrays paged by `offset` / `size` **request headers** (default size 20, maximum 100). Do not introduce `after_id`, `limit`, `has_more`, or `next_cursor`, and do not add infinite scroll.

## Goals

- `src/pages/LogsPage.vue` keeps `data-automation-id="admin-logs-page"` and renders, inside `PageFrame` (no local app bar):
  - a source filter control `admin-logs-source-select` with options **All**, **Cognito**, **Stripe**, defaulting to All; the selection is reflected in the URL as `?source=stripe` and restored on load,
  - a dense table (`admin-logs-table`) with one row per event (`admin-logs-row`) showing received time (`admin-logs-time-display`, formatted with the spa_utils `formatDate` from `created.at_time`), source (`admin-logs-source-display`), external id (`admin-logs-external-id-display`), and the recording user (`admin-logs-user-display`, from `created.by_user`),
  - a per-row expand control (`admin-logs-detail-toggle`) revealing the record's `normalized_body` as formatted, read-only JSON (`admin-logs-detail-display`) plus `payload_hash` and `created.correlation_id`,
  - an empty state (`admin-logs-empty`), a loading indicator, and an error message (`admin-logs-error`) fed from `ApiError`.
- Ordering is **most recent first** and comes from the API (`sort_by=created.at_time`, `order=desc`); the page does not re-sort client-side.
- Changing the source filter re-queries through the composable (new query key) rather than filtering an existing array in the page.
- Paging uses offset/size headers: the page requests a first page and offers an explicit "Load more" / next-page control (`admin-logs-load-more-button`) that advances the offset and appends results. Hide or disable the control when a returned page is shorter than the requested size. No scroll-triggered loading.
- Long `external_id` and hash values truncate visually without breaking the row layout, and the JSON detail area scrolls rather than expanding the page arbitrarily.
- `src/pages/LogsPage.test.ts` covers, with the composable mocked: rows render from events, the filter control defaults to All and round-trips through the query parameter, selecting a source passes it to the composable, the detail toggle reveals normalized payload content, load-more advances the offset, and empty / loading / error states render their ids.
- `README.md` documents the Logs page: read-only ingress audit list, newest first, source filter, offset/size paging.
- Do not change `src/router/index.ts` paths, `src/App.vue`, `src/components/**`, `src/api/**`, `nginx.conf.template`, or the `Dockerfile`.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run api` then `npm run dev` — manual verification at `http://localhost:8390/admin/logs` with an admin login:
  - events render newest first with a readable timestamp
  - selecting **Stripe** shows only Stripe rows, **Cognito** only Cognito rows, and **All** restores the full list
  - `?source=cognito` deep-links to the filtered view
  - the row detail toggle shows the normalized payload
  - load-more requests the next offset and appends rows without duplicating the first page
  - if the local database has no ingress records, the empty state renders (record this in Execution Notes rather than seeding another repo's data)
  - a non-admin login is redirected out to the Discovery journey home

Cypress coverage and packaging verification are **F018**.

## Outputs

Paths are relative to **this SPA repository root**.

**Create:**

- `src/pages/LogsPage.test.ts`

**Update:**

- `src/pages/LogsPage.vue` — filterable, read-only external-event list
- `README.md` — Logs page behavior

## Execution Notes

_Reserved for the task execution agent: plan, commands run, test results, follow-ups._
