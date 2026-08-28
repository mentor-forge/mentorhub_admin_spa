<template>
  <v-app>
    <PageFrame page-title="Admin">
      <router-view />
    </PageFrame>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { PageFrame, provideEditorConfig, useAuth } from '@mentor-forge/mentorhub_spa_utils'
import { useConfig } from '@/composables/useConfig'

const { isAuthenticated } = useAuth()
const { config, loadConfig } = useConfig()

provideEditorConfig(config as any)

onMounted(async () => {
  if (isAuthenticated.value) {
    try {
      await loadConfig()
    } catch (error) {
      console.warn('Failed to load config on mount:', error)
    }
  }
})
</script>

