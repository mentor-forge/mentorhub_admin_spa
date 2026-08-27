# F013 – SPA nginx `/admin/` prefix, container runtime-config, and prefixed API client

**Status**: Pending  
**Type**: Feature  
**Depends On**: `F012_vite_base_and_router_prefix`  
**Description**: Teach container nginx to serve the `/admin/` prefix (assets, Vue history fallback, prefixed API proxy, prefixed `runtime-config.js`), generate `runtime-config.js` from the compose `IDP_LOGIN_URI` at container start, and switch the API client to the prefixed `/admin/api` base so calls from the welcome origin reach `admin_api` through this SPA's nginx. Keep direct-port `/api/` and `/runtime-config.js` for debugging.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — container NGINX template substitution; runtime config generated at startup
- `../mentorhub_spa_utils/README.md` — **Cross-SPA URLs**: welcome/ALB origin on `:8080`; direct SPA debug ports (including **8390**) are for Cypress/OpenAPI/debugging only
- `README.md` — Local Ports table (Admin SPA 8390, Admin API 8389)
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `nginx.conf.template` — today: `location /api/`, `location /health`, `location /`, and a static-asset cache regex; no prefix awareness and no runtime-config location
- `Dockerfile` — copies `dist` to `/usr/share/nginx/html`, copies `nginx.conf.template`, installs `gettext`, and `envsubst`s only `${API_HOST} ${API_PORT}`; defaults `API_HOST=mentorhub_admin_api`, `API_PORT=8389`; build ARG `VITE_IDP_LOGIN_URI`
- `vite.config.ts` — F012 `base: '/admin/'` (asset **URLs** are prefixed; the build **output folder is still the dist root**)
- `public/runtime-config.js.template` — F012 `envsubst` source
- `src/api/client.ts` — `const API_BASE = '/api'`
- `src/api/client.test.ts` — asserts fetch URLs such as `/api/config`
- `package.json` — `open` currently opens `http://localhost:8390`

**External prerequisites** (do not change other repos):

- Developer Edition welcome nginx proxies `:8080/admin/*` to this container **without stripping the prefix**, so this nginx must accept `/admin/...` on port 80.
- Compose passes `API_HOST=admin_api`, `API_PORT=8389`, and `IDP_LOGIN_URI` to the `admin_spa` service. The container currently ignores `IDP_LOGIN_URI`; this task makes it effective.
- Admin API webhook **ingress** (Stripe/Cognito, F-AA01) is a separate Admin API URL. Do **not** add ingress locations, and do not mount webhooks under `/admin/`.

Vite `base` does **not** move files into `dist/admin/`. Nginx must map `/admin/` onto `/usr/share/nginx/html/`; an internal `rewrite` is the expected mechanism. Keep a **single** image and build — no root-only nginx profile.

`IDP_LOGIN_URI` stays `http://<HOST_NAME>:8080/login.html`.

## Goals

- `nginx.conf.template`:
  - `location /admin/api/` proxies to `http://${API_HOST}:${API_PORT}/api/` with the same proxy headers as the existing `/api/` block.
  - `location /api/` is kept for **direct-port** debugging.
  - `location /admin/` maps the prefix onto the dist root (internal `rewrite`) and falls back to `/index.html` for Vue history mode; the HTML response is **not** cached (`no-store`), because a stale shell with root `/assets` URLs 404s behind welcome on `:8080`.
  - A prefixed static-asset location serves and caches `/admin/*.{js,css,png,jpg,jpeg,gif,ico,svg,woff,woff2,ttf,eot}` from the dist root as `public, immutable`; the existing root-path asset cache stays for direct-port debugging.
  - `location = /` returns a redirect to `/admin/` so `http://<host>:8390/` still reaches the app.
  - `location = /admin/runtime-config.js` **and** `location = /runtime-config.js` both serve the generated file with `Cache-Control: no-store` (never the immutable asset cache). Neither may 404.
  - `location /health` is kept unchanged for container health.
  - No other journey SPA, and no other domain's `/api`, is proxied from this container.
- `Dockerfile`:
  - declares `ENV IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` as the local default,
  - at start, `envsubst`s `${IDP_LOGIN_URI}` from `runtime-config.js.template` (shipped in the dist root by the Vite `public/` copy) into `/usr/share/nginx/html/runtime-config.js`, in addition to the existing nginx-template `envsubst` of `${API_HOST} ${API_PORT}`,
  - keeps the single-stage-pair build, the CodeArtifact BuildKit secret, and the `patch.txt` build stamp unchanged.
- `src/api/client.ts` derives the API base from the Vite base rather than hardcoding `/api`, yielding `/admin/api` in the browser (for example `` `${import.meta.env.BASE_URL}api` `` normalized to a single slash). All requests continue to send `Authorization: Bearer <token>`, `Content-Type: application/json`, and keep the existing `401` → `logout()` + `redirectToIdpLogin()` behavior and `204` / empty-body handling.
- `src/api/client.test.ts` asserts the prefixed URL (`/admin/api/config`) instead of `/api/config`, and still covers the `401` path and error mapping.
- `package.json` `open` script opens `http://localhost:8390/admin/`.
- `README.md` documents: welcome origin `http://<host>:8080/admin/` is the supported browser entry; `http://localhost:8390/admin/` is direct-port debugging only; API calls reach `admin_api` through this SPA's nginx at `/admin/api/`; webhook ingress is **not** served under `/admin/`.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run container`
- `npm run service` — then verify with `curl -i`:
  - `http://localhost:8390/` redirects (302) to `/admin/`
  - `http://localhost:8390/admin/` returns `200 text/html` with the app shell and `/admin/` asset URLs (not welcome's page, not a 404)
  - `http://localhost:8390/admin/settings` and `/admin/logs` return `200 text/html` through the history fallback
  - `http://localhost:8390/admin/runtime-config.js` returns `200`, `Cache-Control: no-store`, and contains the compose `IDP_LOGIN_URI` value
  - `http://localhost:8390/runtime-config.js` also returns `200` `no-store`
  - `http://localhost:8390/admin/api/config` and `http://localhost:8390/api/config` both reach `admin_api` (an unauthenticated `401` JSON body is acceptable; HTML from a missing location is a failure)
  - a prefixed JS asset returns `200` with `Cache-Control: public, immutable`
  - `http://localhost:8390/health` returns `healthy`
- If Developer Edition welcome is up on `:8080`, also confirm `http://localhost:8080/admin/` returns this SPA rather than welcome's `index.html`. If welcome is not part of the running stack, record it as an external check — do not change other repos.

Cypress end-to-end coverage against the packaged prefix is **F018** (no Cypress harness exists yet).

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `nginx.conf.template` — `/admin/`, `/admin/api/`, prefixed asset cache, `/` redirect, dual `runtime-config.js`
- `Dockerfile` — `IDP_LOGIN_URI` default and startup `envsubst` for `runtime-config.js`
- `src/api/client.ts` — base-derived `/admin/api`
- `src/api/client.test.ts` — prefixed URL assertions
- `package.json` — `open` URL `/admin/`
- `README.md` — prefixed URLs, proxy boundaries, ingress exclusion

Do not change `vite.config.ts`, `src/router/index.ts`, or any page component in this task.

## Execution Notes

_Reserved for the task execution agent: plan, commands run, test results, follow-ups._
