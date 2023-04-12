import _ from 'lodash';
import type { Order } from './contracts';

export const toRoundedString = (value: number): string => {
  return value.toFixed(1);
};

export const getPriceObject = (price: number, network: string) => {
  if (Number.isNaN(price)) {
    return { value: Number.NaN, unit: '' };
  }

  if (network === 'smr') {
    return { value: price / 1_000_000, unit: 'SMR' };
  }

  if (price / 1_000_000 < 1000) {
    return {
      value: price / 1_000_000,
      unit: 'Mi',
    };
  }
  if (price / 1_000_000_000 < 1000) {
    return {
      value: price / 1_000_000_000,
      unit: 'Gi',
    };
  }
  return {
    value: price / 1_000_000_000_000,
    unit: 'Ti',
  };
};

export const getPrice = (price: number, network: string) => {
  const p = getPriceObject(price, network);
  if (Number.isNaN(p)) {
    return 'N/A';
  }
  return `${toRoundedString(p.value)} ${p.unit}`;
};

export const humanizeNumber = (stat: number, digits = 0) => {
  if (stat === 0) {
    return '0';
  }
  if (!stat) {
    return 'N/A';
  }
  if (stat < 1000) {
    return stat.toFixed(digits);
  }
  if (stat < 1_000_000) {
    return `${(stat / 1000).toFixed(1)}k`;
  }
  if (stat < 1_000_000_000) {
    return `${(stat / 1_000_000).toFixed(1)}m`;
  }
  return `${(stat / 1_000_000_000).toFixed(1)}b`;
};

export const iota = 1000;
export const miota = 1000 * iota;
export const giota = 1000 * miota;
export const tiota = 1000 * giota;

export const getInterQuartileRange = (data: number[] = []) => {
  const n = data.length;
  if (n === 0) {
    return 0;
  }
  const sorted = data.sort((a, b) => a - b);
  const q1 = sorted[Math.floor(n / 4)];
  const q3 = sorted[Math.floor((n * 3) / 4)];
  return q3 - q1;
};

export const sortDateString = (a: string, b: string, order: 'asc' | 'desc') => {
  const aDate = new Date(Number.parseInt(a, 10));
  const bDate = new Date(Number.parseInt(b, 10));
  if (order === 'asc') {
    return bDate.getTime() - aDate.getTime();
  }
  return aDate.getTime() - bDate.getTime();
};

export const sortNumber = (a: number, b: number, order: 'asc' | 'desc') => (order === 'asc' ? a - b : b - a);

// export const probeContentType = (url: string): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     const xhr = new XMLHttpRequest();
//     xhr.open('HEAD', url.slice(0, url.includes('?') ? url.indexOf('?') : url.length));
//     const removeListeners = () => {
//       // eslint-disable-next-line @typescript-eslint/no-use-before-define
//       xhr.removeEventListener('load', onLoad);
//       // eslint-disable-next-line @typescript-eslint/no-use-before-define
//       xhr.removeEventListener('error', onError);
//     };
//     const onLoad = () => {
//       try {
//         removeListeners();
//         const body = xhr.response;
//         const meta = JSON.parse(body);
//         resolve(meta?.contentType);
//       } catch (error) {
//         reject(error);
//       }
//     };
//     const onError = () => {
//       removeListeners();
//       reject(new Error(`Failed to probe content type for ${url}: ${xhr.statusText}`));
//     };

//     xhr.addEventListener('load', onLoad);
//     xhr.addEventListener('error', onError);

//     xhr.send();
//   });
// };

export const promiseRetryWithBackoff = async <T>(
  function_: () => Promise<T>,
  maxRetries = 30,
  backoff = 1000,
): Promise<T> => {
  try {
    return await function_();
  } catch (error) {
    if (maxRetries === 0) {
      throw error;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, backoff);
    });
    return promiseRetryWithBackoff(function_, maxRetries - 1, Math.min(backoff * 2, 60_000));
  }
};

export const setQueryStrings = (queryStrings: Record<string, string>) => {
  // TODO: use svelte navigators history
  const urlObject = new URL(window.location?.href);
  for (const [key, value] of Object.entries(queryStrings)) {
    urlObject.searchParams.set(key, value);
  }
  window.history?.pushState({}, '', urlObject.toString());
};

export const getQueryStrings = () => {
  const urlSearchParameters = new URLSearchParams(window.location.search);
  const parameters = Object.fromEntries(urlSearchParameters.entries());
  return parameters;
};

export const validateOrder = (v: string): Order => (['asc', 'desc'].includes(v) ? (v as Order) : null);
export const validateTimeSpan = (v: string) =>
  ['1 day', '1 week', '1 month', '3 months', '6 months', '1 year', 'all'].includes(v) ? v : null;

export const availableTimeSpans = [
  { label: '1D', value: '1 day' },
  { label: '1W', value: '1 week' },
  { label: '1M', value: '1 month' },
  { label: '3M', value: '3 months' },
  { label: '6M', value: '6 months' },
  { label: '1Y', value: '1 year' },
  { label: 'All', value: 'all' },
];

export const formatAddress = (address: string) => {
  if (!address) {
    return '';
  }
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};

export const isMetaMaskInstalled = () => {
  const { ethereum } = window as any;
  return Boolean(ethereum && ethereum.isMetaMask);
};

export const isBrowser = typeof window !== 'undefined';
export const isNode = !isBrowser;
export const userAgent = isBrowser ? _.get(window, 'navigator.userAgent') : '';
export const hasEthereum = isBrowser && _.has(window, 'ethereum');
export const isAndroid = /(android)/i.test(userAgent);
export const isIphone = /(iphone|ipod)/i.test(userAgent);
export const isIpad = /(ipad)/i.test(userAgent);
export const isMobile = isIphone || isAndroid;
// A mobile browser with ethereum we assume it's Metamask Browser
export const isMetamask = isMobile && hasEthereum;
