import { v4 as uuidV4 } from 'uuid';
import {
  NftCollectionDatabaseEntry,
  NftDatabaseEntry,
  SaleDatabaseEntry,
  UserDatabaseEntry,
} from '@labralords/database';
import { collectionIdMap as supportedCollectionIdMap } from '@labralords/common';
import { Collection, Member, Nft, Transaction } from '../contracts/soonaverse';

export const fromFirestoreDate = ({
  _seconds: seconds,
  _nanoseconds: nanoSeconds,
}: {
  _seconds: number;
  _nanoseconds: number;
}): Date => new Date(seconds * 1000 + nanoSeconds / 1_000_000);

export const mapCollection = (collection: Collection): NftCollectionDatabaseEntry => {
  return {
    id: supportedCollectionIdMap[collection.uid] || uuidV4(),
    name: collection.name?.trim(),
    description: collection.description?.trim(),
    source: 'soonaverse',
    network: (collection as any).mintingData?.network || 'iota',
    source_collection_id: collection.uid,
    has_valid_ranks: false,
    has_custom_ranks: false,
    has_preset_ranks: false,
    included_in_trial: false,
    show_placeholder_only: false,
    nfts_minted: collection.sold,
    nft_count: collection.total,
    available_from: fromFirestoreDate(collection.availableFrom).toISOString(),
    mint_price: collection.price || 0,
    royalties_fee: collection.royaltiesFee || 0,
    twitter_username: collection.twitter,
    discord_username: collection.discord,
    owner_address: collection.createdBy,
    collection_content_updated_at: null,
    rejected: collection.rejected,
    created_at: fromFirestoreDate(collection.createdOn).toISOString(),
    updated_at: fromFirestoreDate(collection.updatedOn).toISOString(),
  };
};

export const mapNft = (nft: Nft, collectionIdMap: Record<string, string>): NftDatabaseEntry => {
  const isSold = !!(nft as any).sold;
  const isAuctioned = !!nft.auctionFrom;
  const isListed = (nft.availablePrice && nft.availableFrom && !nft.saleAccess) || isAuctioned;
  const listPrice = isListed ? (isAuctioned ? nft.auctionFloorPrice : nft.availablePrice) : null;
  const listedAt = isListed
    ? isAuctioned
      ? fromFirestoreDate(nft.auctionFrom).toISOString()
      : fromFirestoreDate(nft.availableFrom).toISOString()
    : null; // eslint-disable-line unicorn/no-null
  return {
    name: nft.name?.trim(),
    collection_id: collectionIdMap[nft.collection],
    source_nft_id: nft.uid,
    source: 'soonaverse',
    media_source: nft.ipfsMedia,
    media_url: nft.media,
    is_listed: isListed,
    is_auctioned: isAuctioned,
    rank: null,
    network: (nft as any)?.mintingData?.network || 'iota',
    current_price: listPrice?.toString() || null,
    owner_address: nft.isOwned && isSold ? nft.owner : nft.space,
    owner_type: nft.isOwned && isSold ? 'user' : 'space',
    listed_at: listedAt,
    missing_metadata: false,
    raw_traits: nft.properties || {},
    raw_stats: nft.stats || {},
    created_at: fromFirestoreDate(nft.createdOn).toISOString(),
    updated_at: fromFirestoreDate(nft.updatedOn).toISOString(),
  };
};

export const mapMember = (member: Member): UserDatabaseEntry => {
  return {
    username: member.name?.trim() || null,
    about: member.about?.trim() || null,
    github: member.github?.trim() || null,
    twitter: member.twitter?.trim() || null,
    discord: member.discord?.trim() || null,
    eth_address: member.uid,
    iota_address: member.validatedAddress?.iota || null,
    smr_address: member.validatedAddress?.smr || null,
    source: 'soonaverse',
    created_at: fromFirestoreDate(member.createdOn).toISOString(),
    updated_at: fromFirestoreDate(member.updatedOn).toISOString(),
  };
};

export const mapListing = (nft: Nft, collectionIdMap: Record<string, string>): NftDatabaseEntry =>
  mapNft(nft, collectionIdMap);

export const mapTrade = (
  transaction: Transaction,
  nftIdMap: Record<string, { id: string; collectionId: string }>,
): SaleDatabaseEntry => {
  return {
    type: transaction.type === 'PAYMENT' ? 'buy' : 'sell',
    nft_id: nftIdMap[transaction.payload.nft].id,
    collection_id: nftIdMap[transaction.payload.nft].collectionId,
    buyer_address: transaction.payload.targetAddress,
    seller_address: transaction.payload.sourceAddress,
    network: (transaction as any).network,
    sale_price: transaction.payload.amount.toString(),
    source_member_id: transaction.member,
    timestamp: fromFirestoreDate(transaction.createdOn).toISOString(),
    tx_hash: transaction.payload?.chainReference || transaction.payload?.walletReference?.chainReference,
  };
};
