import { gql } from 'apollo-server-hapi';
import { IExecutableSchemaDefinition } from '@graphql-tools/schema';

export const typeDefinitions: IExecutableSchemaDefinition['typeDefs'] = gql`
  type User {
    id: String!
    iotaAddress: String
    username: String!
    email: String
    avatar: String
  }

  type NftCollection {
    id: String!
    name: String!
    description: String
    uri: String
    hasValidRanks: Boolean
    showPlaceholderOnly: Boolean
    mintPrice: String
    royaltiesFee: Float
    minted: Int
    supply: Int
    network: String
    availableFrom: String
    numberOfTrades: Int
    volume: String
    averagePrice: String
    twitterUsername: String
    discordUsername: String
    createdAt: String
    updatedAt: String
  }

  type Nft {
    id: String!
    collectionId: String!
    name: String!
    uri: String
    mediaUri: String
    isListed: Boolean
    isAuctioned: Boolean
    network: String
    currentPrice: String
    rank: Int
    ownerAddress: String
    floorPrice: String
    hasValidRanks: Boolean
    listedAt: String
    createdAt: String
    updatedAt: String
  }

  type Listing {
    id: String
    collectionId: String
    nftId: String
    timestamp: String
    isAuctioned: Boolean
    listPrice: Int
    ownerAddress: String
  }

  type NotificationContext {
    name: String
    rank: Int
    media_url: String
    network: String
    sale_price: String
    sold_to_username: String
    sold_to_address: String
  }

  type Notification {
    id: String
    userId: String
    notifyType: String
    notifyItemId: String
    notifiedAt: String
    notified: Boolean
    context: NotificationContext
    acknowledged: Boolean
    createdAt: String
  }

  type Trade {
    id: String
    collectionId: String
    nftId: String
    name: String
    uri: String
    mediaUri: String
    sourceCollectionId: String
    sourceNftId: String
    sourceMemberId: String
    sourcePreviousOwnerId: String
    timestamp: String
    network: String
    salePrice: String
    rank: Int
    sellerAddress: String
    buyerAddress: String
  }

  type HistogramData {
    groupSize: String
    nBuckets: Int
    data: [Float]
  }

  type NftCollectionStatistics {
    supply: Int
    minted: Int
    revealPercentage: Float
    royaltiesFee: Float
    listingCount: Int
    newListingCount: Int
    floorPrice: String
    uniqueHolders: Int
    averageNftPerHolder: Float
    oneDaySales: Float
    oneHourSales: Float
    sevenDaySales: Float
  }

  type Trait {
    traitCategoryId: String!
    traitCategoryName: String!
    traitId: String!
    traitName: String!
  }

  type TraitRarityStats {
    traitCategoryId: String!
    traitId: String!
    trait: String
    traitLabel: String
    traitCategory: String
    traitCategoryLabel: String
    traitCount: Int
    percentage: Float
  }

  type TraitCategory {
    id: String!
    traitCategory: String!
    traitCategoryLabel: String
  }

  type Trait {
    id: String!
    trait: String!
    traitLabel: String
  }

  type TraitDictionaryItem {
    key: String!
    value: [Trait]
  }

  type TraitFilters {
    traitCategories: [TraitCategory]
    traitsByCategory: [TraitDictionaryItem]
  }

  type Pagination {
    total: Int
  }

  input TraitFilter {
    traitId: String
    traitCategoryId: String
    traitCategoryLabel: String
    traitLabel: String
  }

  type Query {
    nftCollections(
      offset: Int = 0
      limit: Int = 25
      sortBy: String
      sortOrder: String = "desc"
      searchQuery: String
      timeSpan: String = "1 month"
      network: String
    ): [NftCollection]
    collectionsByOwner(
      offset: Int = 0
      limit: Int = 25
      sortBy: String
      sortOrder: String = "desc"
      searchQuery: String
      timeSpan: String = "1 month"
      network: String
    ): [NftCollection]
    collectionCount(searchQuery: String = ""): Pagination
    nftCollection(collectionId: String!): NftCollection
    nftCollectionStatistics(collectionId: String!): NftCollectionStatistics
    listPriceHistogram(
      collectionId: String!
      groupSize: String = "1000000000"
      nBuckets: Int = 10
      searchQuery: String
      traitFilters: [TraitFilter]
      network: String
    ): HistogramData
    traitFilters(collectionId: String!): TraitFilters
    traitsForNft(collectionId: String!, nftId: String!): [TraitRarityStats]
    listings(
      collectionId: String!
      offset: Int = 0
      limit: Int = 10
      sortBy: String
      sortOrder: String = "desc"
      searchQuery: String
      traitFilters: [TraitFilter]
      auctions: Boolean = false
      network: String
    ): [Nft]
    memberPortfolio(
      offset: Int = 0
      limit: Int = 10
      sortBy: String
      sortOrder: String = "desc"
      searchQuery: String
      traitFilters: [TraitFilter]
    ): [Nft]
    listingCount(
      collectionId: String!
      searchQuery: String = ""
      traitFilters: [TraitFilter]
      auctions: Boolean = false
      network: String
    ): Pagination
    globalListings(
      offset: Int = 0
      limit: Int = 10
      sortBy: String
      sortOrder: String = "desc"
      searchQuery: String
      traitFilters: [TraitFilter]
      minPrice: String
      maxPrice: String
      minRank: Int
      maxRank: Int
      network: String
    ): [Nft]
    globalTrades(
      offset: Int = 0
      limit: Int = 10
      sortBy: String
      sortOrder: String = "desc"
      searchQuery: String
      traitFilters: [TraitFilter]
      minPrice: String
      maxPrice: String
      minRank: Int
      maxRank: Int
      network: String
    ): [Trade]
    trades(
      collectionId: String!
      offset: Int = 0
      limit: Int = 10
      sortBy: String
      sortOrder: String = "desc"
      searchQuery: String
      traitFilters: [TraitFilter]
      network: String
      show1MiTrades: Boolean = false
    ): [Trade]
    tradeCount(
      collectionId: String!
      searchQuery: String = ""
      traitFilters: [TraitFilter]
      network: String
      show1MiTrades: Boolean = false
    ): Pagination
    tradeGraphData(
      collectionId: String!
      timeSpan: String = "1 month"
      searchQuery: String
      traitFilters: [TraitFilter]
      network: String
      show1MiTrades: Boolean = false
    ): [Trade]
    notifications(offset: Int = 0, limit: Int = 10): [Notification]
    notificationCount: Pagination
  }
`;

export default { typeDefinitions };
