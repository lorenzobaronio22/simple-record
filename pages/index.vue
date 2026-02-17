<template>
  <main class="container">
    <button class="record-button" @click="recordEvent">Record!</button>
    <NuxtLink to="/logs" class="logs-link">Logs</NuxtLink>
  </main>
</template>

<script setup lang="ts">
import { useEvents } from '~/composables/useEvents'

const { addEvent } = useEvents()

const recordEvent = () => {
  addEvent()
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
}

.logs-link {
  font-size: 1rem;
  color: #35495e;
}
</style>
