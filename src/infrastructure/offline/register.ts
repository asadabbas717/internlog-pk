export type OfflineStatus =
  'checking' | 'ready' | 'unavailable' | 'development';

export async function prepareOffline(
  production: boolean,
): Promise<OfflineStatus> {
  if (!production) return 'development';
  if (!('serviceWorker' in navigator)) return 'unavailable';
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    // Installation only succeeds after the entire precache has been stored.
    await Promise.race([
      (async () => {
        await navigator.serviceWorker.register(
          `${import.meta.env.BASE_URL}sw.js`,
        );
        await navigator.serviceWorker.ready;
      })(),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => {
          reject(new Error('Offline setup timed out'));
        }, 15000);
      }),
    ]);
    return 'ready';
  } catch {
    return 'unavailable';
  } finally {
    clearTimeout(timeout);
  }
}
