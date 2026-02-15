# Simple Record

A simple, offline-first Progressive Web App (PWA) for recording events or timestamps with a single click.

## Features

- **One-click event recording:** Capture timestamps instantly.
- **Event Log:** View all recorded timestamps in a clean, chronological list.
- **Offline Support:** Fully functional without an internet connection.
- **Local Data Storage:** All data is stored in your browser using IndexedDB, so it persists between sessions.

## Tech Stack

- **Framework:** [Nuxt](https://nuxt.com/)
- **UI Library:** [Vue.js](https://vuejs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Offline Storage:** [Dexie.js](https://dexie.org/) (for IndexedDB)
- **PWA:** [@vite-pwa/nuxt](https://vite-pwa-org.netlify.app/frameworks/nuxt.html)
- **Testing:** [Vitest](https://vitest.dev/)

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/simple-record.git
   cd simple-record
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

## Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run preview`: Locally previews the production build.
- `npm run test`: Runs the test suite.
