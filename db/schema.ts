import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';

export const events = pgTable('events', {
  id: uuid('id').primaryKey(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
});
