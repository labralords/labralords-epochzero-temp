import _ from 'lodash';
import { NftDatabaseEntry, RankDatabaseEntry } from '../contracts';
import { sql } from './client';

export const tableName = 'ranks';

export const fetchColumns: (keyof RankDatabaseEntry)[] = ['collection_id', 'name', 'rank'];

export const updateColumns: (keyof RankDatabaseEntry)[] = fetchColumns;

export const updateRanksBatch = async (
  rankData: Partial<RankDatabaseEntry>[],
): Promise<{
  inserted: number;
  items: RankDatabaseEntry[];
}> => {
  const batches: Partial<RankDatabaseEntry>[][] = [];
  let updated = 0;
  const maxParameterCount = 65_534;
  const maxEntryCount = Math.floor(maxParameterCount / updateColumns.length);
  while (updated < rankData.length) {
    batches.push(rankData.slice(updated, updated + maxEntryCount));
    updated += maxEntryCount;
  }
  const promises = batches.map(
    async (batch) => sql<NftDatabaseEntry[]>`
      insert into ${sql(tableName)} ${sql(batch, ...updateColumns)} on conflict (collection_id, name) do update
      set
        rank = excluded.rank
      returning ${sql(fetchColumns)}
    `,
  );
  const result = await Promise.all(promises);
  const inserted = result.reduce((accumulator, current) => accumulator + current.count, 0);
  return { inserted, items: result.flat() };
};

export const getRanksByName = async (collectionId: string): Promise<Record<string, RankDatabaseEntry>> => {
  const result = await sql<RankDatabaseEntry[]>`
    select ${sql(fetchColumns)} from ${sql(tableName)} where collection_id = ${collectionId}
  `;
  return _.keyBy(result, 'name');
};
