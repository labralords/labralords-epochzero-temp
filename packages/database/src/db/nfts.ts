import { TraitFilter, HistogramData } from '@labralords/common';
import _ from 'lodash';
import { NftDatabaseEntry } from '../contracts';
import { sql } from './client';
import { getTraitClauses } from './common';

export const tableName = 'nfts';

export const fetchColumns: (keyof NftDatabaseEntry)[] = [
  'id',
  'name',
  'source',
  'source_nft_id',
  'network',
  'current_price',
  'owner_address',
  'owner_type',
  'is_listed',
  'is_auctioned',
  'listed_at',
  'rank',
  'created_at',
  'updated_at',
  'collection_id',
  'raw_traits',
  'raw_stats',
  'media_source',
  'media_url',
  'missing_metadata',
];

export const updateColumns: (keyof NftDatabaseEntry)[] = fetchColumns.filter((column) => !['id'].includes(column));

export const upsertColumns: (keyof NftDatabaseEntry)[] = updateColumns;

export const listNfts = async (): Promise<NftDatabaseEntry[]> => {
  return sql<NftDatabaseEntry[]>`
    select
      ${sql(fetchColumns)}
    from ${sql(tableName)}
    order by lower(name) asc
  `;
};

export const getNftsBySourceCollectionId = async (sourceCollectionId: string): Promise<NftDatabaseEntry[]> => {
  const result = await sql<
    { id: string }[]
  >`select id from collections where source_collection_id = ${sourceCollectionId}`;

  if (!result?.length) {
    throw new Error(`Collection with source id ${sourceCollectionId} not found`);
  }
  const { id } = result[0];
  return sql<NftDatabaseEntry[]>`
    select
      ${sql(fetchColumns)}
    from ${sql(tableName)}
    where collection_id = ${id}
  `;
};

export const getNftById = async (id: string): Promise<NftDatabaseEntry> => {
  const entries = await sql<NftDatabaseEntry[]>`
    select
      ${sql(fetchColumns)}
    from ${sql(tableName)}
    where id = ${id}
  `;
  return entries[0];
};

export const upsertNft = async (entry: NftDatabaseEntry): Promise<NftDatabaseEntry[]> => {
  const updated = await sql`
    update ${sql(tableName)}
      set ${sql(entry, ...updateColumns)}
    where id = ${entry.id}
  `;
  return updated.values()[0];
};

export const count = async (collectionId: string): Promise<number> => {
  const result = await sql`
    select count(*) from ${sql(tableName)}
    where collection_id = ${collectionId}
  `;
  return result?.[0]?.count || 0;
};

export const upsertNftBatch = async (
  entries: NftDatabaseEntry[],
): Promise<{
  touched: number;
  items: NftDatabaseEntry[];
}> => {
  const result = await sql<NftDatabaseEntry[]>`
    insert into ${sql(tableName)} ${sql(entries, ...upsertColumns)} on conflict (source, source_nft_id) do update
    set
      "name" = EXCLUDED."name",
      "source" = EXCLUDED."source",
      "source_nft_id" = EXCLUDED."source_nft_id",
      "collection_id" = EXCLUDED."collection_id",
      "media_source" = EXCLUDED."media_source",
      "media_url" = EXCLUDED."media_url",
      "raw_traits" = EXCLUDED."raw_traits",
      "raw_stats" = EXCLUDED."raw_stats",
      "current_price" = EXCLUDED."current_price",
      "owner_address" = EXCLUDED."owner_address",
      "owner_type" = EXCLUDED."owner_type",
      "network" = EXCLUDED."network",
      "listed_at" = EXCLUDED."listed_at",
      "is_listed" = EXCLUDED."is_listed",
      "is_auctioned" = EXCLUDED."is_auctioned",
      "missing_metadata" = EXCLUDED."missing_metadata",
      "created_at" = EXCLUDED."created_at",
      "updated_at" = EXCLUDED."updated_at"
    returning ${sql(fetchColumns)}
  `;
  return { touched: result.count, items: result };
};

export const getNftIdMappings = async (collectionId: string): Promise<NftDatabaseEntry[]> => {
  return sql<NftDatabaseEntry[]>`
    select
      id,
      source_nft_id
    from ${sql(tableName)}
    where
      collection_id = ${collectionId}
  `;
};

export const getNftIds = async (
  sourceNftIds: string[],
): Promise<Record<string, { id: string; collectionId: string }>> => {
  if (sourceNftIds.length === 0) {
    return {};
  }
  const result = await sql<NftDatabaseEntry[]>`
    select
      id,
      collection_id,
      source_nft_ids.source_id as source_nft_id
    from ${sql(tableName)}
    full join (select unnest(${sql.array(sourceNftIds.filter((id) => !!id))}) as source_id) as source_nft_ids
    on source_nft_ids.source_id = nfts.source_nft_id
    where nfts.source_nft_id is not null and source_nft_ids.source_id is not null
  `;
  return Object.fromEntries(
    result.map((entry) => [entry.source_nft_id, { id: entry.id, collectionId: entry.collection_id }]),
  );
};

export const getMemberPortfolio = async (
  address: string,
  offset = 0,
  limit = 50,
  sortBy = 'listed_at',
  sortOrder = 'desc',
  searchQuery = '',
  traitFilters: TraitFilter[] = [],
): Promise<NftDatabaseEntry[]> => {
  const nfts = await sql<NftDatabaseEntry[]>`
    select
      ${sql(fetchColumns.map((column) => `n.${column}`))}
    from ${sql(tableName)} as n
    where
      owner_address = ${address}
      ${searchQuery ? sql`and lower(name) like ${`%${searchQuery.toLowerCase()}%`}` : sql``}
      ${traitFilters.length > 0 ? sql`and ${sql.unsafe(getTraitClauses(traitFilters))}` : sql``}
    order by ${sql(sortBy)} ${sql.unsafe(sortOrder)}
    ${offset ? sql`offset ${offset}` : sql``}
    ${limit ? sql`limit ${limit}` : sql``}
  `;
  const collectionIds = _.uniq(nfts.map((nft) => nft.collection_id));
  const collections = await sql<{ id: string; floor_price: string; has_valid_ranks: boolean }[]>`
    select
      id,
      has_valid_ranks,
      (select CASE WHEN c.nft_count - c.nfts_minted > 0 AND c.mint_price < current_price THEN c.mint_price ELSE current_price END from nfts as a where a.collection_id = c.id and is_auctioned = false order by current_price asc limit 1) as floor_price
    from ${sql('collections')} as c
    where id in ${sql(collectionIds)}
  `;
  const collectionMap = _.keyBy(collections, 'id');
  return nfts.map((nft) => {
    const { floor_price: floorPrice, has_valid_ranks: hasValidRanks } = collectionMap[nft.collection_id];
    return { ...nft, floor_price: floorPrice, has_valid_ranks: hasValidRanks };
  });
};

export const getCurrentListingsByCollection = async (
  collectionId: string,
  offset = 0,
  limit = 10,
  sortBy = 'listed_at',
  sortOrder = 'desc',
  searchQuery = '',
  traitFilters: TraitFilter[] = [],
  auctions = false,
  network = null,
): Promise<NftDatabaseEntry[]> => {
  return sql<NftDatabaseEntry[]>`
    select
      ${sql(fetchColumns)}
    from ${sql(tableName)} as n
    where
      collection_id = ${collectionId}
      and is_listed = true
      and is_auctioned = ${auctions}
      ${network ? sql`and n.network = ${network}` : sql``}
      ${searchQuery ? sql`and lower(name) like ${`%${searchQuery.toLowerCase()}%`}` : sql``}
      ${traitFilters.length > 0 ? sql`and ${sql.unsafe(getTraitClauses(traitFilters))}` : sql``}
    order by ${sql(sortBy)} ${sql.unsafe(sortOrder)}
    offset ${offset}
    limit ${limit}
  `;
};

export const getGlobalListings = async (
  offset = 0,
  limit = 10,
  sortBy = 'listed_at',
  sortOrder = 'desc',
  searchQuery = '',
  traitFilters: TraitFilter[] = [],
  minPrice = null,
  maxPrice: number = null,
  minRank = null,
  maxRank: number = null,
  collectionIds: string[] = [],
  network: string = null,
): Promise<NftDatabaseEntry[]> => {
  return sql<NftDatabaseEntry[]>`
    select
      ${sql(fetchColumns)}
    from ${sql(tableName)} as n
    where
      is_listed = true
      and listed_at < now()
      and current_price is not null
      and is_auctioned = false
      ${network ? sql`and n.network = ${network}` : sql``}
      ${searchQuery ? sql`and lower(name) like ${`%${searchQuery.toLowerCase()}%`}` : sql``}
      ${traitFilters.length > 0 ? sql`and ${sql.unsafe(getTraitClauses(traitFilters))}` : sql``}
      ${minPrice ? sql`and current_price >= ${minPrice}` : sql``}
      ${maxPrice ? sql`and current_price <= ${maxPrice}` : sql``}
      ${minRank ? sql`and rank >= ${minRank}` : sql``}
      ${maxRank ? sql`and rank <= ${maxRank}` : sql``}
      ${collectionIds?.length ? sql`and collection_id in ${sql(collectionIds)}` : sql``}
    order by ${sql(sortBy)} ${sql.unsafe(sortOrder)}
    offset ${offset}
    limit ${limit}
  `;
};

export const getListPriceHistogram = async (
  collectionId: string,
  groupSize: number,
  nBuckets = 10,
  searchQuery = '',
  traitFilters: TraitFilter[] = [],
  network = 'smr',
): Promise<HistogramData> => {
  const histograms = await sql<HistogramData[]>`
    select
      CAST(${groupSize} as bigint) as "groupSize",
      CAST(${nBuckets} as integer) as "nBuckets",
      histogram(current_price, ${groupSize}, ${groupSize * (nBuckets - 1)}, ${nBuckets - 2}) as data
    from ${sql('nfts')} as n
    where collection_id = ${collectionId} and current_price is not null and is_auctioned = false
    and network = ${network}
    ${searchQuery ? sql`and lower(name) like ${`%${searchQuery.toLowerCase()}%`}` : sql``}
    ${traitFilters.length > 0 ? sql`and ${sql.unsafe(getTraitClauses(traitFilters))}` : sql``}
    group by collection_id
  `;
  const floorHistogram = histograms[0];
  return (
    floorHistogram ??
    ({
      groupSize: groupSize.toString(),
      nBuckets,
      data: [],
    } as HistogramData)
  );
};

export const countListings = async (
  collectionId: string,
  searchQuery = '',
  traitFilters: TraitFilter[] = [],
  auctions = false,
  network: string = null,
): Promise<number> => {
  const result = await sql<{ count: string }[]>`
    select count(*) as count from ${sql(tableName)} as n
    where collection_id = ${collectionId}
    and is_listed = true
    and is_auctioned = ${auctions}
    ${network ? sql`and network = ${network}` : sql``}
    ${searchQuery ? sql`and lower(name) like ${`%${searchQuery.toLowerCase()}%`}` : sql``}
    ${traitFilters.length > 0 ? sql`and ${sql.unsafe(getTraitClauses(traitFilters))}` : sql``}
  `;
  return Number.parseInt(result[0].count, 10) || 0;
};

export const countNewListings = async (collectionId: string): Promise<number> => {
  const result = await sql<{ count: string }[]>`
    select count(*) as count from ${sql(tableName)}
    where collection_id = ${collectionId}
    and is_listed = true
    and is_auctioned = false
    and listed_at > now() - interval '1d'
  `;
  return Number.parseInt(result[0].count, 10) || 0;
};

export const floorPrice = async (collectionId: string): Promise<number> => {
  const result = await sql<{ floorPrice: string }[]>`
    select min(current_price) as "floorPrice" from ${sql(tableName)}
    where collection_id = ${collectionId} and current_price > 0 and is_auctioned = false
  `;
  return Number.parseInt(result[0].floorPrice, 10) || 0;
};

export const uniqueHolders = async (collectionId: string): Promise<number> => {
  const result = await sql<{ uniqueHolders: string }[]>`
    select count(distinct(owner_address)) as "uniqueHolders" from ${sql(tableName)}
    where collection_id = ${collectionId}
  `;
  return Number.parseInt(result[0].uniqueHolders, 10) || 0;
};

export const updateNftRanksBatch = async (nfts: NftDatabaseEntry[]): Promise<void> => {
  const filteredNfts = nfts.filter((nft) => nft.rank !== null);
  const nftIds = filteredNfts.map((nft) => nft.id);
  const nftRanks = filteredNfts.map((nft) => nft.rank);
  await sql`
    update ${sql(tableName)} as n
    set rank = r.rank
    from unnest(${sql.array(nftIds)}::uuid[], ${sql.array(nftRanks)}::numeric[]) as r(id, rank)
    where n.id = r.id
  `;
};

export const updateBatch = async (
  nftEntries: Partial<NftDatabaseEntry>[],
  updateRanks = false,
): Promise<{
  inserted: number;
  items: NftDatabaseEntry[];
}> => {
  const batches: Partial<NftDatabaseEntry>[][] = [];
  let updated = 0;
  const maxParameterCount = 65_534;
  const maxEntryCount = Math.floor(maxParameterCount / upsertColumns.length);
  while (updated < nftEntries.length) {
    batches.push(nftEntries.slice(updated, updated + maxEntryCount));
    updated += maxEntryCount;
  }
  const promises = batches.map(
    async (batch) => sql<NftDatabaseEntry[]>`
      insert into ${sql(tableName)} ${sql(batch, ...upsertColumns)} on conflict (source, source_nft_id) do update
      set
        name = excluded.name,
        collection_id = excluded.collection_id,
        media_source = excluded.media_source,
        media_url = excluded.media_url,
        is_listed = excluded.is_listed,
        is_auctioned = excluded.is_auctioned,
        network = excluded.network,
        current_price = excluded.current_price,
        listed_at = excluded.listed_at,
        ${updateRanks ? sql`rank = excluded.rank,` : sql``}
        owner_address = excluded.owner_address,
        owner_type = excluded.owner_type,
        updated_at = excluded.updated_at
      returning ${sql(fetchColumns)}
    `,
  );
  const result = await Promise.all(promises);
  const inserted = result.reduce((accumulator, current) => accumulator + current.count, 0);
  return { inserted, items: result.flat() };
};

export const getRankings = async (
  collectionId: string,
): Promise<{ id: string; name: string; rank: number; source: string; source_nft_id: string }[]> => {
  const result = await sql<{ id: string; name: string; rank: number; source: string; source_nft_id: string }[]>`
    select id, name, rank, source, source_nft_id from ${sql(tableName)}
    where collection_id = ${collectionId}
    order by name asc
  `;
  return result;
};

export const getNftsByCollectionId = async (collectionId: string): Promise<NftDatabaseEntry[]> => {
  const result = await sql<NftDatabaseEntry[]>`
    select ${sql(fetchColumns)} from ${sql(tableName)}
    where collection_id = ${collectionId}
  `;
  return result;
};
