# API Task Automation Framework - Planning

This folder contains coding tasks that an orchestration agent can execute, based on the context and instructions in each task file. This file is a guide for an agent that is helping to plan changes by creating task files to achieve a goal. Create tasks following the [naming conventions](#naming-conventions) and guides below. When planning, only create tasks, do not execute any tasks, and do not change any files outside of the tasks folder. 

- **Path anchoring**
  - All paths in task files are relative to **this API repository root** (the directory that contains `Pipfile`).
  - Sibling repos must all be sibling folders under a common parent.
  - Standards: `../mentorhub/DeveloperEdition/standards/spa_standards.md`
  - In-repo: `README.md`, `docs/openapi.yaml`, `src/...`, `test/...`, `tasks/...`

- **Context** Before creating any task files you should review the following files for context:
- ../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md
- ../mentorhub/DeveloperEdition/standards/spa_standards.md
- ../mentorhub_spa_utils/README.md
- ./README.md
- ./tasks/_ORCHESTRATE.md
- ./tasks/_PLANNING.md (this file)

## Task File Layout

Each task file must contain the following sections under H1 and H2 headings.

- Under the top H1 task header:
  - Each task file should declare `Status:` **inside the file**, and also encode the status in the **filename prefix** so tasks are visually grouped in the IDE.
  - **Lifecycle statuses (in‑file)**:
    - `Pending`: Not yet started.
    - `Running`: Work is currently being done in the active session.
    - `Blocked`: Waiting on some external dependency or decision.
    - `Shipped`: Implemented, tested, and committed as per the change control process.
    - `Run as needed`: Not part of the main long‑running sequence; to be run manually or opportunistically.
  - **Filename status prefixes (for grouping)**:
    - `AS_NEEDED.` – Tasks that should **not** be part of the main long‑running sequence.
    - `BLOCKED.` – Tasks currently blocked.
    - `PENDING.` – Tasks that are ready to be picked up when their turn comes.
    - `RUNNING.` – (Optional) Tasks currently being executed in this session.
    - `SHIPPED.` – Tasks that are fully implemented and completed.
  - **Type**: `Feature` | `Defect` to describe why we are running this task
  - **Depends On**: `L010_update_profile_openapi` the required predecessor task **in this repo**, all tasks should specify a single serial path for implementation.
  - **Description**: A brief human description of the task.

- Under a **Context** H2 header:
  - A list of context files. This list should always include:
    - `../mentorhub/DeveloperEdition/standards/spa_standards.md`
    - `tasks/README_API.md`
    - `README.md`
  - Any other input files for the execution of the task.
  - `AS_NEEDED` tasks may include a **Parameters (edit before running)** subsection here for values to customize before promoting to `Pending`.

- Under a **Goals** H2 header:
  - A list of desired outcomes for the task.
  - Each item should describe the outcome (e.g. "OpenAPI `Profile` schema includes `full_name`").

- Under a **Testing Expectations** H2 header:
  - Can include the creation of new tests for new features.
  - Can include changing existing tests because of modified features.
  - Should always include a description of the tests that should be used to verify completion.
  - In this repo, that typically means some combination of:
    - `npm run install` — refresh dependencies after changes (CodeArtifact auth; run `mh` first if needed)
    - `npm run test` — unit tests 
    - `npm run lint` — format check 
    - `npm run build` — compile sources
    - `npm run api` — run backing API
    - `npm run dev` — run dev server locally (for manual or E2E verification)
    - `npm run cypress:run` — headless end-to-end tests against a running API (long running)
  - Should always include the **Packaging verification** step:
    - `npm run container` — build the API container image
    - `npm run service` — run db + API + SPA containers
    - `npm run cypress:run` — headless end-to-end tests (long running)
  - All test files should be identified in **Outputs** (below).

- Under an **Outputs** H2 header:
  - A list of the files that will be created/updated/moved/renamed/etc.
  - `file_name.vue` will be updated to support `<Goal>`
  - List all files including new files to be created.
  - The agent will not update files not listed.

- Under an **Execution Notes** H2 header:
  - Reserved for the task execution agent to record plan, commands run, test results, and follow-ups.

## Naming Conventions
- **Recommended filename pattern**:
  - `STATUS.LNNN.short_task_name.md` where L is Feature/Defect, and NNN is a serial task number. Increment task numbers by exactly one within a workflow (for example, `L100`, `L101`, `L102`), rather than reserving gaps of 10. When planning, create only PENDING status tasks. 
  - Examples:
    - `PENDING.F011.update_profile_openapi.md`
    - `PENDING.F012.add_profile_field_tests.md`
    - `PENDING.F013.update_profile_openapi.md`
    - `PENDING.D001.example_defect.md`

## External repository boundaries

Task planning and execution in **this API repo** (`mentorhub_admin_spa`) must not read or depend on other sibling repositories for input context, except:

- **`../mentorhub`** — platform standards and shared documentation (e.g. `DeveloperEdition/standards/spa_standards.md`).
- **`../mentorhub_spa_utils`** — shared npm utilities used by domain SPAs.

Do **not** reference paths under `mentorhub_mongodb_api`, other domain API repos, SPAs, or CloudFormation repos in task **Context** or **Goals**. If work in another repository is a prerequisite, describe it as an **external prerequisite** in prose (e.g. “MongoDB dictionary must include field X”) and set **Status** to `Blocked` until a human confirms it — do not link to or read files in that repo.

## OpenAPI Specifications

**Definitive** OpenAPI specifications must come from the **running API** not from files in the `mentorhub_mentee_api` repository.

Start the backing API if needed (`npm run api`), then fetch the latest JSON schema with `curl`:

```bash
curl -X GET "http://localhost:8389/docs/openapi.yaml"
```

## Sample task file

For a complete example of a well‑formed `Run as needed` task, see:

- `AS_NEEDED.T998.openapi_updates.md`

## Workshop context

- ../mentorhub/Workshops/admin_journey_issues.md
