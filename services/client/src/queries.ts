import { gql } from '@apollo/client/core';

export const GET_COLLECTIONS = gql`
  query GetCollections(
    $offset: Int
    $limit: Int
    $searchQuery: String
    $sortBy: String
    $sortOrder: String
    $timeSpan: String
    $network: String
  ) {
    nftCollections(
      offset: $offset
      limit: $limit
      searchQuery: $searchQuery
      sortBy: $sortBy
      sortOrder: $sortOrder
      timeSpan: $timeSpan
      network: $network
    ) {
      id
      name
      description
      uri
      network
      numberOfTrades
      volume
      averagePrice
    }
    collectionCount(searchQuery: $searchQuery) {
      total
    }
  }
`;

export const GET_NOTIFICATIONS = gql`
  query GetNotifications($offset: Int, $limit: Int) {
    notifications(offset: $offset, limit: $limit) {
      id
      userId
      notifyType
      notifyItemId
      notifiedAt
      notified
      context {
        name
        rank
        media_url
        network
        sale_price
        sold_to_username
        sold_to_address
      }
      acknowledged
      createdAt
    }
    notificationCount {
      total
    }
  }
`;

export const GET_MEMBER_PORTIFOLIO = gql`
  query GetMemberPortifolio(
    $offset: Int
    $limit: Int
    $searchQuery: String
    $sortBy: String
    $sortOrder: String
    $traitFilters: [TraitFilter]
  ) {
    memberPortfolio(
      offset: $offset
      limit: $limit
      searchQuery: $searchQuery
      sortBy: $sortBy
      sortOrder: $sortOrder
      traitFilters: $traitFilters
    ) {
      id
      collectionId
      name
      uri
      mediaUri
      network
      ownerAddress
      currentPrice
      rank
      listedAt
      floorPrice
      hasValidRanks
    }
  }
`;

export const GET_COLLECTIONS_BY_OWNER = gql`
  query GetCollections(
    $offset: Int
    $limit: Int
    $searchQuery: String
    $sortBy: String
    $sortOrder: String
    $timeSpan: String
    $network: String
  ) {
    collectionsByOwner(
      offset: $offset
      limit: $limit
      searchQuery: $searchQuery
      sortBy: $sortBy
      sortOrder: $sortOrder
      timeSpan: $timeSpan
      network: $network
    ) {
      id
      name
      description
      uri
      network
      numberOfTrades
      volume
      averagePrice
    }
  }
`;

export const GET_LISTINGS = gql`
  query GetListings(
    $collectionId: String!
    $offset: Int
    $limit: Int
    $searchQuery: String
    $sortBy: String
    $sortOrder: String
    $traitFilters: [TraitFilter]
    $auctions: Boolean
    $network: String
  ) {
    listings(
      collectionId: $collectionId
      offset: $offset
      limit: $limit
      searchQuery: $searchQuery
      sortBy: $sortBy
      sortOrder: $sortOrder
      traitFilters: $traitFilters
      auctions: $auctions
      network: $network
    ) {
      id
      collectionId
      name
      uri
      mediaUri
      network
      ownerAddress
      currentPrice
      rank
      listedAt
    }
    listingCount(
      collectionId: $collectionId
      searchQuery: $searchQuery
      traitFilters: $traitFilters
      auctions: $auctions
      network: $network
    ) {
      total
    }
  }
`;

export const GET_TRAITS_FOR_NFT = gql`
  query GetTraitsForNft($collectionId: String!, $nftId: String!) {
    traitsForNft(collectionId: $collectionId, nftId: $nftId) {
      traitCategoryId
      traitId
      trait
      traitLabel
      traitCategory
      traitCategoryLabel
      traitCount
      percentage
    }
  }
`;

export const GET_GLOBAL_LISTINGS = gql`
  query GetListings(
    $offset: Int
    $limit: Int
    $searchQuery: String
    $sortBy: String
    $sortOrder: String
    $traitFilters: [TraitFilter]
    $minPrice: String
    $maxPrice: String
    $minRank: Int
    $maxRank: Int
    $network: String
  ) {
    globalListings(
      offset: $offset
      limit: $limit
      searchQuery: $searchQuery
      sortBy: $sortBy
      sortOrder: $sortOrder
      traitFilters: $traitFilters
      minPrice: $minPrice
      maxPrice: $maxPrice
      minRank: $minRank
      maxRank: $maxRank
      network: $network
    ) {
      id
      collectionId
      name
      uri
      mediaUri
      network
      ownerAddress
      currentPrice
      rank
      listedAt
    }
  }
`;

export const GET_GLOBAL_TRADES = gql`
  query GetTrades(
    $offset: Int
    $limit: Int
    $searchQuery: String
    $sortBy: String
    $sortOrder: String
    $traitFilters: [TraitFilter]
    $minPrice: String
    $maxPrice: String
    $minRank: Int
    $maxRank: Int
    $network: String
  ) {
    globalTrades(
      offset: $offset
      limit: $limit
      searchQuery: $searchQuery
      sortBy: $sortBy
      sortOrder: $sortOrder
      traitFilters: $traitFilters
      minPrice: $minPrice
      maxPrice: $maxPrice
      minRank: $minRank
      maxRank: $maxRank
      network: $network
    ) {
      id
      nftId
      collectionId
      name
      uri
      mediaUri
      network
      sourceMemberId
      sourcePreviousOwnerId
      salePrice
      rank
      timestamp
    }
  }
`;

export const GET_TRADES = gql`
  query GetTrades(
    $collectionId: String!
    $offset: Int
    $limit: Int
    $searchQuery: String
    $sortBy: String
    $sortOrder: String
    $traitFilters: [TraitFilter]
    $network: String
    $show1MiTrades: Boolean
  ) {
    trades(
      collectionId: $collectionId
      offset: $offset
      limit: $limit
      searchQuery: $searchQuery
      sortBy: $sortBy
      sortOrder: $sortOrder
      traitFilters: $traitFilters
      network: $network
      show1MiTrades: $show1MiTrades
    ) {
      id
      collectionId
      nftId
      name
      uri
      mediaUri
      sourceCollectionId
      sourceNftId
      sourceMemberId
      sourcePreviousOwnerId
      timestamp
      rank
      network
      salePrice
      buyerAddress
    }
    tradeCount(
      collectionId: $collectionId
      searchQuery: $searchQuery
      traitFilters: $traitFilters
      network: $network
      show1MiTrades: $show1MiTrades
    ) {
      total
    }
  }
`;

export const GET_TRADE_GRAPH_DATA = gql`
  query GetTradeGraphData(
    $collectionId: String!
    $timeSpan: String
    $searchQuery: String
    $traitFilters: [TraitFilter]
    $network: String
    $show1MiTrades: Boolean
  ) {
    tradeGraphData(
      collectionId: $collectionId
      timeSpan: $timeSpan
      searchQuery: $searchQuery
      traitFilters: $traitFilters
      network: $network
      show1MiTrades: $show1MiTrades
    ) {
      id
      collectionId
      nftId
      name
      uri
      mediaUri
      sourceCollectionId
      sourceNftId
      timestamp
      rank
      network
      salePrice
      buyerAddress
    }
  }
`;

export const GET_COLLECTION_DATA = gql`
  query GetCollections($collectionId: String!) {
    nftCollection(collectionId: $collectionId) {
      id
      name
      description
      uri
      network
      twitterUsername
      discordUsername
      supply
      minted
      hasValidRanks
      showPlaceholderOnly
    }
    traitFilters(collectionId: $collectionId) {
      traitCategories {
        id
        traitCategory
        traitCategoryLabel
      }
      traitsByCategory {
        key
        value {
          id
          trait
          traitLabel
        }
      }
    }
  }
`;

export const GET_COLLECTION_STATISTICS = gql`
  query GetCollectionStatistics($collectionId: String!) {
    nftCollectionStatistics(collectionId: $collectionId) {
      supply
      minted
      revealPercentage
      royaltiesFee
      listingCount
      newListingCount
      floorPrice
      uniqueHolders
      averageNftPerHolder
      oneDaySales
      oneHourSales
      sevenDaySales
    }
  }
`;

export const GET_LIST_PRICE_HISTOGRAM = gql`
  query GetListPriceHistogram(
    $collectionId: String!
    $groupSize: String = "10000000"
    $searchQuery: String
    $traitFilters: [TraitFilter]
    $network: String
  ) {
    listPriceHistogram(
      collectionId: $collectionId
      groupSize: $groupSize
      searchQuery: $searchQuery
      traitFilters: $traitFilters
      network: $network
    ) {
      groupSize
      nBuckets
      data
    }
  }
`;
