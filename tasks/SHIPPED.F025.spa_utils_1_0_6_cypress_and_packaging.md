# F025 – 1.0.6 Cypress confirmation and packaging

**Status**: Shipped  
**Type**: Feature  
**Depends On**: `F024_pin_spa_utils_1_0_6`  
**Description**: Confirm Cypress still matches spa_utils **1.0.6** editor behavior, and run the packaged SPA as the acceptance gate for the Admin 1.0.6 pin. This SPA has no `MarkdownEditor` consumer. Do not invent one. Do not change the pin.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — E2E covers pages; automation ids are a stable UI API
- `../mentorhub_spa_utils/README.md` — `MarkdownEditor` resting view is sanitized rendered markdown. Editable fields enter the textarea on click or Enter. Textarea automation id is `${automationId}-input`; display is `${automationId}-display`; value node is `markdown-field-display`. `SentenceEditor` / `WordEditor` / `CountEditor` / `DateTimeEditor` still render the input while `editable` (they are not click-to-edit). `DataCardGrid` automation id is the hardcoded `data-card-grid`. `CardGrid` is gone.
- `README.md` — after F024 should name spa_utils **1.0.6**
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `tasks/PENDING.F024.pin_spa_utils_1_0_6.md` (or shipped successor) — pin already done; use Execution Notes if any local layout or import changed
- `cypress.config.ts` — `baseUrl` stays `http://localhost:8390`; `chromeWebSecurity: false` stays
- `cypress/support/e2e.ts` — `registerAuthCommands({ visitPath: '/admin/' })`
- `cypress/support/commands.ts` — `visitPrefixed` only
- `cypress/e2e/settings.cy.ts` — Products / Discounts on `/admin/settings`. Name edits use `.find('input')` inside `admin-products-name-input` and `admin-discounts-name-input`. Those ids are `SentenceEditor` automation ids, already suffixed `-input` by `SettingsTableEditor`. The input is visible without a prior click.
- `cypress/e2e/navigation.cy.ts` — Token tab and PageFrame chrome `display_name` coverage from the 1.0.3/1.0.5 wave; keep
- `cypress/e2e/logs.cy.ts` — `/admin/logs`; keep
- `cypress/e2e/deployment.cy.ts` — nginx prefix / API proxy; keep unless a selector breaks
- `src/pages/SettingsPage.vue` / `src/components/SettingsTableEditor.vue` — no `MarkdownEditor`
- `src/pages/AdminPage.vue` — packaged `AdminPage` pass-through

Cypress runs against **8390**. `npm run dev` and `npm run service` both bind host port **8390**. Cypress runs against `npm run service`.

**Admin SPA constraint:** every Vue route requires `admin`. Do **not** add a local Home or weaken `requiresRole`. Do **not** change the spa_utils pin in this task. Do **not** add `marked` or `dompurify`.

**Survey (planning time):** no Cypress spec types into a markdown textarea. No spec targets `CardGrid` or `data-card-grid`. The click-or-Enter-then-`${automationId}-input` rule applies only if a spec is typing into `MarkdownEditor` without opening edit mode.

## Goals

- Reconfirm there is no Cypress use of `MarkdownEditor`, `CardGrid`, or `data-card-grid`. Do not add a markdown field, a card grid page, or a spec whose only purpose is to exercise the new resting view.
- If a spec **does** type into a markdown textarea that is hidden until edit mode, change it to activate the display first (click or Enter on `${automationId}-display`), then type into `${automationId}-input`. Do not type into the resting view.
- `settings.cy.ts` name edits stay on the visible `SentenceEditor` input. Do not insert a display-activation step for `admin-products-name-input` or `admin-discounts-name-input` unless 1.0.6 stopped rendering that input while editable. Keep the spec on `/admin/settings`.
- `navigation.cy.ts`, `logs.cy.ts`, and `deployment.cy.ts` still pass. Touch them only if a 1.0.6 selector breaks. Keep Token-tab `admin-token-display-name-display` and chrome `nav-profile-name-display` assertions.
- `README.md` Testing / Automation Support names spa_utils **1.0.6**. State that this host does not assert a markdown resting view because it has no `MarkdownEditor` field, and that Products / Discounts remain table cell editors. Do not document a local `data-card-grid` id.
- No list card dashboard. No local `CardGrid`. No pin change. No `/admin/admin` in `cy.url()` or `href`.

### Craftsmanship Expectations

- Use spa_utils automation ids. Do not invent a local markdown display or card grid to make a selector easier.
- Assert editor behavior at the layer that owns it. A `SentenceEditor` input that is always visible must not be rewritten as if it were `MarkdownEditor`.
- The failure mode to avoid is a spec that looks green because it types into a hidden textarea, or a settings spec “fixed” by clicking a display node that sentence editors do not render.
- Do not retarget `settings.cy.ts` at `/admin/config`. Do not restore a products collection.

## Testing Expectations

Run all commands from **this SPA repository root**.

- Confirmation searches:
  - `rg 'MarkdownEditor|markdown-field-display|CardGrid|data-card-grid' cypress src` — zero, unless F024 migrated a real multi-card page (then assert that page’s `data-card-grid` only)
  - `rg 'marked|dompurify' package.json` — zero
  - `rg 'admin-products-name-input|admin-discounts-name-input' cypress/e2e/settings.cy.ts` — still the sentence-editor input path
- `npm run lint`
- `npm run test`
- `npm run test:coverage`
- `npm run build`

**Packaging verification** (required — last task of the 1.0.6 set):

- `npm run container` — build the SPA container image
- `npm run service` — run db + API + SPA containers
- `npm run cypress:run` — headless end-to-end tests (long running); **all** specs must pass against `http://localhost:8390/admin/...`

Do not run `npm run dev` and `npm run service` at the same time — both bind host port **8390**.

Record results in **Execution Notes**. The gate that would look correct while bypassing the intended boundary is: a markdown spec typing into a textarea that was never opened; settings edits retargeted at a display node `SentenceEditor` does not render; or a new list card dashboard added so Cypress has something to click.

Env notes from prior waves: `GITHUB_FOREVER_TOKEN` as `GITHUB_TOKEN` if the file token is denied by GHCR; `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` before `mh up` so logout specs do not hang on a Tailscale IdP host.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `README.md` — Testing / Automation Support version **1.0.6**; note there is no host markdown resting-view assertion because this SPA has no `MarkdownEditor`

**Update only if a 1.0.6 selector breaks or a real markdown textarea spec exists:**

- `cypress/e2e/settings.cy.ts` — only if the visible sentence/word/count/date-time input selector broke; must remain on `/admin/settings`; do not add click-to-edit for non-markdown editors
- `cypress/e2e/navigation.cy.ts`, `cypress/e2e/logs.cy.ts`, `cypress/e2e/deployment.cy.ts` — only if a 1.0.6 selector breaks
- Any Cypress spec that types into a `MarkdownEditor` textarea without opening edit mode — activate `${automationId}-display`, then type into `${automationId}-input`

Do not change the spa_utils pin. Do not add `marked` or `dompurify`. Do not add an Events route, a products list, or a `DataCardGrid` page. Do not pass disallowed `PageFrame` props. Do not edit `src/**` unless a spec failure proves a 1.0.6 selector bug that cannot be fixed in the spec — and do not convert sentence fields to markdown to do it.

## Execution Notes

### Plan
1. Reconfirm survey: no Cypress MarkdownEditor/CardGrid/data-card-grid usage; settings.cy.ts stays on visible SentenceEditor `.find('input')` for `admin-products-name-input` / `admin-discounts-name-input`. No Cypress edits expected unless packaging proves a 1.0.6 selector break.
2. Update `README.md` Testing / Automation Support: F024 already names spa_utils **1.0.6** — add only the missing note that this host does not assert a markdown resting view (no MarkdownEditor field) and Products / Discounts remain table cell editors. Do not document `data-card-grid`.
3. Do not change the spa_utils pin, `src/**`, or add marked/dompurify/DataCardGrid.
4. Run confirmation `rg` searches, then `lint`, `test`, `test:coverage`, `build`.
5. Packaging gate: export `GITHUB_TOKEN` from `~/.mentorhub/GITHUB_FOREVER_TOKEN` if GHCR denies the file token; set `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` before service up. Run `npm run container`, then `npm run service`, then `npm run cypress:run`. Do not run `npm run dev` concurrently.
6. If Cypress fails on a 1.0.6 selector within task outputs, fix only allowed Cypress files and re-run; otherwise stop and report.
7. Record summary, files changed, confirmation searches, and test results. Leave Status Pending; do not rename, commit, or push.

### Summary
Succeeded. Survey confirmed: no Cypress MarkdownEditor / CardGrid / data-card-grid usage; settings.cy.ts name edits stay on visible SentenceEditor `.find('input')` — no Cypress edits required. README Testing / Automation Support already named spa_utils **1.0.6** from F024; added only the missing note that this host does not assert a markdown resting view (no MarkdownEditor) and Products / Discounts remain table cell editors. Packaging gate green: container build, service up, all 27 Cypress tests passed. Left Status Pending (no rename, commit, or push). Pin unchanged.

### Files changed
- `README.md` — Testing / Automation Support: note no host markdown resting-view assertion; Products / Discounts remain table cell editors; no local `data-card-grid` documentation
- `tasks/PENDING.F025.spa_utils_1_0_6_cypress_and_packaging.md` — Execution Notes only

### Intentionally not changed
- No Cypress specs (SentenceEditor path still valid under 1.0.6)
- No `src/**`, no pin change, no `marked` / `dompurify`, no DataCardGrid / products list

### Confirmation searches
- `rg 'MarkdownEditor|markdown-field-display|CardGrid|data-card-grid' cypress src` — **zero**
- `rg 'marked|dompurify' package.json` — **zero**
- `rg 'admin-products-name-input|admin-discounts-name-input' cypress/e2e/settings.cy.ts` — both present (SentenceEditor `.find('input')` path)

### Test results
- `npm run lint` — **pass** (`vue-tsc --noEmit` clean)
- `npm run test` — **pass** (10 files, 69 tests)
- `npm run test:coverage` — **pass** (10 files, 69 tests); thresholds hold — `src/api/**` 100/97.29/100/100; `src/composables/**` 98.37/75.34/100/98.37; `src/components/**` 100/87.17/92.3/100
- `npm run build` — **pass** (`vue-tsc` + Vite; 643 modules)
- `npm run container` — **pass** (`ghcr.io/mentor-forge/mentorhub_admin_spa:latest`)
- `npm run service` — **pass** (`mh down && mh up admin`; runtime-config `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html`)
- `npm run cypress:run` — **pass** — 4 specs / 27 tests / 0 failing:
  - `deployment.cy.ts` 9/9
  - `logs.cy.ts` 3/3
  - `navigation.cy.ts` 11/11
  - `settings.cy.ts` 4/4

### Env workarounds used
- `export GITHUB_TOKEN="$(cat ~/.mentorhub/GITHUB_FOREVER_TOKEN)"` for GHCR during `mh up`
- `export IDP_LOGIN_URI='http://127.0.0.1:8080/login.html'` before `npm run service` so logout specs do not hang on a Tailscale IdP host

### Orchestrator confirmation (2026-09-29)
Re-checked the README diff, pin still exact `1.0.6`, confirmation searches (zero markdown/CardGrid hits in `cypress` and `src`; sentence-editor name selectors unchanged), and the agent's Cypress result of 27/27. Marked shipped.
