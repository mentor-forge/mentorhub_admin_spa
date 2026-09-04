# F023 – 1.0.3 `display_name` Cypress and packaging

**Status**: Shipped  
**Type**: Feature  
**Depends On**: `F022_pin_spa_utils_1_0_3`  
**Description**: Point Cypress at spa_utils **1.0.3** Token-tab and PageFrame `display_name` behavior, keep existing 1.0.1 catalog / `/admin/config` host coverage, and run the packaged SPA as the acceptance gate for [F-AS04 / GitHub #8](https://github.com/mentor-forge/mentorhub_admin_spa/issues/8).

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — E2E covers pages; automation ids are a stable UI API
- `../mentorhub_spa_utils/README.md` — Token tab `display_name` → `admin-token-display-name-display`; PageFrame chrome `nav-profile-name-display` inside `nav-profile-link` when JWT `display_name` is present and non-blank; **no** fallback to `name` / `given_name` / `email` / `user_id` / `sub`; missing Token-tab strings render `N/A`. Live Developer Edition / `signCypressJwt` tokens may still omit `display_name` — stub intercepts / JWT payload in Cypress rather than synthesizing claims in app code
- `README.md` — after F022 should name spa_utils **1.0.3**; Automation Support may still omit Token `display_name` ids
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `tasks/PENDING.F022.pin_spa_utils_1_0_3.md` (or shipped successor) — pin and local token-claim alignment already done; use Execution Notes if types/fixtures changed
- `cypress.config.ts` — `baseUrl` stays `http://localhost:8390`; `chromeWebSecurity: false` stays
- `cypress/support/e2e.ts` — `registerAuthCommands({ visitPath: '/admin/' })`
- `cypress/support/commands.ts` — `visitPrefixed` only; spa_utils demo `stubJwtDisplayName` is **not** a packaged export — do not copy the demo helper into this repo unless a tiny inline JWT patch in a spec is required
- `cypress/e2e/navigation.cy.ts` — `adminConfigBody.token` currently has `profile_id` / `customer_id` / `mentor_id` only; Token tab asserts those three ids; chrome asserts `nav-profile-link` but not `nav-profile-name-display`
- `cypress/e2e/settings.cy.ts` — Products / Discounts on `/admin/settings`; **keep**
- `cypress/e2e/logs.cy.ts` — `/admin/logs`; keep
- `cypress/e2e/deployment.cy.ts` — nginx prefix / API proxy; keep unless a selector breaks
- `src/pages/AdminPage.vue` — packaged `AdminPage` pass-through of `config.token`

Cypress runs against **8390**. `npm run dev` and `npm run service` both bind host port **8390**. Cypress runs against `npm run service`.

**Admin SPA constraint:** every Vue route requires `admin`. Do **not** add a local Home or weaken `requiresRole` to make chrome easier to screenshot. Do **not** change the spa_utils pin in this task.

## Goals

- **Token tab (present):** after admin Settings navigation, stub `GET **/admin/api/config` with a `token` object that includes `display_name` plus the existing `profile_id`, `customer_id`, and `mentor_id`. Open `admin-tab-token` and assert `admin-token-display-name-display` (read-only input value) **and** the three existing id displays. Do not assert a token `name` field.
- **Token tab (missing):** a second intercept whose token omits `display_name` (and does not supply `name` / `given_name` / `email` as a substitute) must show `N/A` on `admin-token-display-name-display`. This is the failure mode that would look correct if spa_utils still mapped `name` → display.
- **PageFrame chrome:** default `cy.login(['admin'])` may remain compact (no `nav-profile-name-display`) because `signCypressJwt` omits the claim. If this SPA asserts chrome `display_name`, patch the stored JWT payload in the spec (or a one-off command) and reload — do not add app-code fallbacks and do not vendor spa_utils demo `commands.ts`. When the claim is stubbed, `nav-profile-name-display` inside `nav-profile-link` shows the stubbed name. When it is absent, that node is omitted.
- Existing F021 coverage still passes: 1.0.1 admin catalog, Settings `href` on hosting `/admin/config`, Events/Home/Notifications on welcome `:8080`, removed Products/Customer/Members ids, non-admin `/admin/config` gate, logout `return_to=http://localhost:8080/discovery/`.
- `settings.cy.ts`, `logs.cy.ts`, and `deployment.cy.ts` still pass; touch them only if a 1.0.3 selector breaks. Keep `/admin/settings` as the Products / Discounts detail page.
- `README.md` Testing / Automation Support lists Token-tab `admin-token-display-name-display` and chrome `nav-profile-name-display` as spa_utils 1.0.3 ids this host asserts (not local `nav-*` ids).
- No local Token UI. No `/admin/admin` in `cy.url()` or `href`.

### Craftsmanship Expectations

- Use spa_utils PageFrame / TokenClaimsCard automation ids; do not invent a local Token card.
- Assert `display_name` at the layer that owns it: config intercept → Token tab; JWT localStorage → chrome. A test that only checks final text without the stubbed source would miss a leftover `token.name` mapping.
- Do not retarget `settings.cy.ts` at `/admin/config`. Do not restore a local drawer.
- Prefer extending `navigation.cy.ts` over adding a new spec file unless the file becomes unreadable.

## Testing Expectations

Run all commands from **this SPA repository root**.

- Confirmation searches:
  - `rg 'token\.name|token\[.name.\]|token\.get\(.name.\)' src cypress README.md`
  - `rg 'display_name|admin-token-display-name-display|nav-profile-name-display' cypress README.md`
- `npm run lint`
- `npm run test`
- `npm run test:coverage`
- `npm run build`

**Packaging verification** (required — last task of the F-AS04 / 1.0.3 set):

- `npm run container` — build the SPA container image
- `npm run service` — run db + API + SPA containers
- `npm run cypress:run` — headless end-to-end tests (long running); **all** specs must pass against `http://localhost:8390/admin/...`

Do not run `npm run dev` and `npm run service` at the same time — both bind host port **8390**.

Record results in **Execution Notes**. The gate that would look correct while bypassing the intended boundary is: Token tab populated from `name` / `given_name` / `email` while `display_name` is absent; chrome showing a fabricated name when the JWT claim is missing; or Token tab still omitting `admin-token-display-name-display` after the 1.0.3 pin.

Env notes from prior waves: `GITHUB_FOREVER_TOKEN` as `GITHUB_TOKEN` if the file token is denied by GHCR; `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` before `mh up` so logout specs do not hang on a Tailscale IdP host.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `cypress/e2e/navigation.cy.ts` — config token stub includes `display_name`; Token tab present + missing (`N/A`) assertions; optional JWT chrome stub for `nav-profile-name-display`; keep existing catalog / Settings host / logout coverage
- `cypress/e2e/deployment.cy.ts` — only if a prefix assertion must mention Token ids
- `cypress/e2e/settings.cy.ts`, `cypress/e2e/logs.cy.ts` — only if a 1.0.3 selector breaks (`settings.cy.ts` must remain on `/admin/settings`)
- `cypress/support/commands.ts` / `cypress/support/e2e.ts` — only if a minimal JWT `display_name` stub is required and cannot live inline in the spec
- `cypress/fixtures/**` — only if Token/config intercepts need a fixture
- `README.md` — Testing / Automation Support 1.0.3 Token `display_name` and chrome ids

Do not restore a local drawer. Do not change the spa_utils pin. Do not add an Events route or list dashboards. Do not pass disallowed `PageFrame` props. Do not implement `display_name` fallbacks in `src/**`.

## Execution Notes

### Plan (2026-09-03)

Reviewed F022 (pin 1.0.3 shipped; no local mapping), spa_utils TokenClaimsCard / PageFrame ids, and current Cypress.

**Cypress (`navigation.cy.ts` only unless a selector breaks)**
- Add `display_name` to the default `GET **/admin/api/config` token stub alongside existing `profile_id` / `customer_id` / `mentor_id`.
- After Settings navigation (`nav-settings-link` → `/admin/config`), assert Token-tab `admin-token-display-name-display` input value **and** the three id displays. Do not assert a token `name` field.
- Second intercept: omit `display_name`; include decoy `name` / `given_name` / `email` (the leftover-mapping failure mode) and assert `N/A` on `admin-token-display-name-display`.
- Default `cy.login(['admin'])` chrome stays compact: `nav-profile-name-display` must not exist (`signCypressJwt` omits the claim).
- Optional chrome present case: inline JWT payload patch + reload (do **not** vendor spa_utils demo `stubJwtDisplayName`). Intercept config so the unsigned patched JWT cannot 401 `loadConfig`. Assert `nav-profile-name-display` inside `nav-profile-link`.
- Keep F021 catalog / Settings host / logout / non-admin gate coverage. Leave `settings.cy.ts`, `logs.cy.ts`, `deployment.cy.ts` untouched unless a 1.0.3 selector breaks.

**Docs**
- README Testing / Automation Support: list Token-tab `admin-token-display-name-display` and chrome `nav-profile-name-display` as spa_utils **1.0.3** ids this host asserts.

**Out of scope**
- Do not change the spa_utils pin. No local Token UI, no `/admin/admin`, no `src/**` fallbacks.

**Tests** (from this SPA root): confirmation `rg` → `lint` / `test` / `test:coverage` / `build` → `container` && `service` && `cypress:run`.

### Summary (2026-09-03)

Extended Cypress against spa_utils **1.0.3** Token-tab and PageFrame `display_name` without changing the pin or adding local fallbacks. `GET **/admin/api/config` token stub now includes `display_name`; Token tab asserts `admin-token-display-name-display` plus the three ids. A second intercept omits `display_name` and supplies decoy `name` / `given_name` / `email` so leftover mapping would fail — UI shows `N/A`. Default login chrome stays compact; an inline JWT payload patch + reload asserts `nav-profile-name-display` inside `nav-profile-link`. README Testing / Automation Support lists those 1.0.3 ids as host-asserted. Packaging gate passed against `http://localhost:8390/admin/...`.

**Files changed**
- `cypress/e2e/navigation.cy.ts` — Token present + missing (`N/A` / decoys), compact chrome, stubbed JWT chrome
- `README.md` — Testing / Automation Support 1.0.3 Token and chrome ids
- this task file (plan, results, status)

**Unchanged**
- spa_utils pin remains exact `1.0.3`
- `settings.cy.ts`, `logs.cy.ts`, `deployment.cy.ts`, `commands.ts`, `e2e.ts`, fixtures, `src/**`

**Confirmation searches**
- `rg 'token\.name|token\[.name.\]|token\.get\(.name.\)' src cypress README.md` — zero hits
- `rg 'display_name|admin-token-display-name-display|nav-profile-name-display' cypress README.md` — `navigation.cy.ts` (stubs + assertions) and README docs only

**Test results**
- `npm run lint` — pass (`vue-tsc --noEmit` clean)
- `npm run test` — 10 files / 69 tests passed
- `npm run test:coverage` — 69 passed; thresholds held (`src/api/**` 100/97.29/100/100; `src/composables/**` 98.37/75.34/100/98.37; `src/components/**` 100/87.17/92.3/100)
- `npm run build` — pass (`vue-tsc` + Vite production build; existing chunk-size warning only)
- `npm run container` — pass; image `ghcr.io/mentor-forge/mentorhub_admin_spa:latest` (`sha256:5d9bcebbdccbd47f781f01f5845fa158fb0535fc11c4c13147bb52add2773f1b`); Docker `JSONArgsRecommended` warning; npm install reported 6 audit vulnerabilities and install-script warnings during image build
- `npm run service` — pass; `mh down && mh up admin && npm run open` with `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` and `GITHUB_TOKEN` from `GITHUB_FOREVER_TOKEN`
- `npm run cypress:run` — pass against `http://localhost:8390`: `deployment.cy.ts` 9/9, `logs.cy.ts` 3/3, `navigation.cy.ts` 11/11, `settings.cy.ts` 4/4; **27/27 passing**, 0 failing

**Env workarounds**
- Exported `GITHUB_TOKEN` from `~/.mentorhub/GITHUB_FOREVER_TOKEN` before `npm run service`
- Set `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` before `mh up` so logout/IdP specs stay on the local Developer Edition IdP (runtime-config confirmed)

**Blockers**: none
