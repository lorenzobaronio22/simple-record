<template>
  <main class="container">
    <h1>Event Logs</h1>
    <p class="back-link">
      <NuxtLink to="/">Back to Home</NuxtLink>
    </p>
    <p v-if="events.length === 0" class="no-events">No events recorded yet.</p>
    <ul v-else>
      <li v-for="event in events" :key="event.timestamp">
        {{ new Date(event.timestamp).toLocaleString() }}
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
import { useEvents } from '~/composables/useEvents'

const { events } = useEvents()
</script>

<style scoped>
.container {
  padding: 20px;
  font-family: sans-serif;
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
