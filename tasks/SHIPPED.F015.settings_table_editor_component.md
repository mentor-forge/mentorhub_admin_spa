# F015 – Spreadsheet-style `SettingsTableEditor` component

**Status**: Shipped  
**Type**: Feature  
**Depends On**: `F014_setting_and_external_event_api_client`  
**Description**: Build one reusable, column-configurable spreadsheet-style table editor that both Settings tabs use: inline cell editing with save-on-blur, a per-row delete button, and an "Add" button above the table. Component and unit tests only — the Settings page wiring is F016.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — **Automation IDs** (naming, one id per interactive element, stability as an API contract), component coverage targets (90% lines / 90% functions / 85% branches), AutoSave field-level save-on-blur
- `../mentorhub_spa_utils/README.md` — **Type-aligned editors (field components)** (shared props `modelValue` / `onSave` / `editable` / `automationId` / `label`, blur-vs-change save triggers), **Runtime enumerators**, and **Harvesting a local control into spa_utils** (build locally first, keep the shared contract so promotion is mechanical)
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `src/api/types.ts` — F014 `Setting` union and field shapes
- `src/composables/useSettings.ts` — F014 create / update / archive mutations
- `src/App.vue` — F011 already calls `provideEditorConfig`, so spa_utils editors resolve runtime enumerators

spa_utils **1.0.0** ships no table component, so this control is local. Follow the harvest contract in the spa_utils README so it can be promoted later: no journey-specific hardcoding (no API client import, no route paths, no `Product` / `Discount` literals) inside the component — behavior arrives through props and callbacks.

Use spa_utils **editors** for cells rather than raw Vuetify inputs: `SentenceEditor` for `name` / `description` / `stripe_price_id`, `WordEditor` for `subscription` / `code`, `CountEditor` for `unit_price` / `minimum_members` / `free_encounters` / `max_redemptions`, `DateTimeEditor` for `expires_at`. Editors here run in **standalone** mode (`modelValue` + `onSave`); do not wrap rows in `DataCard`.

### Automation id contract (choose once, then keep stable)

The component derives every id from a required `automationIdPrefix` prop:

| Element | Automation id |
|---|---|
| Table root | `{prefix}-table` |
| Add button | `{prefix}-add-button` |
| Row container (one per row) | `{prefix}-row` |
| Cell editor | `{prefix}-{field}-input` |
| Row delete button | `{prefix}-delete-button` |
| Empty-state message | `{prefix}-empty` |
| Error message | `{prefix}-error` |

Row-scoped ids repeat per row by design so Cypress can use `.within()` on `{prefix}-row`; the table root and Add button are unique. F016 passes `admin-products` and `admin-discounts` as prefixes, so the resulting ids match the `{domain}-{page}-{element}` convention.

## Goals

- `src/components/SettingsTableEditor.vue` accepts:
  - `rows: T[]` — already-filtered documents to display (the component does no fetching and no status filtering),
  - `columns: SettingsTableColumn[]` — ordered column descriptors with `field`, `label`, `editor` (`sentence` | `word` | `count` | `dateTime`), optional `hint` / `rules` / `editable`,
  - `automationIdPrefix: string`,
  - `addLabel: string` and `onAdd: () => Promise<void>`,
  - `onSaveCell: (row: T, field: string, value: unknown) => Promise<void>`,
  - `onDelete: (row: T) => Promise<void>`,
  - `isLoading?: boolean`, `errorMessage?: string | null`, and an optional `deleteConfirmMessage`.
- Rendering:
  - a header area holding the title slot and the Add button, then a dense Vuetify table whose header cells come from `columns` and whose body renders one row per document with one editor per column,
  - each row ends with an icon delete button (`mdi-delete`) labeled for screen readers,
  - a loading indicator while `isLoading`, an empty-state row when `rows` is empty and not loading, and the error message when `errorMessage` is set,
  - horizontal scrolling rather than wrapping when the column set is wider than the viewport, so the layout stays spreadsheet-like.
- Behavior:
  - cell editors save on blur (change for boolean/rating types if a future column needs them) by calling `onSaveCell` and awaiting it; a rejected save shows the error message and leaves the edited value visible so the user can retry,
  - the Add button is disabled while an add is in flight and calls `onAdd`,
  - delete asks for confirmation (Vuetify dialog or `v-menu` confirm; no `window.confirm`) and then calls `onDelete`; the confirm and cancel controls carry `{prefix}-delete-confirm-button` and `{prefix}-delete-cancel-button`,
  - all async handlers are guarded so a rejection never leaves the table stuck in a pending state.
- Typing: the component is generic over the row shape (`Record<string, unknown>`-compatible) and imports **no** API client, route, or domain literal. Column descriptors are exported as a type from the component file (or `src/components/settingsTable.ts`) for F016 to import.
- Unit tests in `src/components/SettingsTableEditor.test.ts` use shallow mounting per the standards and cover: header/column rendering, one row container per document, editor value binding, `onSaveCell` invocation and rejection handling, Add button invocation and disabled-while-pending state, delete confirmation flow (confirm calls `onDelete`, cancel does not), empty state, loading state, and error display. Meet the 90/90/85 component thresholds.
- Do not fetch data, do not import `@/api/client` or `@/composables/useSettings`, do not add routes, and do not modify `src/pages/**` in this task.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run lint`
- `npm run test`
- `npm run test:coverage` — `src/components/**` meets the configured thresholds
- `npm run build`

Manual page verification happens in F016 once the component is wired; Cypress is F018.

## Outputs

Paths are relative to **this SPA repository root**.

**Create:**

- `src/components/SettingsTableEditor.vue`
- `src/components/SettingsTableEditor.test.ts`
- `src/components/settingsTable.ts` — column descriptor type and editor-kind union (only if the types are not exported from the `.vue` file)

**Update:**

- `README.md` — Architecture Overview gains `components/` with a one-line note that `SettingsTableEditor` is a local control built to the spa_utils harvest contract

Do not change `src/pages/**`, `src/router/index.ts`, `src/api/**`, or container configuration in this task.

## Execution Notes

### Plan
1. Create `src/components/settingsTable.ts` defining `SettingsTableColumn` and `SettingsEditorType`.
2. Create `src/components/SettingsTableEditor.vue` implementing column-configurable spreadsheet table editor with standalone spa_utils editors (`SentenceEditor`, `WordEditor`, `CountEditor`, `DateTimeEditor`), Add button, delete confirmation dialog, and automation IDs.
3. Create `src/components/SettingsTableEditor.test.ts` covering all rendering states, callbacks, pending states, error handling, and confirmation dialog flow.
4. Update `README.md` to note `src/components/SettingsTableEditor.vue`.
5. Run lint, test:coverage, and build to ensure component coverage threshold (90/90/85).

### Summary & Test Results
- Created `src/components/settingsTable.ts` for generic `SettingsTableColumn` and `SettingsEditorType` definitions.
- Created generic `src/components/SettingsTableEditor.vue` adhering strictly to the spa_utils harvest contract (zero API or route imports, generic row typing, standalone `SentenceEditor`, `WordEditor`, `CountEditor`, `DateTimeEditor`, save-on-blur, delete confirmation modal, automation ID contract).
- Created `src/components/SettingsTableEditor.test.ts` with 8 comprehensive unit tests.
- Updated `README.md` architecture overview.
- `npm run lint` passed with 0 errors.
- `npm run test:coverage` passed with 53/53 tests; Component coverage exceeded thresholds:
  - Statements: 100%
  - Branches: 87.17% (threshold: 85%)
  - Functions: 92.3% (threshold: 90%)
  - Lines: 100% (threshold: 90%)
- `npm run build` passed cleanly.
