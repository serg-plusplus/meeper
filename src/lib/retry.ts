export async function retry<T>(
  action: () => Promise<T>,
  delay = 100,
  attempts = 10
): Promise<T> {
  try {
    return await action();
  } catch (err) {
    if (attempts > 0) {
      await new Promise((r) => setTimeout(r, delay));
      return retry(action, delay, attempts - 1);
    }

    throw err;
  }
}
