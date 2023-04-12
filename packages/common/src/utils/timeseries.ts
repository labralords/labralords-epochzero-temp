export type Period =
  | '1 minute'
  | '5 minutes'
  | '15 minutes'
  | '1 hour'
  | '4 hours'
  | '12 hours'
  | '1 day'
  | '3 days'
  | '1 week'
  | '2 weeks'
  | '1 month'
  | '2 months'
  | '3 months'
  | '6 months'
  | '1 year'
  | '2 years'
  | 'all';

export const periods: Set<Period> = new Set<Period>([
  '1 minute',
  '5 minutes',
  '15 minutes',
  '1 hour',
  '4 hours',
  '12 hours',
  '1 day',
  '3 days',
  '1 week',
  '2 weeks',
  '1 month',
  '2 months',
  '3 months',
  '6 months',
  '1 year',
  '2 years',
  'all',
]);

export const validatePeriod = (period: Period) => periods.has(period);

export const toPgInterval = (period: Period) => {
  if (period === 'all') return '';
  if (periods.has(period)) return period;

  throw new Error(`Invalid period: ${period}`);
};
