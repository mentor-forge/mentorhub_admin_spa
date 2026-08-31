<template>
  <div class="settings-table-editor" :data-automation-id="`${automationIdPrefix}-table`">
    <div class="d-flex justify-space-between align-center mb-4">
      <slot name="title">
        <h2 v-if="title" class="text-h5 font-weight-medium">{{ title }}</h2>
      </slot>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        :data-automation-id="`${automationIdPrefix}-add-button`"
        :disabled="isAddPending || isLoading"
        :loading="isAddPending"
        @click="handleAdd"
      >
        {{ addLabel }}
      </v-btn>
    </div>

    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="mb-4"
      :data-automation-id="`${automationIdPrefix}-error`"
    >
      {{ errorMessage }}
    </v-alert>

    <v-progress-linear v-if="isLoading" indeterminate color="primary" class="mb-2" />

    <div class="table-responsive">
      <v-table density="compact" class="elevation-1">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.field" class="text-left font-weight-bold">
              {{ col.label }}
            </th>
            <th class="text-right font-weight-bold" style="width: 80px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!isLoading && rows.length === 0">
            <td
              :colspan="columns.length + 1"
              class="text-center py-6 text-medium-emphasis"
              :data-automation-id="`${automationIdPrefix}-empty`"
            >
              No items available. Click "{{ addLabel }}" to add one.
            </td>
          </tr>
          <tr
            v-for="(row, rowIndex) in rows"
            :key="getRowKey(row, rowIndex)"
            :data-automation-id="`${automationIdPrefix}-row`"
          >
            <td v-for="col in columns" :key="col.field">
              <SentenceEditor
                v-if="col.editor === 'sentence'"
                :model-value="getFieldValue(row, col.field) as string | undefined"
                :editable="col.editable !== false"
                :hint="col.hint"
                :rules="col.rules"
                :automation-id="`${automationIdPrefix}-${col.field}-input`"
                :on-save="(val: unknown) => handleSaveCell(row, col.field, val)"
              />
              <WordEditor
                v-else-if="col.editor === 'word'"
                :model-value="getFieldValue(row, col.field) as string | undefined"
                :editable="col.editable !== false"
                :hint="col.hint"
                :rules="col.rules"
                :automation-id="`${automationIdPrefix}-${col.field}-input`"
                :on-save="(val: unknown) => handleSaveCell(row, col.field, val)"
              />
              <CountEditor
                v-else-if="col.editor === 'count'"
                :model-value="getFieldValue(row, col.field) as number | undefined"
                :editable="col.editable !== false"
                :hint="col.hint"
                :rules="col.rules"
                :automation-id="`${automationIdPrefix}-${col.field}-input`"
                :on-save="(val: unknown) => handleSaveCell(row, col.field, val)"
              />
              <DateTimeEditor
                v-else-if="col.editor === 'dateTime'"
                :model-value="getFieldValue(row, col.field) as string | undefined"
                :editable="col.editable !== false"
                :hint="col.hint"
                :rules="col.rules"
                :automation-id="`${automationIdPrefix}-${col.field}-input`"
                :on-save="(val: unknown) => handleSaveCell(row, col.field, val)"
              />
            </td>
            <td class="text-right">
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                color="error"
                aria-label="Delete item"
                :data-automation-id="`${automationIdPrefix}-delete-button`"
                @click="openDeleteDialog(row)"
              />
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialogOpen" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Confirm Delete</v-card-title>
        <v-card-text>
          {{ deleteConfirmMessage || 'Are you sure you want to delete this item?' }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            :data-automation-id="`${automationIdPrefix}-delete-cancel-button`"
            @click="deleteDialogOpen = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :loading="isDeletePending"
            :data-automation-id="`${automationIdPrefix}-delete-confirm-button`"
            @click="confirmDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { ref } from 'vue'
import {
  SentenceEditor,
  WordEditor,
  CountEditor,
  DateTimeEditor,
} from '@mentor-forge/mentorhub_spa_utils'
import type { SettingsTableColumn } from './settingsTable'

const props = defineProps<{
  rows: T[]
  columns: SettingsTableColumn<T>[]
  automationIdPrefix: string
  addLabel: string
  onAdd: () => Promise<void>
  onSaveCell: (row: T, field: string, value: unknown) => Promise<void>
  onDelete: (row: T) => Promise<void>
  isLoading?: boolean
  errorMessage?: string | null
  deleteConfirmMessage?: string
  title?: string
}>()

const isAddPending = ref(false)
const isDeletePending = ref(false)
const deleteDialogOpen = ref(false)
const rowToDelete = ref<T | null>(null)

function getRowKey(row: T, index: number): string | number {
  return row._id || row.id || index
}

function getFieldValue(row: T, field: string): unknown {
  return row[field]
}

async function handleAdd() {
  if (isAddPending.value) return
  isAddPending.value = true
  try {
    await props.onAdd()
  } finally {
    isAddPending.value = false
  }
}

async function handleSaveCell(row: T, field: string, value: unknown) {
  await props.onSaveCell(row, field, value)
}

function openDeleteDialog(row: T) {
  rowToDelete.value = row
  deleteDialogOpen.value = true
}

async function confirmDelete() {
  if (!rowToDelete.value || isDeletePending.value) return
  isDeletePending.value = true
  try {
    await props.onDelete(rowToDelete.value)
    deleteDialogOpen.value = false
    rowToDelete.value = null
  } finally {
    isDeletePending.value = false
  }
}
</script>

<style scoped>
.table-responsive {
  overflow-x: auto;
}
</style>
