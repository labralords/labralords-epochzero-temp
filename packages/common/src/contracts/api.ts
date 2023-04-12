export interface DataResponse<T = any> {
  data: T;
}

export interface DictArrayItem<T = any> {
  key: string;
  value: T;
}

export interface TraitFilter {
  traitId: string;
  traitCategoryId: string;
  traitCategoryLabel: string;
  traitLabel: string;
}

export interface UserData {
  id: string;
  iotaAddress: string;
  username: string;
  email: string;
  avatar: string;
}

export interface NotificationData {
  id: string;
  userId: string;
  notifyItemId: string;
  notifyType: string;
  context: Record<string, any>;
  notified: boolean;
  notifiedAt: string;
  createdAt: string;
}

export interface NftCollectionData {
  id: string;
  name: string;
  description: string;
  uri: string;
  network: string;
  hasValidRanks: boolean;
  showPlaceholderOnly: boolean;
  mintPrice: number;
  royaltiesFee: number;
  minted: number;
  supply: number;
  twitterUsername: string;
  discordUsername: string;
  availableFrom: string;
  createdAt: string;
  updatedAt: string;
}

export interface TradeStatistics {
  volume: string;
  averagePrice: string;
  numberOfTrades: number;
}

export interface NftData {
  id: string;
  collectionId: string;
  name: string;
  uri: string;
  listedAt: string;
  currentPrice: string;
  mediaUri: string;
  ownerAddress: string;
  rank: number;
  hasValidRanks?: boolean;
  isListed: boolean;
  network: string;
  floorPrice: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListingData {
  id: string;
  collectionId: string;
  nftId: string;
  timestamp: string;
  listPrice: number;
  ownerAddress: string;
}

export interface TradeData {
  id: string;
  nftId: string;
  name: string;
  uri: string;
  mediaUri: string;
  collectionId: string;
  sourceNftId: string;
  sourceMemberId: string;
  sourcePreviousOwnerId: string;
  timestamp: string;
  salePrice: string;
  network: string;
  buyerAddress: string;
  rank: number;
}

export interface MemberTransactionHistoryData {
  timestamp: string;
  collectionName: string;
  collectionUrl: string;
  nftName: string;
  nftUrl: string;
  network: string;
  price: string;
  type: string;
  explorerUrl: string;
}

export interface HistogramData {
  groupSize: string; // Support large ints
  nBuckets: number;
  data: number[];
}

export interface NftCollectionStatistics {
  supply: number;
  minted: number;
  revealPercentage: number;
  royaltiesFee: number;
  listingCount: number;
  newListingCount: number;
  token: string;
  floorPrice: number;
  uniqueHolders: number;
  averageNftPerHolder: number;
  oneDaySales: number;
  oneHourSales: number;
  sevenDaySales: number;
}

export interface Trait {
  id?: string;
  trait: string;
  traitLabel: string;
}

export interface TraitCategory {
  id?: string;
  traitCategory: string;
  traitCategoryLabel: string;
}

export interface TraitFilterData {
  traitCategories: TraitCategory[];
  traitsByCategory: { key: string; value: Trait[] }[];
}

export interface NftTraitData extends Trait {
  traitId: string;
  traitCategoryId: string;
}

export interface NftTraitDataExtended extends NftTraitData, TraitCategory {
  traitCount: number;
  percentage: number;
}
