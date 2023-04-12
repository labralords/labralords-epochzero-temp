import { NftTraitData, NftTraitDataExtended, TraitCategory } from '@labralords/common';
import _ from 'lodash';
import {
  TraitDatabaseEntry,
  TraitCategoryDatabaseEntry,
  NftHasTraitDatabaseEntry,
  CollectionTraitDBEntry,
} from '../contracts';
import { sql } from './client';

export const traitTableName = 'traits';
export const traitCategoryTableName = 'trait_categories';
export const nftHasTraitTableName = 'nft_has_traits';
export const collectionTraitsTableName = 'collection_traits';

type ColumnNames = keyof TraitDatabaseEntry | keyof TraitCategoryDatabaseEntry | keyof NftHasTraitDatabaseEntry;
// type TraitJoinedData = TraitDatabaseEntry & TraitCategoryDatabaseEntry & NftHasTraitDatabaseEntry;

export const fetchColumns: ColumnNames[] = [
  'collection_id',
  'nft_id',
  'trait_id',
  'trait',
  'trait_label',
  'trait_category_id',
  'trait_category',
  'trait_category_label',
];

export const fetchTraitData: (keyof TraitDatabaseEntry)[] = ['id', 'trait', 'trait_label'];
export const upsertTraitColumns: (keyof TraitDatabaseEntry)[] = [...fetchTraitData.filter((column) => column !== 'id')];
export const fetchTraitCategoryData: (keyof TraitCategoryDatabaseEntry)[] = [
  'id',
  'trait_category',
  'trait_category_label',
];
export const upsertTraitCategoryColumns: (keyof TraitCategoryDatabaseEntry)[] = fetchTraitCategoryData.filter(
  (column) => column !== 'id',
);

export const nftHasTraitsColumns: (keyof NftHasTraitDatabaseEntry)[] = [
  'id',
  'nft_id',
  'collection_id',
  'trait_id',
  'trait_category_id',
];
export const nftHasTraitsUpsertColumns: (keyof NftHasTraitDatabaseEntry)[] = nftHasTraitsColumns.filter(
  (column) => column !== 'id',
);

export const collectionTraitsColumns: (keyof CollectionTraitDBEntry)[] = [
  'id',
  'collection_id',
  'trait_id',
  'trait_category_id',
  'trait_count',
  'percentage',
];

export const collectionTraitsUpsertColumns: (keyof CollectionTraitDBEntry)[] = collectionTraitsColumns.filter(
  (column) => column !== 'id',
);

export const getTraitsForNft = async (nftId: string): Promise<NftTraitDataExtended[]> => {
  return sql<NftTraitDataExtended[]>`
    select
        trait.id as "traitId",
        trait_category.id as "traitCategoryId",
        trait.trait as trait,
        trait.trait_label as "traitLabel",
        trait_category.trait_category as "traitCategory",
        trait_category.trait_category_label as "traitCategoryLabel",
        collection_traits.trait_count as "traitCount",
        collection_traits.percentage as "percentage"
      from ${sql(nftHasTraitTableName)} as join_table
      JOIN ${sql(traitCategoryTableName)} as trait_category ON trait_category.id = join_table.trait_category_id
      JOIN ${sql(traitTableName)} as trait ON trait.id = join_table.trait_id
      JOIN ${sql(
        collectionTraitsTableName,
      )} as collection_traits ON collection_traits.trait_id = join_table.trait_id and collection_traits.collection_id = join_table.collection_id and collection_traits.trait_category_id = join_table.trait_category_id
      where ${sql('join_table.nft_id')} = ${nftId}
  `;
};

export const getTraitCategories = async (collectionId: string): Promise<TraitCategory[]> => {
  return sql<TraitCategory[]>`
    select
      traits.trait_category_id as id,
      categories.trait_category as "traitCategory",
      categories.trait_category_label as "traitCategoryLabel"
    from (
      select distinct(trait_category_id) from ${sql(collectionTraitsTableName)}
      where collection_id = ${collectionId}
    ) as traits
    join ${sql(traitCategoryTableName)} as categories on categories.id = traits.trait_category_id
  `;
};

export const getTraits = async (collectionId: string): Promise<NftTraitData[]> => {
  return sql<NftTraitData[]>`
    select
      trait_id as id,
      trait_category_id as "traitCategoryId",
      trait.trait as trait,
      trait.trait_label as "traitLabel"
    from ${sql(collectionTraitsTableName)} as join_table
    JOIN ${sql(traitTableName)} as trait ON trait.id = join_table.trait_id
    where ${sql('join_table.collection_id')} = ${collectionId}
  `;
};

export const getTraitFilters = async (collectionId: string) => {
  const traitCategories = await getTraitCategories(collectionId);
  const traits = await getTraits(collectionId);
  return {
    traitCategories,
    traitsByCategory: _.groupBy(traits, 'traitCategoryId'),
  };
};

export const updateTraitBatch = async (
  entries: TraitDatabaseEntry[],
): Promise<{
  inserted: number;
  items: TraitDatabaseEntry[];
}> => {
  if (entries.length === 0) {
    return { inserted: 0, items: [] };
  }

  const upsertedTraits = await sql<TraitDatabaseEntry[]>`
    insert into ${sql('traits')} ${sql(entries, ...upsertTraitColumns)} on conflict (trait) do update
    set
      trait_label = excluded.trait_label
    returning ${sql(fetchTraitData)}
  `;

  return { inserted: upsertedTraits?.length, items: upsertedTraits };
};

export const updateTraitCategoryBatch = async (
  entries: TraitCategoryDatabaseEntry[],
): Promise<{
  inserted: number;
  items: TraitCategoryDatabaseEntry[];
}> => {
  if (entries.length === 0) {
    return { inserted: 0, items: [] };
  }
  const upsertedTraitCategories = await sql<TraitCategoryDatabaseEntry[]>`
    insert into ${sql('trait_categories')} ${sql(
    entries,
    ...upsertTraitCategoryColumns,
  )} on conflict (trait_category) do update
    set
      trait_category_label = excluded.trait_category_label
    returning ${sql(fetchTraitCategoryData)}
  `;

  return { inserted: upsertedTraitCategories?.length, items: upsertedTraitCategories };
};

export const updateCollectionTraitsBatch = async (
  entries: CollectionTraitDBEntry[],
): Promise<{
  inserted: number;
  items: CollectionTraitDBEntry[];
}> => {
  if (entries.length === 0) {
    return { inserted: 0, items: [] };
  }
  const batches: Partial<CollectionTraitDBEntry>[][] = [];
  let updated = 0;
  const maxParameterCount = 65_534;
  const maxEntryCount = Math.floor(maxParameterCount / collectionTraitsUpsertColumns.length);
  while (updated < entries.length) {
    batches.push(entries.slice(updated, updated + maxEntryCount));
    updated += maxEntryCount;
  }
  const promises = batches.map(
    async (batch) => sql<CollectionTraitDBEntry[]>`
      insert into ${sql('collection_traits')} ${sql(
      batch,
      ...collectionTraitsUpsertColumns,
    )} on conflict (collection_id, trait_category_id, trait_id) do update
      set
        trait_count = excluded.trait_count,
        percentage = excluded.percentage
      returning ${sql(collectionTraitsColumns)}
    `,
  );

  const result = await Promise.all(promises);
  const inserted = result.reduce((accumulator, current) => accumulator + current.count, 0);
  return { inserted, items: result.flat() };
};

export const updateNftHasTraitsBatch = async (
  entries: NftHasTraitDatabaseEntry[],
): Promise<{
  inserted: number;
  items: NftHasTraitDatabaseEntry[];
}> => {
  if (entries.length === 0) {
    return { inserted: 0, items: [] };
  }
  const batches: Partial<NftHasTraitDatabaseEntry>[][] = [];
  let updated = 0;
  const maxParameterCount = 65_534;
  const maxEntryCount = Math.floor(maxParameterCount / nftHasTraitsUpsertColumns.length);
  while (updated < entries.length) {
    batches.push(entries.slice(updated, updated + maxEntryCount));
    updated += maxEntryCount;
  }
  const promises = batches.map(
    async (batch) => sql<NftHasTraitDatabaseEntry[]>`
      insert into ${sql('nft_has_traits')} ${sql(
      batch,
      ...nftHasTraitsUpsertColumns,
    )} on conflict (nft_id, trait_category_id) do update
      set
        trait_id = excluded.trait_id
      returning ${sql(nftHasTraitsColumns)}
    `,
  );

  const result = await Promise.all(promises);
  const inserted = result.reduce((accumulator, current) => accumulator + current.count, 0);
  return { inserted, items: result.flat() };
};
