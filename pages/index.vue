<template>
  <main class="container">
    <button
      class="record-button"
      @click="recordEvent"
      :disabled="loading"
      :aria-busy="loading"
      aria-label="Click to record an event"
    >
      {{ loading ? 'Recording...' : 'Record!' }}
    </button>
    <NuxtLink to="/logs" class="logs-link">Logs</NuxtLink>
  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEvents } from '~/composables/useEvents'
import { useToast } from '~/composables/useToast'

const { addEvent, loading: isLoading, error } = useEvents()
const { success, error: showError } = useToast()

const loading = computed(() => isLoading.value)

const recordEvent = async () => {
  try {
    await addEvent()
    success('Event recorded!')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to record event'
    showError(message)
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  gap: 20px;
}

.record-button {
  font-size: 2rem;
  padding: 20px 40px;
  border-radius: 10px;
  border: none;
  background-color: #42b883;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.record-button:hover:not(:disabled) {
  background-color: #359268;
  transform: scale(1.05);
}

.record-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.logs-link {
  font-size: 1rem;
  color: #35495e;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.logs-link:hover {
  background-color: #f0f0f0;
}
</style>
