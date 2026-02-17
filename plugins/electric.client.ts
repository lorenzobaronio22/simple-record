import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '~/db/schema';
import { migrate } from '~/db/migrate';
import { usePGlite } from '#imports';

export default defineNuxtPlugin(async (nuxtApp) => {
  const pgliteClient = usePGlite();
  const db = drizzle(pgliteClient, { schema });

  // nuxtApp.provide('db', db);

  await migrate(db);

  return {
    provide: {
      db,
    },
  };
});