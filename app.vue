<template>
  <div>
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
// Activate background sync loop when running on the client.
if (import.meta.client) {
  const { useSync } = await import('~/composables/useSync.client')
  useSync()
}
</script>
