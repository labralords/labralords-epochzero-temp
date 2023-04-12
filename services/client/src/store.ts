import { writable } from 'svelte/store';
import type { Notification } from './services/notifications';
import { getQueryStrings } from './util';

export const isAuthenticated = writable(false);
export const user = writable({});
export const authError = writable();

const queryStrings = getQueryStrings();
const validateNetwork = (v: string): string => (['smr', 'iota'].includes(v) ? v : null);
export const selectedNetwork = writable(
  validateNetwork(queryStrings?.network) || localStorage.getItem('network') || 'iota',
);

export const notifications = writable<Notification[]>([]);
