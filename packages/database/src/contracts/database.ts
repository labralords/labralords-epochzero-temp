type SourceType = 'soonaverse' | 'opensea';

export interface UserDatabaseEntry {
  id?: string;
  source: SourceType;
  eth_address: string;
  iota_address: string;
  smr_address: string;
  username: string;
  about: string;
  twitter: string;
  discord: string;
  github: string;
  nonce?: string;
  access?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CursorDatabaseEntry {
  service: string;
  type: string;
  ref: string;
}

export interface ItemSoldNotificationQueueItem {
  notify_item_id: string;
  queue_id: string;
  notify_type: string;
  name: string;
  rank: number | null;
  media_url: string;
  network: string;
  sale_price: string;
  sold_by_address: string;
  sold_by_id: string;
  sold_to_username: string;
  sold_to_address: string;
  created_at: string;
}

export interface NotificationDatabaseEntry {
  id?: string;
  user_id: string;
  notify_item_id: string;
  notify_type: string;
  context: Record<string, any>;
  notified: boolean;
  notified_at: string;
  created_at: string;
  acknowledged: boolean;
}

export interface NftCollectionDatabaseEntry {
  id?: string;
  name: string;
  description: string;
  source_collection_id: string;
  source: SourceType;
  network: string;
  included_in_trial: boolean;
  has_valid_ranks: boolean;
  has_custom_ranks: boolean;
  has_preset_ranks: boolean;
  nfts_minted: number;
  nft_count: number;
  mint_price: number;
  royalties_fee: number;
  available_from: string;
  twitter_username: string;
  discord_username: string;
  show_placeholder_only: boolean;
  owner_address: string;
  rejected: boolean;
  collection_content_updated_at: string;
  created_at: string;
  updated_at: string;
}

export interface TradeStatistics {
  numberOfTrades: number;
  volume: string;
  averagePrice: string;
}

export interface RankDatabaseEntry {
  collection_id: string;
  name: string;
  rank: number;
}

export interface NftDatabaseEntry {
  id?: string;
  collection_id: string;
  name: string;
  source_nft_id: string;
  source: SourceType;
  media_source: string;
  media_url: string;
  is_listed: boolean;
  is_auctioned: boolean;
  network: string;
  current_price: string;
  owner_address: string;
  owner_type: 'user' | 'space';
  rank: number;
  listed_at: string;
  floor_price?: string;
  has_valid_ranks?: boolean;
  raw_traits?: Record<string, { label: string; value: string }>;
  raw_stats?: Record<string, { label: string; value: string }>;
  created_at: string;
  updated_at: string;
  missing_metadata: boolean;
}

export interface ListingDatabaseEntry {
  id: string;
  collection_id: string;
  nft_id: string;
  timestamp: string;
  is_auctioned: boolean;
  list_price: number;
  owner_address: string;
}

export interface SaleDatabaseEntry {
  id?: string;
  type: 'buy' | 'sell';
  nft_id: string;
  collection_id: string;
  timestamp: string;
  network: string;
  sale_price: string;
  buyer_address: string;
  seller_address: string;
  source_member_id: string;
  tx_hash: string;
}

export interface TraitCategoryDatabaseEntry {
  id?: string;
  trait_category: string;
  trait_category_label: string;
}

export interface TraitDatabaseEntry {
  id?: string;
  trait: string;
  trait_label: string;
}

export interface NftHasTraitDatabaseEntry {
  id?: string;
  collection_id: string;
  nft_id: string;
  trait_id: string;
  trait_category_id: string;
}

export interface MemberTransactionHistoryItem {
  timestamp: string;
  source: string;
  collectionId: string;
  collectionName: string;
  nftId: string;
  nftName: string;
  network: string;
  price: string;
  type: string;
  txHash: string;
}

export interface CollectionTraitDBEntry {
  id?: string;
  collection_id: string;
  trait_id: string;
  trait_category_id: string;
  trait_count: number;
  percentage: number;
}

export interface FetchQueueEntry {
  id: string;
  type: 'listings' | 'trades' | 'metadata';
  collection_id: string;
  source_collection_id: string;
  source: SourceType;
  fetched_at: Date;
  locked_at: Date;
  locked: boolean;
}

export interface UserToken {
  id?: string;
  user_id: string;
  token: string;
  browser_info: object;
  family: string;
  expires_at: Date;
  created_at?: Date;
}
