/**
 * Nuxt client plugin – generates and persists a stable `deviceId`
 * in localStorage so each browser profile has a unique identity.
 */
export default defineNuxtPlugin(() => {
  const STORAGE_KEY = 'simple-record:deviceId'

  let deviceId = localStorage.getItem(STORAGE_KEY)
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, deviceId)
  }

  return {
    provide: {
      deviceId,
    },
  }
})
