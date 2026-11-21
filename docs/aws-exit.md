# Admin SPA AWS exit audit

| Area | Current coupling | Migration |
|---|---|---|
| Package resolution | The exact SPA Utils pin is 1.0.6. The lockfile contains 198 CodeArtifact URLs, including third-party packages. The tracked project npm config is a registry-only stub even though the ignore rule also matches that filename. | Pin SPA Utils 1.0.7 from GitHub Packages. Resolve third-party packages from public npm and preserve locked versions and integrity wherever possible. Use a host-scoped environment reference for package credentials. Preserve any developer-local npm configuration. |
| Container build | The local wrapper fetches a CodeArtifact token through AWS CLI. Docker uses a BuildKit secret to append npm authentication inside its dependency install step. | Use a GitHub Packages BuildKit secret and install from the committed lock. Preserve the existing image name, Vite build, Nginx startup, API proxy and SPA mount path. Keep developer tokens out of the build context, image layers and logs. |
| GitHub Actions | The main-branch image workflow requests AWS OIDC credentials, fetches the CodeArtifact token and provides it to Buildx. It publishes AMD64 and ARM64 images to GHCR. | Use repository-scoped package access and a BuildKit secret. Keep GHCR publishing on main and add non-publishing PR validation. Document the limited validation available to forks when package authentication is unavailable. |
| Runtime identity | The SPA bootstraps URL auth before app startup and uses SPA Utils for auth state, role checks, redirects and logout. Runtime configuration supplies the IdP URL at Nginx startup, while local Vite development can supply a build-time URL. Nginx serves the root and Admin-prefixed runtime config and proxies both API paths. Cognito log labels and types describe existing records. | Preserve the shared auth, URL, claim and routing contracts. No direct AWS calls were found in the audited browser authentication paths. Production IdP selection, schema changes and infrastructure cutover are outside this migration. |

## Release and acceptance

The npm registry returned the published exact version 1.0.7 through authenticated read access. GitHub reports public visibility and links the package to the SPA Utils repository. The registry reports integrity `sha512-OL1SICKEYwGDLFyi8ycWuZwyPQcSBag5ur9XJEXsElIjuneaQxvo/+XbWVvde+3WmMhBPlNQQPEoVTgqYhHklA==`. Local read access does not establish Admin SPA's repository-token access. Confirm that in the hosted workflow and grant the consuming repository read access in package settings if needed.

Verify a clean locked install, Vue and TypeScript compilation, the stylesheet and Cypress helper imports, and packaged login and proxy behavior within Admin SPA. Record this repository’s evidence independently of rollout to other journeys. Prior SPA Utils pin tasks are shipped historical records.

Admin SPA pins SPA Utils 1.0.7 exactly. Use `npm ci` with a GitHub Packages read token exported as `GITHUB_TOKEN`. The committed npm config sends that token only to GitHub Packages and uses public npm for third-party packages. No AWS authentication is needed.

Run `npm run container` with the same `GITHUB_TOKEN` to build the Admin SPA image. The wrapper passes the token as the `github_npm_token` BuildKit secret. The build resolves the committed lock with `npm ci` and puts the host-scoped registry configuration in a temporary filesystem for that step. The Docker context excludes the developer's npm configuration. Set `ADMIN_SPA_IMAGE` to use a local test tag instead of the default GHCR image tag.

The rollback floor is SPA Utils 1.0.7, the first GitHub-hosted package version. Restore a verified GitHub-hosted package pin and its matching lockfile for future dependency rollbacks. For an image regression, restore a previously verified image through the normal deployment procedure and rerun route and login checks.

## GitHub Actions validation

Pull requests to main always check the lockfile and its registry origins without package credentials. Pull requests from a branch in this repository also run a locked install, type checks, unit tests, and both the SPA and container builds. This job uses the repository workflow token with package read access. Fork and Dependabot PRs run only the lockfile check. A maintainer can run the full validation from a trusted branch in this repository after reviewing the changes.

The main-branch workflow publishes the existing AMD64 and ARM64 GHCR image. It passes the workflow token to the Docker install step as a BuildKit secret and uses package write permission for publishing. If a trusted run receives a GitHub Packages authorization error during install, verify that SPA Utils grants this repository read access under the package's **Manage Actions access** settings. An authenticated local install uses a different credential and cannot verify this permission.
