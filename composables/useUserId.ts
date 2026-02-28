/**
 * Composable that returns the current `userId`.
 *
 * **Now (dev):** reads from `runtimeConfig.public.devUserId`.
 * **Later (OIDC):** swap to read from an auth session / token `sub`.
 */
export function useUserId(): string {
  const config = useRuntimeConfig()
  const userId = (config.public as Record<string, unknown>).devUserId as string
  if (!userId) {
    throw new Error(
      'No userId configured – set NUXT_PUBLIC_DEV_USER_ID or runtimeConfig.public.devUserId'
    )
  }
  return userId
}
