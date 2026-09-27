/**
 * Resilient fetch utility that automatically retries on transient network disconnects
 * or when the development server is spinning up.
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {},
  retries = 2,
  delayMs = 400
): Promise<Response> {
  let attempt = 0;
  while (true) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (err: any) {
      attempt++;
      if (attempt > retries) {
        if (err?.message === 'Failed to fetch' || err?.name === 'TypeError') {
          throw new Error('Connection to the server failed. Please ensure the server is running and try again.');
        }
        throw err;
      }
      // Wait before next attempt
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
}
