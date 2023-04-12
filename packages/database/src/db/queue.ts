import _ from 'lodash';
import { FetchQueueEntry } from '../contracts';
import { sql } from './client';

export const tableName = 'collection_fetch_queue';

export const getNextBatch = async (
  type: 'listings' | 'metadata' | 'trades',
  limit = 50,
  timeout = '5 minutes',
): Promise<FetchQueueEntry[]> => {
  try {
    // TODO: CASE WHEN b.b1 is NULL THEN 5 ELSE b.b2 END AS b2
    const [collections] = await sql.begin(async (transaction) => {
      const intervalString = `now() - interval '${timeout}'`;
      const fetchedCollections = await transaction<FetchQueueEntry[]>`
        select
          c.id as collection_id,
          c.source_collection_id as source_collection_id,
          c.source as source,
          q.id as id,
          CASE WHEN q.type is NULL THEN ${type} ELSE q.type END as type,
          CASE WHEN  q.fetched_at is NULL THEN '2000-01-01T00:00:00Z' ELSE q.fetched_at END AS fetched_at,
          q.locked_at as locked_at
        from ${sql('collections')} as c
        left join (
          select * from ${sql(tableName)} where type = ${type}
        ) as q on q.collection_id = c.id
        where (q.fetched_at < ${sql.unsafe(
          intervalString,
        )} or q.fetched_at is null) and (q.locked_at is null or q.locked_at < ${sql.unsafe(intervalString)})
        or c.source_collection_id in ('0x4254fba1c5e487b44f415072230f4148c6c03d1f', '0xc95de0524b2112a36701b9d3465e61772ae6ce8e', '0xe74eefe6d367bee07c88b167524036c03e74bed5')
        order by
          CASE c.source_collection_id
            WHEN '0x4254fba1c5e487b44f415072230f4148c6c03d1f' THEN 1
            WHEN '0xc95de0524b2112a36701b9d3465e61772ae6ce8e' THEN 2
            WHEN '0xe74eefe6d367bee07c88b167524036c03e74bed5' THEN 3
            ELSE 4
          END, q.fetched_at asc NULLS FIRST
        limit ${limit}
      `;
      if (fetchedCollections.length === 0) {
        return [[]];
      }
      const queueItems = fetchedCollections.map((c) => ({
        collection_id: c.collection_id,
        type,
        locked_at: new Date(),
        locked: true,
      }));
      await transaction`
        insert into ${sql(tableName)} ${sql(queueItems, 'collection_id', 'type', 'locked', 'locked_at')}
        on conflict (collection_id, type) do update set locked = true, locked_at = now()
      `;
      return [fetchedCollections];
    });
    return collections;
  } catch (error) {
    console.error(`Failed to get batch: ${error}`);
    return [];
  }
};

export const confirmBatch = async (
  type: 'listings' | 'metadata' | 'trades',
  collectionIds: string[],
): Promise<void> => {
  try {
    const updateRows = collectionIds.map((collectionId) => ({
      type,
      collection_id: collectionId,
      fetched_at: new Date(),
      locked: false,
      locked_at: null,
    }));
    if (updateRows.length > 0) {
      await sql`
        insert into ${sql(tableName)} ${sql(updateRows, 'type', 'collection_id', 'fetched_at', 'locked', 'locked_at')}
        on conflict (collection_id, type) do update set locked = false, locked_at = null, fetched_at = now()
      `;
    }
  } catch (error) {
    throw new Error(`Failed to confirm batch: ${error}`);
  }
};
