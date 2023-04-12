import { Period, toPgInterval, TraitFilter } from '@labralords/common';
import _ from 'lodash';
import { MemberTransactionHistoryItem, NftDatabaseEntry, SaleDatabaseEntry } from '../contracts';
import { sql } from './client';
import { getTraitClauses } from './common';
import { fetchColumns as nftFetchColumns } from './nfts';

export const tableName = 'trades';

export const fetchColumns: (keyof SaleDatabaseEntry)[] = [
  'id',
  'type',
  'nft_id',
  'collection_id',
  'timestamp',
  'network',
  'sale_price',
  'buyer_address',
  'seller_address',
  'source_member_id',
  'tx_hash',
];

export const updateColumns: (keyof SaleDatabaseEntry)[] = fetchColumns.filter(
  (column) => !['id', 'nft_id'].includes(column),
);

export const upsertColumns: (keyof SaleDatabaseEntry)[] = fetchColumns.filter((column) => !['id'].includes(column));

export const listSales = async (): Promise<SaleDatabaseEntry[]> => {
  return sql<SaleDatabaseEntry[]>`
    select
      ${sql(fetchColumns)}
    from ${sql(tableName)}
    order by timestamp desc
  `;
};

export const getGlobalTrades = async (
  offset = 0,
  limit = 10,
  sortBy = 'timestamp',
  sortOrder = 'desc',
  searchQuery = '',
  traitFilters: TraitFilter[] = [],
  minPrice = null,
  maxPrice: number = null,
  minRank = null,
  maxRank: number = null,
  collectionIds: string[] = [],
  network: string = null,
  show1MiTrades = false,
): Promise<(SaleDatabaseEntry & { nft_id: string } & NftDatabaseEntry)[]> => {
  return sql<(SaleDatabaseEntry & { nft_id: string } & NftDatabaseEntry)[]>`
    select
      ${sql(fetchColumns.map((column) => `s.${column}`))},
      n.id as nft_id,
      ${sql(nftFetchColumns.filter((c) => c !== 'id' && c !== 'network').map((column) => `n.${column}`))},
      (select source_member_id from ${sql(
        'trades',
      )} as l where l.nft_id = s.nft_id and l.timestamp < s.timestamp order by l.timestamp desc limit 1) as source_previous_owner_id
    from ${sql(tableName)} as s
    join ${sql('nfts')} as n on n.id = s.nft_id
    where
      sale_price >= 0
      and type = 'buy'
      ${network ? sql`and s.network = ${network}` : sql``}
      ${searchQuery ? sql`and lower(name) like ${`%${searchQuery.toLowerCase()}%`}` : sql``}
      ${traitFilters.length > 0 ? sql`and ${sql.unsafe(getTraitClauses(traitFilters))}` : sql``}
      ${minPrice ? sql`and sale_price >= ${minPrice}` : sql``}
      ${maxPrice ? sql`and sale_price <= ${maxPrice}` : sql``}
      ${minRank ? sql`and rank >= ${minRank}` : sql``}
      ${maxRank ? sql`and rank <= ${maxRank}` : sql``}
      ${!show1MiTrades ? sql`and sale_price > 1000000` : sql``}
      ${collectionIds?.length ? sql`and n.collection_id in ${sql(collectionIds)}` : sql``}
    order by ${sql(sortBy)} ${sql.unsafe(sortOrder)}
    offset ${offset}
    limit ${limit}
  `;
};

export const getSalesByCollection = async (
  collectionId: string,
  offset = 0,
  limit = 10,
  sortBy = 'timestamp',
  sortOrder = 'desc',
  searchQuery = '',
  traitFilters: TraitFilter[] = [],
  network = 'smr',
  show1MiTrades = false,
): Promise<(SaleDatabaseEntry & { nft_id: string } & NftDatabaseEntry)[]> => {
  return sql<(SaleDatabaseEntry & { nft_id: string } & NftDatabaseEntry)[]>`
    select
      ${sql(fetchColumns.map((column) => `s.${column}`))},
      n.id as nft_id,
      ${sql(nftFetchColumns.filter((c) => c !== 'id' && c !== 'network').map((column) => `n.${column}`))},
      (select source_member_id from ${sql(
        'trades',
      )} as l where l.nft_id = s.nft_id and l.timestamp < s.timestamp order by l.timestamp desc limit 1) as source_previous_owner_id
    from ${sql(tableName)} as s
    join ${sql('nfts')} as n on n.id = s.nft_id
    where n.collection_id = ${collectionId}
    and s.network = ${network}
    and type = 'buy'
    ${searchQuery ? sql`and lower(name) like ${`%${searchQuery.toLowerCase()}%`}` : sql``}
    ${!show1MiTrades ? sql`and sale_price > 1000000` : sql``}
    ${traitFilters.length > 0 ? sql`and ${sql.unsafe(getTraitClauses(traitFilters))}` : sql``}
    order by ${sql(sortBy)} ${sql.unsafe(sortOrder)}
    offset ${offset}
    limit ${limit}
  `;
};

export const getTransactionHistoryForMember = async (
  memberId: string,
  startDate?: Date,
): Promise<MemberTransactionHistoryItem[]> => {
  return sql<MemberTransactionHistoryItem[]>`
    WITH buys AS (
      select
      s.timestamp as timestamp,
        s.source_member_id as "sourceMemberId",
        s.network as network,
        s.sale_price as "price",
        s.tx_hash as "txHash",
        c.source as "source",
        c.source_collection_id as "collectionId",
        c.name as "collectionName",
        n.id as nft_id,
        n.source_nft_id as "nftId",
        n.name as "nftName",
        (select timestamp from trades as l where l.nft_id = s.nft_id and l.timestamp >= s.timestamp and l.type = 'sell' and l.source_member_id != s.source_member_id order by l.timestamp asc limit 1) as next_trade_timestamp,
        (select source_member_id from trades as l where l.nft_id = s.nft_id and l.timestamp < s.timestamp order by l.timestamp asc limit 1) as previous_member_id
      from trades as s
      join nfts as n on n.id = s.nft_id
      join collections as c on c.id = s.collection_id
      where
        s.source_member_id = ${memberId}
        and s.type = 'buy'
      order by s.timestamp desc
    ),
    sells AS (
      SELECT
        t.sale_price as "price",
        t.source_member_id as "sourceMemberId",
        t.network as network,
        t.tx_hash as "txHash",
        t.timestamp as timestamp,
        b.source as "source",
        b."collectionId" as "collectionId",
        b."collectionName" as "collectionName",
        b.nft_id as nft_id,
        b."nftId" as "nftId",
        b."nftName" as "nftName",
        t.type as type
      FROM buys as b
      join trades as t on t.timestamp = b.next_trade_timestamp
        and t.nft_id = b.nft_id and t.type = 'sell' and b."sourceMemberId" != t.source_member_id
      WHERE next_trade_timestamp is not null
    )
    SELECT
      timestamp,
      "source",
      "collectionId",
      "collectionName",
      "nftId",
      "nftName",
      "network",
      "price",
    "sourceMemberId",
      "txHash",
      CASE
        WHEN (previous_member_id IS NULL) THEN 'mint'
        ELSE 'buy'
      END AS "type"
    FROM buys
    ${startDate ? sql`where timestamp > ${startDate}` : sql``}

    UNION ALL

    SELECT
      timestamp,
      "source",
      "collectionId",
      "collectionName",
      "nftId",
      "nftName",
      "network",
      "price",
    "sourceMemberId",
      "txHash",
      "type"
    FROM sells
    ${startDate ? sql`where timestamp > ${startDate}` : sql``}
    order by timestamp asc
  `;
};

// TODO: add traitFilters
export const countTrades = async (
  collectionId: string,
  searchQuery = '',
  traitFilters: TraitFilter[] = [],
  network = 'smr',
  show1MiTrades = false,
): Promise<number> => {
  const countResults = await sql<{ count: string }[]>`
    select count(*) as count from ${sql(tableName)} as s
    join ${sql('nfts')} as n on n.id = s.nft_id
    where n.collection_id = ${collectionId}
    and s.network = ${network}
    and s.type = 'buy'
    ${searchQuery ? sql`and lower(name) like ${`%${searchQuery.toLowerCase()}%`}` : sql``}
    ${!show1MiTrades ? sql`and sale_price > 1000000` : sql``}
    ${traitFilters.length > 0 ? sql`and ${sql.unsafe(getTraitClauses(traitFilters))}` : sql``}
  `;
  return Number.parseInt(countResults[0].count, 10) || 0;
};

export const getTradeGraphData = async (
  collectionId: string,
  requestedTimeSpan: Period = '1 month',
  searchQuery = '',
  traitFilters: TraitFilter[] = [],
  network = 'smr',
  show1MiTrades = false,
): Promise<(SaleDatabaseEntry & { nft_id: string } & NftDatabaseEntry)[]> => {
  const timeSpan = toPgInterval(requestedTimeSpan || '1 month');
  return sql<(SaleDatabaseEntry & { nft_id: string } & NftDatabaseEntry)[]>`
    select
      ${sql(fetchColumns.map((column) => `s.${column}`))},
      n.id as nft_id,
      ${sql(nftFetchColumns.filter((c) => c !== 'id' && c !== 'network').map((column) => `n.${column}`))}
    from ${sql(tableName)} as s
    join ${sql('nfts')} as n on n.id = s.nft_id
    where n.collection_id = ${collectionId}
    and s.network = ${network}
    and s.type = 'buy'
    ${searchQuery ? sql`and lower(name) like ${`%${searchQuery.toLowerCase()}%`}` : sql``}
    ${!show1MiTrades ? sql`and sale_price > 1000000` : sql``}
    ${traitFilters.length > 0 ? sql`and ${sql.unsafe(getTraitClauses(traitFilters))}` : sql``}
    ${sql.unsafe(timeSpan ? `and timestamp > now() - interval '${timeSpan}'` : '')}
    order by timestamp desc
  `;
};

export const getSaleById = async (id: string): Promise<SaleDatabaseEntry> => {
  const entries = await sql<SaleDatabaseEntry[]>`
    select
      ${sql(fetchColumns)}
    from ${sql(tableName)}
    where id = ${id}
  `;
  return entries[0];
};

export const insertSaleBatch = async (
  entries: SaleDatabaseEntry[],
): Promise<{
  inserted: number;
  items: SaleDatabaseEntry[];
}> => {
  const batches: Partial<SaleDatabaseEntry>[][] = [];
  let updated = 0;
  const maxParameterCount = 65_534;
  const maxEntryCount = Math.floor(maxParameterCount / upsertColumns.length);
  while (updated < entries.length) {
    batches.push(entries.slice(updated, updated + maxEntryCount));
    updated += maxEntryCount;
  }
  const promises = batches.map(
    async (batch) => sql<SaleDatabaseEntry[]>`
      insert into ${sql(tableName)} ${sql(batch, ...upsertColumns)} on conflict (nft_id, timestamp, type) do update set
        type = excluded.type,
        network = excluded.network,
        source_member_id = excluded.source_member_id,
        tx_hash = excluded.tx_hash
      returning ${sql(fetchColumns)}
    `,
  );
  const result = await Promise.all(promises);
  const inserted = result.reduce((accumulator, current) => accumulator + current.count, 0);
  return { inserted, items: result.flat() };
};

export const oneDaySales = async (collectionId: string): Promise<number> => {
  const oneDaySaleResult = await sql<{ oneDaySales: string }[]>`
    select
      count(*) as "oneDaySales"
    from ${sql(tableName)}
    where collection_id = ${collectionId}
    and ((trades.sale_price > 1000000 and trades.network = 'iota') or (trades.sale_price > 0 and trades.network != 'iota'))
    and type = 'buy'
    and timestamp < now()
    and timestamp > now() - interval '1 days'
    group by collection_id
  `;
  return Number.parseInt(oneDaySaleResult[0]?.oneDaySales, 10) || 0;
};

export const sevenDaySales = async (collectionId: string): Promise<number> => {
  const oneDaySaleResult = await sql<{ sevenDaySales: string }[]>`
    select
      count(*) as "sevenDaySales"
    from ${sql(tableName)}
    where collection_id = ${collectionId}
    and ((trades.sale_price > 1000000 and trades.network = 'iota') or (trades.sale_price > 0 and trades.network != 'iota'))
    and type = 'buy'
    and timestamp < now()
    and timestamp > now() - interval '7 days'
    group by collection_id
  `;
  return Number.parseInt(oneDaySaleResult[0]?.sevenDaySales, 10) || 0;
};

export const oneHourSales = async (collectionId: string): Promise<number> => {
  const oneDaySaleResult = await sql<{ oneHourSales: string }[]>`
    select
      count(*) as "oneHourSales"
    from ${sql(tableName)}
    where collection_id = ${collectionId}
    and ((trades.sale_price > 1000000 and trades.network = 'iota') or (trades.sale_price > 0 and trades.network != 'iota'))
    and type = 'buy'
    and timestamp < now()
    and timestamp > now() - interval '1 hour'
    group by collection_id
  `;
  return Number.parseInt(oneDaySaleResult[0]?.oneHourSales, 10) || 0;
};
