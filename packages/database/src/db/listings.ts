import _ from 'lodash';
import { Period, toPgInterval, validatePeriod } from '@labralords/common';
import { ListingDatabaseEntry } from '../contracts';
import { sql } from './client';

export const tableName = 'listings';

export const fetchColumns: (keyof ListingDatabaseEntry)[] = [
  'id',
  'collection_id',
  'nft_id',
  'timestamp',
  'list_price',
  'owner_address',
];

export const updateColumns: (keyof ListingDatabaseEntry)[] = fetchColumns.filter(
  (column) => !['id', 'nft_id'].includes(column),
);

export const upsertColumns: (keyof ListingDatabaseEntry)[] = fetchColumns;

export const getListingHistoryByCollection = async (
  collectionId: string,
  period: Period = '1 week',
): Promise<ListingDatabaseEntry[]> => {
  if (!validatePeriod(period)) {
    throw new Error(`Invalid period: ${period}`);
  }
  const interval = toPgInterval(period);
  const minDate = `now() - interval '${interval}'`;
  return sql<ListingDatabaseEntry[]>`
    select
      ${sql(fetchColumns)}
    from ${sql(tableName)}
    where
      timestamp > ${sql.unsafe(minDate)}
      and timestamp <= now()
      and collection_id = ${collectionId}
    order by timestamp desc
  `;
};

export const getListingById = async (id: string): Promise<ListingDatabaseEntry> => {
  const entries = await sql<ListingDatabaseEntry[]>`
    select
      ${sql(fetchColumns)}
    from ${sql(tableName)}
    where id = ${id}
  `;
  return entries[0];
};

export const insertBatch = async (
  entries: ListingDatabaseEntry[],
): Promise<{
  inserted: number;
  items: ListingDatabaseEntry[];
}> => {
  const result = await sql<ListingDatabaseEntry[]>`
    insert into ${sql(tableName)} ${sql(entries, ...upsertColumns)} on conflict (nft_source_id) do update
    set
      timestamp = excluded.timestamp,
      list_price = excluded.list_price,
      owner_address = excluded.owner_address
    returning ${sql(fetchColumns)}
  `;
  return { inserted: result.count, items: result };
};
