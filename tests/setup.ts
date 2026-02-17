import 'fake-indexeddb/auto'
import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Mock NuxtLink for all tests
config.global.components = {
  NuxtLink: {
    template: '<a><slot /></a>',
  },
}
