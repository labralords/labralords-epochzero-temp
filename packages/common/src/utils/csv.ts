import _ from 'lodash';

export const makeCsvData = <T = any>(entries: T[], headers: (keyof T)[], includeHeaders = true) => {
  const rows = entries.map((c) =>
    _.sortBy(
      (Object.entries(c) as [keyof T, T][]).filter(([key]) => headers.includes(key)),
      ([key]) => headers.indexOf(key),
    ).map(([__, value]) => (typeof value === 'string' ? `"${value.replace(/\n/g, '\\n')}"` : value)),
  );
  return includeHeaders ? [headers, ...rows] : rows;
};

export const formatCsv = (csvData: Record<string, any>[]) => csvData.map((c) => c.join(',')).join('\n');
