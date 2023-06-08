export async function retry<T>(
  action: () => Promise<T>,
  delay = 100,
  retries = 10
): Promise<T> {
  try {
    return await action();
  } catch (err) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, delay));
      return retry(action, delay, retries - 1);
    }

    throw err;
  }
}

// It simply doesn't allow the provided function to be executed in parallel.
export function promiseQueue() {
  let worker: Promise<unknown> | null = null;

  return <T>(factory: () => Promise<T>) => {
    if (!worker) {
      worker = factory().finally(() => {
        worker = null;
      });
    }

    return worker as Promise<T>;
  };
}

export function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
  const ret: any = {};
  keys.forEach((key) => {
    ret[key] = obj[key];
  });
  return ret;
}
