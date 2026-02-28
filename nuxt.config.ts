// https://nuxt.com/docs/api/configuration/nuxt-config
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@vite-pwa/nuxt'],
  vite: {
    plugins: [wasm(), topLevelAwait()],
    optimizeDeps: {
      exclude: ['@automerge/automerge'],
    },
  },
  runtimeConfig: {
    /** Server-only: path to the SQLite database file (volume-mounted). */
    sqlitePath: '/data/simple-record.sqlite',
    public: {
      /** Dev-only stand-in for an OIDC subject; override via NUXT_PUBLIC_DEV_USER_ID. */
      devUserId: 'dev-user',
    },
  },
  pwa: {
    manifest: {
      name: 'Simple Record',
      short_name: 'Recorder',
      description: 'A simple event recording app',
      theme_color: '#ffffff',
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
})
