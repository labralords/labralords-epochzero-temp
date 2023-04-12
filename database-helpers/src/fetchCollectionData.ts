import fs from 'fs-extra';
import path from 'node:path';
import _ from 'lodash';
import {
  NftCollectionDatabaseEntry,
  NftDatabaseEntry,
  TraitDatabaseEntry,
  TraitCategoryDatabaseEntry,
  NftHasTraitDatabaseEntry,
  ListingDatabaseEntry,
} from '@labralords/database';
import { formatCsv, makeCsvData } from '@labralords/common';

const databaseDirectory = path.join(__dirname, '../db');

const headers = {
  collections: [
    'id',
    'name',
    'description',
    'source',
    'source_collection_id',
    'has_valid_ranks',
    'included_in_trial',
    'nfts_minted',
    'nft_count',
    'mint_price',
    'royalties_fee',
    'available_from',
    'twitter_username',
    'discord_username',
    'created_at',
    'updated_at',
  ] as (keyof NftCollectionDatabaseEntry)[],
  nfts: [
    'id',
    'collection_id',
    'name',
    'source_nft_id',
    'source',
    'media_source',
    'is_listed',
    'is_auctioned',
    'current_price',
    'owner_address',
    'listed_at',
    'created_at',
    'updated_at',
  ] as (keyof NftDatabaseEntry)[],
  listings: [
    'id',
    'collection_id',
    'nft_id',
    'timestamp',
    'is_auctioned',
    'list_price',
    'owner_address',
  ] as (keyof ListingDatabaseEntry)[],
  traits: ['id', 'trait', 'trait_label'] as (keyof TraitDatabaseEntry)[],
  traitCategories: ['id', 'trait_category', 'trait_category_label'] as (keyof TraitCategoryDatabaseEntry)[],
  nftHasTraits: [
    'id',
    'collection_id',
    'nft_id',
    'trait_id',
    'trait_category_id',
  ] as (keyof NftHasTraitDatabaseEntry)[],
};

const traits: TraitDatabaseEntry[] = [];
const traitCategories: TraitCategoryDatabaseEntry[] = [];
const nftHasTraits: NftHasTraitDatabaseEntry[] = [];
const collectionEntries: NftCollectionDatabaseEntry[] = [];
const nftEntries: NftDatabaseEntry[] = [];
const listingEntries: ListingDatabaseEntry[] = [];

const main = async () => {
  // Write collection csv
  const formatedCollectionCsv = formatCsv(makeCsvData(collectionEntries, headers.collections));
  await fs.writeFile(path.join(databaseDirectory, 'collection-data.csv'), formatedCollectionCsv, { encoding: 'utf8' });

  // Write nft csv
  const formatedNftCsv = formatCsv(makeCsvData(nftEntries, headers.nfts));
  await fs.writeFile(path.join(databaseDirectory, 'nft-data.csv'), formatedNftCsv, { encoding: 'utf8' });

  // Write listings csv
  const formatedListingCsv = formatCsv(makeCsvData(listingEntries, headers.listings));
  await fs.writeFile(path.join(databaseDirectory, 'listing-data.csv'), formatedListingCsv, { encoding: 'utf8' });

  // Traits
  const formatedTraitCategoriesCsv = formatCsv(makeCsvData(traitCategories, headers.traitCategories));
  await fs.writeFile(path.join(databaseDirectory, 'trait-category-data.csv'), formatedTraitCategoriesCsv, {
    encoding: 'utf8',
  });

  const formatedTraitsCsv = formatCsv(makeCsvData(traits, headers.traits));
  await fs.writeFile(path.join(databaseDirectory, 'trait-data.csv'), formatedTraitsCsv, { encoding: 'utf8' });

  const formatedNftHasTraitsCsv = formatCsv(makeCsvData(nftHasTraits, headers.nftHasTraits));
  await fs.writeFile(path.join(databaseDirectory, 'nft-has-trait-data.csv'), formatedNftHasTraitsCsv, {
    encoding: 'utf8',
  });
};

main()
  .then(() => console.log('Fetched soonaverse collection data'))
  .catch(console.log);
