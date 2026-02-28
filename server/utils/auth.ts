/**
 * Auth helper – single abstraction for extracting `userId`.
 *
 * **Now (dev):** reads `x-user-id` header.
 * **Later (OIDC/Keycloak):** validate token and return `sub`.
 */
import type { H3Event } from 'h3'

export function requireUserId(event: H3Event): string {
  const userId = getHeader(event, 'x-user-id')
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Missing x-user-id header' })
  }
  return userId
}
