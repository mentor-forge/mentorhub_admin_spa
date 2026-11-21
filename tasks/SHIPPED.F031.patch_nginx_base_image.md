# F031 — Patch the Nginx base image built by CI

**Status**: Shipped
**Type**: Defect  
**Depends On**: F030  
**Issue**: https://github.com/mentor-forge/mentorhub_admin_spa/issues/12  
**Description**: Replace the floating Nginx runtime base with the latest patched stable Alpine image, refresh builds, and prove the packaged SPA still meets its deployment contract.

## Context

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub/DeveloperEdition/standards/sre_standards.md`
- `../mentorhub/DeveloperEdition/standards/security_standards.md`
- `../mentorhub_spa_utils/README.md`
- `README.md`
- `tasks/_PLANNING.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/PENDING.F030.spa_migration_acceptance.md` (resolve by task ID after lifecycle renaming)
- `Dockerfile`
- `.github/workflows/docker-push.yml`
- `package.json`
- `scripts/docker-build.sh`
- `nginx.conf.template`
- `cypress.config.ts`
- `cypress/e2e/deployment.cy.ts`
- `cypress/e2e/logs.cy.ts`
- `cypress/e2e/navigation.cy.ts`
- `cypress/e2e/settings.cy.ts`
- [Official Nginx releases](https://nginx.org/en/download.html)
- [Official Nginx security advisories](https://nginx.org/en/security_advisories.html)
- [Official Docker image definitions](https://github.com/nginx/docker-nginx)

Execution follows F030, so its migrated registry/auth configuration is authoritative. Preserve the GitHub-hosted dependency migration and cloud-agnostic local runtime. Do not restore AWS CLI, OIDC, CodeArtifact endpoints, or CodeArtifact secrets. No production provider choice or AWS teardown is required for this security update.

The pre-migration Dockerfile uses `FROM nginx:stable-alpine`. The publishing workflow builds `linux/amd64,linux/arm64` on pushes to `main` and publishes `ghcr.io/mentor-forge/mentorhub_admin_spa:latest`. A floating tag does not identify the binary in an existing published image.

The planning guide contains inherited API wording and references a nonexistent `tasks/README_API.md`; use this SPA's actual `package.json`, README, and orchestration guide. No API contract or data schema change is needed.

## Goals

- At execution time, select the newest patched **stable** upstream Nginx release with an available official Alpine image supporting both target architectures. Record release/advisory URLs, retrieval date, version, image tag, and multi-platform index digest in Execution Notes. Do not copy an old version number from conversation history or silently switch to mainline.
- Identify applicable Nginx advisories using the actual image version, enabled modules (`nginx -V`), and effective configuration. The reported CVE was not supplied; distinguish confirmed affected findings from configuration-dependent or unrelated findings.
- Pin the Dockerfile runtime base to the verified explicit version tag plus multi-platform index digest, keeping Alpine and existing runtime startup behavior. Use the index digest rather than a single-architecture manifest digest.
- In `.github/workflows/docker-push.yml`, set `pull: true` on the existing build action. Keep publishing restricted to `push` on `main`, both target platforms, current registry tags, cache settings, and the migrated GitHub package authentication.
- Add `--pull` to the existing local scripts/docker-build.sh build command so local packaging follows the refreshed-base policy. Preserve the migrated GitHub npm BuildKit secret and all other build behavior.
- Verify the final application image's actual Nginx binary and configuration, rather than relying on a base tag or a successful Vite build. Record image IDs/digests and scan evidence per architecture.
- Document the chosen Nginx pin and the short verification/update procedure in README without duplicating the digest outside the Dockerfile.
- Preserve immutable promotion: build once and promote the same application digest through test, staging, and production. Post-merge CI must publish a fresh image; record its digest and verify its version before marking the security issue resolved. Do not manually publish or deploy during this task's pre-merge work.

### Craftsmanship Expectations

- Keep changes limited to Nginx base selection and fresh-base build behavior. Reuse the current build paths and existing deployment tests.
- Preserve journey prefixes, API proxy ownership, runtime IdP injection, cache headers, shared spa_utils auth/navigation behavior, and automation IDs.
- Do not change application dependency versions, authentication, API contracts, shared utility repositories, or infrastructure as part of this update.
- If a required patched multi-platform image, registry access, GitHub package credentials, Docker runtime, or backing service is unavailable, record the exact blocker and mark the task Blocked. Do not claim verification or weaken tests to pass.

## Testing Expectations

- Validate the YAML and diff: the base uses the verified pin; CI requests a pull, keeps both architectures, and retains its main-only publishing trigger. Use available existing lint tooling; do not introduce a dependency solely for this check.
- Using the GitHub npm authentication established by the predecessor tasks, with no AWS CLI/credentials prerequisite, run `npm ci --include=dev`, `npm run test`, and `npm run build`. Run the existing lint script only if present in package.json. Do not modify the lockfile for this base-image update.
- **Packaging verification**: run `npm run container`, then `npm run service`, then `npm run cypress:run` against the packaged SPA at `http://localhost:8390/admin/`. Stop Vite first. Confirm the running container image ID matches the freshly built local application image; a pulled old image is not evidence. Running the API alone does not run the SPA.
- In existing `cypress/e2e/deployment.cy.ts`, verify redirects, HTTP history fallback, fingerprinted asset caching, HTML/runtime-config `no-store`, matching root/prefixed runtime config, API `*.js` precedence, an authenticated least-privileged request, and an unauthenticated API failure. Use the complete existing Cypress suite without adding redundant tests or weakening assertions.
- Validate the generated configuration with `nginx -t -c /tmp/nginx.conf` inside the running SPA container. A bare `nginx -t` against a different config is insufficient.
- Also smoke-test the supported shared-origin `:8080/admin/` entry and its prefixed API path. Build the final application image for **both** amd64 and arm64 using the existing build/auth conventions (Buildx local exports or separate local platform tags; no registry push). Run `nginx -v` and `nginx -V` against each built image, with explicit platform selection/emulation where needed, and compare with the selected patched version.
- Scan each final application image using an available container scanner with current advisory data. Record scanner/database versions, target image identity, applicable Nginx findings and disposition, and remaining unrelated findings. Scanner unavailability or missing architecture validation is a blocker, not a passing result.
- Honor the existing pre-PR gate `npm run container && npm run api && npm run cypress:run`; because `npm run api` tears down the SPA stack, run `npm run service` after API setup and before Cypress so it actually exercises the newly built container. Record commands, results, image identities, and advisory decisions in Execution Notes. Publishing only occurs after human review and merge under existing CI. Leave a clearly identified post-merge check for the published multi-platform image's digest and binary versions; the issue remains open until that check succeeds.

## Outputs

Implementation may change only:
- `Dockerfile` — explicit patched stable Alpine tag and multi-platform digest.
- `.github/workflows/docker-push.yml` — fresh-base pull setting.
- `scripts/docker-build.sh` — fresh-base local build option.
- `README.md` — short Nginx update/verification procedure.
- `tasks/PENDING.F031.patch_nginx_base_image.md` — execution evidence and lifecycle update; rename to `tasks/SHIPPED.F031.patch_nginx_base_image.md` only after required pre-merge validation and commit, or the corresponding `BLOCKED.` filename if prerequisites fail.

Existing test files to execute unchanged:
- `cypress/e2e/deployment.cy.ts`
- `cypress/e2e/logs.cy.ts`
- `cypress/e2e/navigation.cy.ts`
- `cypress/e2e/settings.cy.ts`

All other files remain outside this task's output scope. If verification reveals a required config or test correction, record it for replanning rather than silently expanding outputs.

## Execution Notes

- On November 20, 2026 (Eastern), the [upstream release list](https://nginx.org/en/download.html) identified 1.30.7 as stable. Inspection of the [official Alpine image](https://hub.docker.com/_/nginx) confirmed the `nginx:1.30.7-alpine` OCI index and its Linux AMD64 and ARM64 manifests. The Dockerfile records the index digest.
- The [upstream security advisories](https://nginx.org/en/security_advisories.html) list 1.30.7 as containing the fix for the resolver advisory CVE-2026-123634. That resolver is used in the generated config. The selected stable version also contains the listed HTTP/2 and HTTP/3 fixes. The binary includes those modules, while the effective Admin config listens on plain HTTP without those protocols enabled. The original issue supplied no advisory ID, so the previous published image's exposure is unverified.
- Clean locked `npm ci --include=dev`, `npm run lint`, all 69 unit tests, and the production build passed. The publishing workflow YAML check verified main-only publishing, both architectures, the refreshed-base setting, and the existing npm secret. Shell syntax and `git diff --check` passed.
- Native ARM64 built through `npm run container` with the GitHub npm BuildKit secret. The existing `npm run api` and `npm run service` scripts use shared Developer Edition teardown and fixed host ports, so equivalent startup used disposable MongoDB, seed, API, and SPA containers with an isolated network and loopback port. The running SPA image ID matched the fresh build. `nginx -t -c /tmp/nginx.conf` passed, and all 27 packaged Cypress tests passed against that image. The isolated Welcome proxy returned HTTP 200 on the shared-origin Admin page and the expected HTTP 401 on the unauthenticated prefixed API request, using the public `localhost:8080` host on an alternate physical loopback port. Temporary QA containers were removed.
- Both final binaries reported `nginx/1.30.7` under explicit architecture selection with `nginx -v` and `nginx -V`. ARM64 image ID: `sha256:7237dc7bdaa3a86f94b63a4219905d02d708bcd8a06b277a466ccac752e9359d`. AMD64 image ID: `sha256:1b1dcdb324a9a4dc48f91ac62b3f43b8ac9ffde6bf087bdf44028cd5ff950e10`. The default builder lacked AMD64 emulation. The retry succeeded with an isolated BuildKit container, and the packaged binary ran under standalone QEMU. No host emulator registration was needed.
- Trivy 0.76.2 scanned both saved final images using schema 2, updated November 20, 2026 at 13:11 UTC. It reported zero Nginx findings and 11 Alpine 3.24.4 package findings per image: CVE-2026-107496, CVE-2026-88822, CVE-2026-88823, CVE-2026-95691 and CVE-2026-95692 in each of libcrypto3 and libssl3, and CVE-2026-4738 in zlib. Address the OS dependencies in a separate base update.
- After merge, record the new GHCR OCI digest and verify the packaged Nginx binary on both platforms before closing the security issue. Promote the verified application digest through test, staging, and production.
