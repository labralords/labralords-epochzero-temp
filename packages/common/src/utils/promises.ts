export const wait = (ms: number): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export const allowToFail = async (p: Promise<void>): Promise<void> => {
  try {
    return await p;
  } catch {
    return undefined;
  } // eslint-disable-line no-empty
};

export const promiseTimeout = <T = any>(promise: Promise<T>, time: number, errorMessage?: string): Promise<T> => {
  // Create a promise that rejects in <ms> milliseconds
  let id: NodeJS.Timer;
  const timeout = new Promise<void>((_resolve, reject) => {
    id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(errorMessage || `Timed out in ${time}ms.`));
    }, time);
  });

  // Returns a race between our timeout and the passed in promise
  return Promise.race([promise, timeout]).then((result) => {
    clearTimeout(id);
    return result as T;
  });
};

export const promiseRetry = async <T = any>(
  promise: () => Promise<T>,
  retriesLeft = 3,
  interval = 1000,
  exponential = false,
): Promise<T> => {
  try {
    return await promise();
  } catch (error) {
    if (retriesLeft === 1) {
      throw error;
    }
    await wait(interval);
    return promiseRetry(promise, retriesLeft - 1, exponential ? interval * 2 : interval, exponential);
  }
};

export default { wait, allowToFail, promiseTimeout };
