# Mentor Hub — Admin SPA

Vue 3 single-page application for the admin service. E0-stripped auth shell with the shared `AdminPage` component for future admin features.

## Prerequisites
- Mentor Hub [Developers Edition](https://github.com/mentor-forge/mentorhub/blob/main/CONTRIBUTING.md)
- Developer [SPA Standard Prerequisites](https://github.com/mentor-forge/mentorhub/blob/main/DeveloperEdition/standards/spa_standards.md)

## Quick Start

```sh
npm run service
```

## Developer Commands

```sh
## install dependencies (run `mh` first for CodeArtifact auth)
npm ci

## type-check
npm run lint

## package code for deployment
npm run build

## run dev server (served at http://localhost:8390/admin/)
npm run dev

## run unit tests
npm run test:unit

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
  api/              # API client (config only for MVP shell)
  pages/            # SettingsPage, LogsPage, AdminPage
  composables/      # useAuth (spa_utils re-export), useConfig, useRoles
  router/           # Auth guards; prefix /admin/ with /settings, /logs, /config
  plugins/          # Vuetify
```

Uses `@mentor-forge/mentorhub_spa_utils` **1.0.0** `PageFrame` as the navigation shell (catalog and Products lists live on Discovery).

### Routes

| Browser URL | Vue path | Page |
|---|---|---|
| `http://<host>:8080/admin/` | `/` | redirect to `/settings` |
| `http://<host>:8080/admin/settings` | `/settings` | SettingsPage (Products / Discounts) |
| `http://<host>:8080/admin/logs` | `/logs` | LogsPage (External events) |
| `http://<host>:8080/admin/config` | `/config` | AdminPage (Runtime config viewer) |

## Local Ports

| Service | Port |
|---------|------|
| Admin SPA (dev) | 8390 (served at `/admin/`) |
| Admin API (proxy target) | 8389 |

## CI

`.github/workflows/docker-push.yml` builds and pushes `ghcr.io/mentor-forge/mentorhub_admin_spa:latest`.
