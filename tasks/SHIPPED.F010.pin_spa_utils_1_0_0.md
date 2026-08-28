# F010 – Pin `@mentor-forge/mentorhub_spa_utils@1.0.0`

**Status**: Shipped  
**Type**: Feature  
**Depends On**: _(none — first task in this wave)_  
**Description**: This repo owns the Admin SPA **1.0.0 pin** (issue F-AS02). Bump `@mentor-forge/mentorhub_spa_utils` from `^0.5.7` to exact **`1.0.0`**, refresh the lockfile from CodeArtifact, and fix any compile/test breakage caused by APIs removed in 1.0.0. Do not adopt `PageFrame`, do not change routes, and do not touch the `/admin/` base path in this task.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — install pin **1.0.0**; **Removed in 1.0.0**: `useInfiniteScroll`, `InfiniteScrollResponse`, `InfiniteScrollParams`, `UseInfiniteScrollOptions`; cursor fields `after_id` / `limit` / `has_more` / `next_cursor` must not appear in SPA ↔ API contracts
- `README.md` — currently documents spa_utils **0.5.x**
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `package.json` / `package-lock.json` — currently `"@mentor-forge/mentorhub_spa_utils": "^0.5.7"` (caret range, not an exact pin)
- `src/composables/useAuth.ts`, `src/composables/useRoles.ts`, `src/composables/useConfig.ts`, `src/api/client.ts`, `src/pages/AdminPage.vue`, `src/App.vue` — current spa_utils consumers

**External prerequisite**: `@mentor-forge/mentorhub_spa_utils@1.0.0` must be **published to CodeArtifact**. Run `mh`, then `npm view @mentor-forge/mentorhub_spa_utils version`. If **1.0.0** is not available, set this task **Status** to `Blocked`, rename the file to `BLOCKED.F010.pin_spa_utils_1_0_0.md`, and stop — do not stay on a `0.5.x` caret range and do not point `package.json` at a git URL.

### Wave ordering (why the pin and `PageFrame` come before the `/admin/` base path)

The two source issues are **F-AS01** (Vite `base` + SPA nginx prefix `/admin/`) and **F-AS02** (pin 1.0.0 + adopt `PageFrame`). This plan runs the **1.0.0 pin (F010)** and **`PageFrame` adoption (F011)** *before* the base-path work (F012–F013) on purpose:

- `src/App.vue` owns the local app bar, drawer, and logout `returnTo`. Making that local chrome base-aware and then deleting it in the `PageFrame` task would be pure re-work.
- `src/pages/HomePage.vue` and the `/home` route are removed by F011. Renaming and re-prefixing routes that are about to be deleted is re-work.
- The role-gate fallback needs `buildJourneyUrl` from spa_utils **1.0.0**, so the pin must land before the router is restructured.
- `PageFrame` drawer links are absolute welcome/ALB URLs (`http://<host>:8080/admin/settings`), so they are unaffected by the order — they are already correct before this SPA's nginx serves the prefix, and they start working when F013 ships.

F-AS01 only requires the base-path work to be **planned or shipped** as a prerequisite for F-AS02; planning satisfies it. F012 and F013 in this folder implement F-AS01 in full.

## Goals

- `package.json` pins `"@mentor-forge/mentorhub_spa_utils": "1.0.0"` (exact semver, no caret) per SPA dependency-management standards.
- `package-lock.json` resolves `1.0.0` from the CodeArtifact registry after `mh` and `npm install --include=dev`.
- `npm ls @mentor-forge/mentorhub_spa_utils` reports `1.0.0`.
- No source file imports `useInfiniteScroll` or any `InfiniteScroll*` type (a grep confirms this; the current shell is not expected to use them).
- No SPA ↔ API contract in `src/api/**` uses `after_id`, `limit`, `has_more`, or `next_cursor`. List pagination stays on **offset/size request headers** with a plain JSON array body.
- Existing behavior is unchanged: `initAuth` / `bootstrapAuthFromUrl`, router guards with `useAuth` / `hasStoredRole` / `redirectToIdpLogin`, `AdminPage` on the `/admin` route, and the local app bar / drawer / logout in `src/App.vue` all still work exactly as they do today.
- `README.md` dependency note says spa_utils **1.0.0** instead of **0.5.x**.
- Do **not** wrap `PageFrame` (F011), do **not** add `provideEditorConfig` (F011), do **not** change Vite `base`, the router, `nginx.conf.template`, or `src/api/client.ts`.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `mh` (CodeArtifact auth) then `npm install --include=dev`
- `npm ls @mentor-forge/mentorhub_spa_utils` — confirm `1.0.0`
- `npm run lint`
- `npm run test`
- `npm run build`

Packaging verification is **not** required for this task: no nginx, Dockerfile, or route change is in scope, and this repo has no Cypress harness yet (added in F018). If the pin breaks the build, fix the imports here rather than deferring.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `package.json` — exact `1.0.0` pin
- `package-lock.json` — resolved `1.0.0` from CodeArtifact
- `README.md` — spa_utils version note (`0.5.x` → `1.0.0`)
- Any `src/**` file that fails to compile or test against `1.0.0` (no infinite-scroll APIs expected)

Do not change `src/App.vue` chrome, `src/router/index.ts`, `vite.config.ts`, `nginx.conf.template`, `Dockerfile`, or `src/api/client.ts` in this task.

## Execution Notes

### Plan
1. Update `package.json` with exact pin `"@mentor-forge/mentorhub_spa_utils": "1.0.0"`.
2. Run `npm install --include=dev` to update `package-lock.json`.
3. Verify `npm ls @mentor-forge/mentorhub_spa_utils` returns `1.0.0`.
4. Update `README.md` reference to spa_utils 1.0.0.
5. Run lint, tests, and build.

### Summary & Test Results
- Pinned `@mentor-forge/mentorhub_spa_utils` to exact `1.0.0` in `package.json`.
- Refreshed `package-lock.json` with `npm install --include=dev`.
- `npm ls @mentor-forge/mentorhub_spa_utils` confirms `1.0.0`.
- Verified no `useInfiniteScroll` or `InfiniteScroll*` APIs are used in `src/`.
- Updated `README.md` to reference `1.0.0`.
- `npm run lint` passed with 0 errors.
- `npm run test` passed (25/25 tests across 5 test files).
- `npm run build` passed cleanly.
