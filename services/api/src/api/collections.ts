import Boom from '@hapi/boom';
import {
  getToken,
  HistogramData,
  MemberTransactionHistoryData,
  NftCollectionData,
  NftCollectionStatistics,
  NftData,
  NftTraitDataExtended,
  NotificationData,
  Period,
  TradeData,
  TraitFilter,
  TraitFilterData,
} from '@labralords/common';
import {
  nft,
  traits,
  nftCollection,
  NftCollectionDatabaseEntry,
  NftDatabaseEntry,
  sales,
  SaleDatabaseEntry,
  TradeStatistics,
  MemberTransactionHistoryItem as MemberTransactionHistoryDatabaseEntry,
  notifications as notificationsDatabase,
  NotificationDatabaseEntry,
} from '@labralords/database';

export const prepareNftCollectionData = ({
  id,
  name,
  description,
  source_collection_id: sourceCollectionId,
  network,
  has_valid_ranks: hasValidRanks,
  show_placeholder_only: showPlaceholderOnly,
  mint_price: mintPrice,
  nfts_minted: minted,
  nft_count: supply,
  royalties_fee: royaltiesFee,
  available_from: availableFrom,
  twitter_username: twitterUsername,
  discord_username: discordUsername,
  created_at: createdAt,
  updated_at: updatedAt,
}: NftCollectionDatabaseEntry) =>
  ({
    id,
    name,
    description,
    uri: `https://soonaverse.com/collection/${sourceCollectionId}`,
    availableFrom,
    createdAt,
    updatedAt,
    network,
    hasValidRanks,
    showPlaceholderOnly,
    mintPrice,
    royaltiesFee,
    supply,
    minted,
    twitterUsername,
    discordUsername,
  } as NftCollectionData);

export const prepareNftCollectionDataWithTradeStats = ({
  volume,
  averagePrice,
  numberOfTrades,
  ...rest
}: NftCollectionDatabaseEntry & TradeStatistics) =>
  ({
    ...prepareNftCollectionData(rest),
    volume,
    averagePrice,
    numberOfTrades,
  } as NftCollectionData & TradeStatistics);

export const prepareNftData = ({
  id,
  name,
  collection_id: collectionId,
  source_nft_id: sourceNftId,
  media_source: mediaSource,
  media_url: mediaUrl,
  network,
  current_price: currentPrice,
  is_listed: isListed,
  listed_at: listedAt,
  owner_address: ownerAddress,
  floor_price: floorPrice,
  has_valid_ranks: hasValidRanks,
  created_at: createdAt,
  updated_at: updatedAt,
  rank,
}: NftDatabaseEntry) =>
  ({
    id,
    name,
    collectionId,
    uri: `https://soonaverse.com/nft/${sourceNftId}`,
    mediaUri: mediaUrl || `https://ipfs.soonaverse.com/ipfs/${mediaSource}/${encodeURIComponent(name)}`,
    network,
    currentPrice,
    isListed,
    listedAt,
    ownerAddress,
    rank,
    floorPrice: floorPrice || null,
    hasValidRanks,
    createdAt,
    updatedAt,
  } as NftData);

export const prepareTradeData = ({
  id,
  nft_id: nftId,
  name,
  media_source: mediaSource,
  media_url: mediaUrl,
  collection_id: collectionId,
  source_nft_id: sourceNftId,
  buyer_address: buyerAddress,
  source_member_id: sourceMemberId,
  source_previous_owner_id: sourcePreviousOwnerId,
  network,
  sale_price: salePrice,
  rank,
  timestamp,
}: SaleDatabaseEntry & { nft_id: string; source_previous_owner_id?: string } & NftDatabaseEntry) =>
  ({
    id,
    nftId,
    name,
    uri: `https://soonaverse.com/nft/${sourceNftId}`,
    mediaUri: mediaUrl || `https://ipfs.soonaverse.com/ipfs/${mediaSource}/${encodeURIComponent(name)}`,
    collectionId,
    sourceNftId,
    buyerAddress,
    sourceMemberId,
    sourcePreviousOwnerId,
    rank,
    network,
    salePrice,
    timestamp,
  } as TradeData);

export const prepareTransactionHistoryData = ({
  timestamp,
  collectionId,
  collectionName,
  nftId,
  nftName,
  network,
  price,
  type,
  txHash,
}: MemberTransactionHistoryDatabaseEntry) =>
  ({
    timestamp,
    collectionName,
    collectionUrl: `https://soonaverse.com/collection/${collectionId}`,
    nftName,
    nftUrl: `https://soonaverse.com/nft/${nftId}`,
    network,
    price: (Number.parseInt(price, 10) / 1_000_000).toString(),
    token: network === 'iota' ? 'MIOTA' : 'SMR',
    type,
    explorerUrl: txHash
      ? network === 'iota'
        ? `https://explorer.iota.org/mainnet/message/${txHash}`
        : `https://explorer.shimmer.network/shimmer/block/${txHash}`
      : '',
  } as MemberTransactionHistoryData);

export const prepareNotificationData = ({
  id,
  user_id: userId,
  notify_type: notifyType,
  notify_item_id: notifyItemId,
  notified_at: notifiedAt,
  notified,
  context,
  acknowledged,
  created_at: createdAt,
}: NotificationDatabaseEntry) =>
  ({
    id,
    userId,
    notifyType,
    notifyItemId,
    notifiedAt,
    notified,
    context,
    acknowledged,
    createdAt,
  } as NotificationData);

export const getCollections = async (
  offset = 0,
  limit = 50,
  sortBy = 'volume',
  sortOrder = 'desc',
  searchQuery = '',
  timeSpan: Period = '1 month',
  collectionIds: string[] = [],
  network = 'smr',
): Promise<NftCollectionData[]> => {
  const collections = await nftCollection.listNftCollectionsWithTradeStats(
    offset,
    limit,
    sortBy,
    sortOrder,
    searchQuery,
    timeSpan,
    collectionIds,
    network,
  );
  return collections.map((collection) => prepareNftCollectionDataWithTradeStats(collection));
};

export const getCollectionCount = async (
  searchQuery = '',
  collectionIds: string[] = [],
): Promise<{ total: number }> => {
  const countData = await nftCollection.count(searchQuery, collectionIds);
  return countData;
};

export const getCollectionById = async (collectionId: string): Promise<NftCollectionData> => {
  const collection = await nftCollection.getNftCollectionById(collectionId);
  if (!collection) {
    throw Boom.notFound('Collection not found');
  }
  return prepareNftCollectionData(collection);
};

export const getCollectionStatistics = async (collectionId: string): Promise<NftCollectionStatistics> => {
  const { minted, supply, royaltiesFee, mintPrice, network } = await getCollectionById(collectionId);
  const listingCount = await nft.countListings(collectionId, undefined, undefined, undefined, network);
  const newListingCount = await nft.countNewListings(collectionId);
  const floorPrice = await nft.floorPrice(collectionId);
  const uniqueHolders = await nft.uniqueHolders(collectionId);
  const oneDaySales = await sales.oneDaySales(collectionId);
  const sevenDaySales = await sales.sevenDaySales(collectionId);
  const oneHourSales = await sales.oneHourSales(collectionId);
  return {
    supply,
    minted,
    revealPercentage: (minted / supply) * 100,
    royaltiesFee,
    listingCount,
    newListingCount,
    token: getToken(network),
    floorPrice: supply - minted > 0 ? Math.min(mintPrice, floorPrice) : floorPrice,
    uniqueHolders,
    averageNftPerHolder: uniqueHolders > 0 ? minted / uniqueHolders : 0,
    oneDaySales,
    oneHourSales,
    sevenDaySales,
  };
};

export const getListPriceHistogram = async (
  collectionId: string,
  groupSize: number,
  nBuckets: number,
  searchQuery = '',
  traitFilters: TraitFilter[] = [],
  network = 'smr',
): Promise<HistogramData> => {
  const floorHistogram = await nft.getListPriceHistogram(
    collectionId,
    groupSize,
    nBuckets,
    searchQuery,
    traitFilters,
    network,
  );
  return floorHistogram;
};

export const getTraitFilters = async (collectionId: string): Promise<TraitFilterData> => {
  const traitFilters = await traits.getTraitFilters(collectionId);
  return {
    traitCategories: traitFilters.traitCategories,
    traitsByCategory: Object.entries(traitFilters.traitsByCategory).map(([category, traitsByCategory]) => ({
      key: category,
      value: traitsByCategory,
    })),
  };
};

export const getTraitsForNft = async (nftId: string): Promise<NftTraitDataExtended[]> => {
  return traits.getTraitsForNft(nftId);
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
): Promise<NftData[]> => {
  const listings = await nft.getCurrentListingsByCollection(
    collectionId,
    offset,
    limit,
    sortBy,
    sortOrder,
    searchQuery,
    traitFilters,
    auctions,
    network,
  );
  return listings.map((l) => prepareNftData(l));
};

export const getTransactionHistoryForMember = async (
  memberId: string,
  startDate?: Date,
): Promise<MemberTransactionHistoryData[]> => {
  const transactionHistory = await sales.getTransactionHistoryForMember(memberId, startDate);
  return transactionHistory.map((t) => prepareTransactionHistoryData(t));
};

export const getMemberPortfolio = async (
  memberId: string,
  offset = 0,
  limit = 50,
  sortBy = 'listed_at',
  sortOrder = 'desc',
  searchQuery = '',
  traitFilters: TraitFilter[] = [],
): Promise<NftData[]> => {
  const portfolio = await nft.getMemberPortfolio(memberId, offset, limit, sortBy, sortOrder, searchQuery, traitFilters);
  return portfolio.map((n) => prepareNftData(n));
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
): Promise<NftData[]> => {
  const listings = await nft.getGlobalListings(
    offset,
    limit,
    sortBy,
    sortOrder,
    searchQuery,
    traitFilters,
    minPrice,
    maxPrice,
    minRank,
    maxRank,
    collectionIds,
    network,
  );
  return listings.map((l) => prepareNftData(l));
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
): Promise<TradeData[]> => {
  const trades = await sales.getGlobalTrades(
    offset,
    limit,
    sortBy,
    sortOrder,
    searchQuery,
    traitFilters,
    minPrice,
    maxPrice,
    minRank,
    maxRank,
    collectionIds,
    network,
  );
  return trades.map((l) => prepareTradeData(l));
};

export const getListingCount = async (
  collectionId: string,
  searchQuery = '',
  traitFilters: TraitFilter[] = [],
  auctions = false,
  network = 'smr',
): Promise<{ total: number }> => {
  const countData = await nft.countListings(collectionId, searchQuery, traitFilters, auctions, network);
  return { total: countData };
};

export const getCurrentTradesByCollection = async (
  collectionId: string,
  offset = 0,
  limit = 10,
  sortBy = 'timestamp',
  sortOrder = 'desc',
  searchQuery = '',
  traitFilters: TraitFilter[] = [],
  network = 'smr',
  show1MiTrades = false,
): Promise<TradeData[]> => {
  const trades = await sales.getSalesByCollection(
    collectionId,
    offset,
    limit,
    sortBy,
    sortOrder,
    searchQuery,
    traitFilters,
    network,
    show1MiTrades,
  );
  return trades.map((l) => prepareTradeData(l));
};

export const getTradeCount = async (
  collectionId: string,
  searchQuery = '',
  traitFilters: TraitFilter[] = [],
  network = 'smr',
  show1MiTrades = false,
): Promise<{ total: number }> => {
  const countData = await sales.countTrades(collectionId, searchQuery, traitFilters, network, show1MiTrades);
  return { total: countData };
};

export const getTradeGraphData = async (
  collectionId: string,
  timeSpan: Period,
  searchQuery = '',
  traitFilters: TraitFilter[] = [],
  network = 'smr',
  show1MiTrades = false,
): Promise<TradeData[]> => {
  const trades = await sales.getTradeGraphData(
    collectionId,
    timeSpan,
    searchQuery,
    traitFilters,
    network,
    show1MiTrades,
  );
  return trades.map((l) => prepareTradeData(l));
};

export const getNotifications = async (address: string, offset = 0, limit = 10): Promise<NotificationData[]> => {
  const notifications = await notificationsDatabase.getNotifications(address, offset, limit);
  return notifications.map((n) => prepareNotificationData(n));
};

export const getNotificationCount = async (address: string): Promise<{ total: number }> => {
  const countData = await notificationsDatabase.countNotifications(address);
  return { total: countData };
};

export const getCollectionsByOwner = async (
  owner: string,
  offset = 0,
  limit = 50,
  sortBy = 'volume',
  sortOrder = 'desc',
  searchQuery = '',
  timeSpan: Period = '1 month',
  network = null,
): Promise<NftCollectionData[]> => {
  const collections = await nftCollection.getCollectionsByOwner(
    owner,
    offset,
    limit,
    sortBy,
    sortOrder,
    searchQuery,
    timeSpan,
    network,
  );
  return collections.map((c) => prepareNftCollectionDataWithTradeStats(c));
};

export const getRankings = async (
  collectionId: string,
): Promise<{ id: string; name: string; rank: number; uri: string }[]> => {
  const rankings = await nft.getRankings(collectionId);
  return rankings.map((ranking) => ({
    id: ranking.id,
    name: ranking.name,
    rank: ranking.rank,
    uri: ranking.source === 'soonaverse' ? `https://soonaverse.com/nft/${ranking.source_nft_id}` : null,
  }));
};
