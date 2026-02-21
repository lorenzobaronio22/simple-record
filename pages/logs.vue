<template>
  <main class="container">
    <h1>Event Logs</h1>
    <p class="back-link">
      <NuxtLink to="/">Back to Home</NuxtLink>
    </p>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading events...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error.message }}</p>
      <button @click="retry" class="retry-button">Retry</button>
    </div>

    <p v-else-if="events.length === 0" class="no-events">No events recorded yet.</p>

    <ul v-else>
      <li v-for="event in events" :key="event.id">
        {{ new Date(event.timestamp).toLocaleString() }}
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
import { useEvents } from '~/composables/useEvents'

const { events, loading, error, fetchEvents } = useEvents()

const retry = async () => {
  try {
    await fetchEvents()
  } catch {
    // Error is handled in the composable
  }
}
</script>

<style scoped>
.container {
  padding: 20px;
  font-family: sans-serif;
}

.back-link {
  margin-bottom: 20px;
}

.back-link a {
  color: #35495e;
  text-decoration: none;
}

.back-link a:hover {
  text-decoration: underline;
}

.loading {
  text-align: center;
  padding: 40px 20px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #42b883;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error {
  background-color: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 5px;
  text-align: center;
}

.retry-button {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #721c24;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.retry-button:hover {
  background-color: #5a1620;
}

.no-events {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  background-color: #f0f0f0;
  padding: 10px;
  margin-bottom: 5px;
  border-radius: 5px;
}
</style>
