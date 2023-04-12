import { NftCollectionDatabaseEntry, NftDatabaseEntry } from '@labralords/database';
import { OpenseaAsset, OpenseaCollection, OpenseaListing } from '../contracts/opensea';

export const mapCollection = (collection: OpenseaCollection): NftCollectionDatabaseEntry => {
  return {
    source_collection_id: collection.slug,
    source: 'opensea',
    available_from: collection.created_date,
    created_at: collection.created_date,
    updated_at: collection.created_date,
    name: collection.name,
    description: collection.description,
    mint_price: null,
    has_valid_ranks: false,
    included_in_trial: false,
    nft_count: collection.stats?.total_supply,
    nfts_minted: collection.stats?.count,
    royalties_fee: (Object.values(collection.fees?.seller_fees).reduce((sum, current) => sum + current, 0) || 0) / 100,
  } as NftCollectionDatabaseEntry;
};

export const mapListing = (listing: OpenseaListing): NftDatabaseEntry => {
  return {} as NftDatabaseEntry;
};

export const mapNft = (nft: OpenseaAsset): NftDatabaseEntry => {
  return {
    source: 'opensea',
    source_nft_id: nft.token_id,
    name: nft.name,

    rank: null,
  } as any;
};
