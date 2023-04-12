import { Period, toPgInterval } from '@labralords/common';
import _ from 'lodash';
import { NftCollectionDatabaseEntry, TradeStatistics, NftDatabaseEntry } from '../contracts';
import { sql } from './client';
import { fetchColumns as nftFetchColumns, getNftsByCollectionId } from './nfts';

export const tableName = 'collections';

export const fetchColumns: (keyof NftCollectionDatabaseEntry)[] = [
  'id',
  'name',
  'description',
  'source',
  'source_collection_id',
  'network',
  'has_valid_ranks',
  'has_custom_ranks',
  'has_preset_ranks',
  'included_in_trial',
  'show_placeholder_only',
  'nfts_minted',
  'nft_count',
  'mint_price',
  'owner_address',
  'royalties_fee',
  'available_from',
  'twitter_username',
  'discord_username',
  'collection_content_updated_at',
  'rejected',
  'created_at',
  'updated_at',
];

export const updateColumns: (keyof NftCollectionDatabaseEntry)[] = fetchColumns.filter(
  (column) => !['id'].includes(column),
);

export const upsertColumns: (keyof NftCollectionDatabaseEntry)[] = updateColumns;

export const listNftCollections = async (): Promise<NftCollectionDatabaseEntry[]> => {
  const collections = await sql<NftCollectionDatabaseEntry[]>`
    select
      ${sql(fetchColumns)}
    from ${sql(tableName)}
    order by lower(name) asc
  `;
  return collections;
};

export const listNftCollectionsWithTradeStats = async (
  requestedOffset: number,
  requestedLimit: number,
  requestedSortBy: string,
  requestedSortOrder: string,
  requestedSearchQuery: string,
  requestedTimeSpan: Period,
  collectionIds?: string[],
  network = 'smr',
): Promise<(NftCollectionDatabaseEntry & TradeStatistics)[]> => {
  const offset = Math.max(0, requestedOffset || 0);
  const limit = Math.min(100, Math.max(1, requestedLimit || 50));
  const sortBy = requestedSortBy || 'volume';
  const sortOrder = requestedSortOrder === 'desc' ? 'desc' : 'asc';
  const searchQuery = requestedSearchQuery || '';
  const timeSpan = toPgInterval(requestedTimeSpan || '1 month');
  const collections = await sql<(NftCollectionDatabaseEntry & TradeStatistics)[]>`
    select
        ${sql(fetchColumns.map((column) => `collection.${column}`))},
        count(trades.sale_price) as "numberOfTrades",
        coalesce(sum(trades.sale_price),0)::bigint as volume,
        coalesce(avg(trades.sale_price),0)::bigint as "averagePrice"
      from ${sql(tableName)} as collection
      left join ${sql('trades')} as trades on collection.id = trades.collection_id
        and trades.network = ${network} and trades.type = 'buy'
        ${network === 'iota' ? sql`and trades.sale_price > 1000000` : sql``}
        ${sql.unsafe(timeSpan ? `and trades.timestamp > now() - interval '${timeSpan}'` : '')}
      where collection.rejected = false
      ${searchQuery ? sql`and lower(collection.name) like ${`%${searchQuery.toLowerCase()}%`}` : sql``}
      ${collectionIds?.length ? sql`and collection.id in ${sql(collectionIds)}` : sql``}
    group by collection.id
      order by ${sql(sortBy)} ${sql.unsafe(sortOrder)} nulls last
      limit ${limit}
      offset ${offset}
  `;
  return collections;
};

export const count = async (requestedSearchQuery = '', collectionIds: string[] = []): Promise<{ total: number }> => {
  const searchQuery = requestedSearchQuery || '';
  const countData = await sql<{ total: number }[]>`
    select
      count(id) as "total"
    from ${sql(tableName)} as collection
    ${searchQuery ? sql`where lower(collection.name) like ${`%${searchQuery.toLowerCase()}%`}` : sql``}
    ${
      collectionIds?.length
        ? searchQuery
          ? sql`and collection.id in ${sql(collectionIds)}`
          : sql`where collection.id in ${sql(collectionIds)}`
        : sql``
    }
  `;
  return countData?.[0] || { total: 0 };
};

export const getNftCollectionById = async (id: string): Promise<NftCollectionDatabaseEntry> => {
  const entries = await sql<NftCollectionDatabaseEntry[]>`
    select
      ${sql(fetchColumns)}
    from ${sql(tableName)}
    where id = ${id}
  `;
  return entries[0];
};

export const upsertNftCollection = async (entry: NftCollectionDatabaseEntry): Promise<NftCollectionDatabaseEntry[]> => {
  const updated = await sql`
    update ${sql(tableName)}
      set ${sql(entry, ...updateColumns)}
    where id = ${entry.id}
  `;
  return updated.values()[0];
};

export const setHasValidTraits = async (
  id: string,
  { hasValidTraits, traitsFieldName }: { hasValidTraits: boolean; traitsFieldName: string },
): Promise<NftCollectionDatabaseEntry[]> => {
  const updated = await sql`
    update ${sql(tableName)}
      set has_valid_ranks = ${hasValidTraits},
      traits_field_name = ${traitsFieldName}
    where id = ${id}
  `;
  return updated.values()[0];
};

export const upsertNftCollectionBatch = async (
  entries: Partial<NftCollectionDatabaseEntry>[],
): Promise<{
  touched: number;
  items: NftCollectionDatabaseEntry[];
}> => {
  const result = await sql<NftCollectionDatabaseEntry[]>`
    insert into ${sql(tableName)} ${sql(entries, ...fetchColumns)} on conflict (source, source_collection_id) do update
    set
      name = excluded.name,
      description = excluded.description,
      network = excluded.network,
      nfts_minted = excluded.nfts_minted,
      nft_count = excluded.nft_count,
      mint_price = excluded.mint_price,
      royalties_fee = excluded.royalties_fee,
      available_from = excluded.available_from,
      twitter_username = excluded.twitter_username,
      discord_username = excluded.discord_username,
      owner_address = excluded.owner_address,
      rejected = excluded.rejected,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at
    returning ${sql(fetchColumns)}
  `;
  return { touched: result.count, items: result };
};

export const getCollectionUpdatedAfter = async (timestamp: string): Promise<NftCollectionDatabaseEntry[]> => {
  const collections = await sql<NftCollectionDatabaseEntry[]>`
    select
      ${sql(fetchColumns)}
    from ${sql(tableName)}
    where collection_content_updated_at >= ${timestamp || new Date(0).toISOString()}
  `;
  return collections;
};

export const setCollectionContentUpdatedAt = async (
  collectionIds: string[],
  contentUpdatedAt: string,
): Promise<void> => {
  await sql<NftCollectionDatabaseEntry[]>`
    update ${sql(tableName)}
    set collection_content_updated_at = ${contentUpdatedAt}
    where id in ${sql(collectionIds)}
  `;
};

export const getCollectionIdMap = async (sourceCollectionIds: string[]) => {
  if (sourceCollectionIds.length === 0) {
    return {};
  }
  const result = await sql<{ source_collection_id: string; id: string }[]>`
    select source_collection_id, id from ${sql(tableName)} where source_collection_id in ${sql(sourceCollectionIds)}
  `;
  return Object.fromEntries(result.map((row) => [row.source_collection_id, row.id]));
};

export const collectionHasPublicAccess = async (collectionId: string): Promise<boolean> => {
  const result = await sql<{ count: number }[]>`
    select
      count(*) as "count"
    from ${sql(tableName)} as c
    join ${sql('users')} as u on u.eth_address = c.owner_address
    where c.id = ${collectionId}
      and access = true
  `;
  return result[0].count > 0;
};

export const userOwnsCollection = async (address: string, collectionId: string): Promise<boolean> => {
  const result = await sql<{ count: number }[]>`
    select
      count(*) as "count"
    from ${sql(tableName)} as c
    where c.id = ${collectionId}
      and c.owner_address = ${address}
  `;
  return result[0].count > 0;
};

export const getCollectionsByOwner = async (
  ownerAddress: string,
  requestedOffset: number,
  requestedLimit: number,
  requestedSortBy: string,
  requestedSortOrder: string,
  requestedSearchQuery: string,
  requestedTimeSpan: Period,
  network = null,
): Promise<(NftCollectionDatabaseEntry & TradeStatistics)[]> => {
  const offset = Math.max(0, requestedOffset || 0);
  const limit = Math.min(100, Math.max(1, requestedLimit || 50));
  const sortBy = requestedSortBy || 'volume';
  const sortOrder = requestedSortOrder === 'desc' ? 'desc' : 'asc';
  const searchQuery = requestedSearchQuery || '';
  const timeSpan = toPgInterval(requestedTimeSpan || '1 month');
  const result = await sql<(NftCollectionDatabaseEntry & TradeStatistics)[]>`
    select
      ${sql(fetchColumns.map((column) => `c.${column}`))},
      count(trades.sale_price) as "numberOfTrades",
      coalesce(sum(trades.sale_price),0)::bigint as volume,
      coalesce(avg(trades.sale_price),0)::bigint as "averagePrice"
    from ${sql(tableName)} as c
    left join ${sql('trades')} as trades on c.id = trades.collection_id
      and trades.sale_price > 1000000
      ${network ? sql`and trades.network = ${network}` : sql``}
      ${sql.unsafe(timeSpan ? `and trades.timestamp > now() - interval '${timeSpan}'` : '')}
      where c.owner_address = ${ownerAddress}
      ${searchQuery ? sql`and lower(c.name) like ${`%${searchQuery.toLowerCase()}%`}` : sql``}
    group by c.id
    order by ${sql(sortBy)} ${sql.unsafe(sortOrder)} nulls last
      limit ${limit}
      offset ${offset}
  `;
  return result;
};

export const updateRanks = async (
  collectionId: string,
  ranks: { id: string; name: string; rank: number; uri: string }[],
): Promise<void> => {
  const rankById = _.keyBy(ranks, 'id');
  const nfts = await getNftsByCollectionId(collectionId);
  await sql<NftDatabaseEntry[]>`
    insert into ${sql('nfts')} ${sql(
    nfts.map((nft) => ({
      ...nft,
      rank: rankById[nft.id]?.rank || null,
    })),
    ...nftFetchColumns,
  )} on conflict (id) do update
    set
    rank = excluded.rank
  `;
};

export const updateRanksByName = async (
  collectionId: string,
  ranks: { name: string; rank: number }[],
): Promise<void> => {
  const rankByName = _.keyBy(ranks, 'name');
  const nfts = await getNftsByCollectionId(collectionId);
  await sql<NftDatabaseEntry[]>`
    insert into ${sql('nfts')} ${sql(
    nfts.map((nft) => ({
      ...nft,
      rank: rankByName[nft.name]?.rank || null,
    })),
    ...nftFetchColumns,
  )} on conflict (id) do update
    set
    rank = excluded.rank
  `;
};

export const setPresetRanksAvailable = async (collectionId: string, available: boolean): Promise<void> => {
  await sql`
    update ${sql(tableName)} set
      has_valid_ranks = true,
      has_custom_ranks = true,
      has_preset_ranks = ${available}
    where id = ${collectionId}
  `;
};
