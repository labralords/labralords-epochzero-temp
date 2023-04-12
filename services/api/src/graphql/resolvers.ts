import { IExecutableSchemaDefinition } from '@graphql-tools/schema';
import {
  getCollections,
  getCollectionById,
  getCollectionStatistics,
  getListPriceHistogram,
  getCurrentListingsByCollection,
  getCurrentTradesByCollection,
  getCollectionCount,
  getListingCount,
  getTradeCount,
  getTradeGraphData,
  getGlobalListings,
  getTraitFilters,
  getTraitsForNft,
  getGlobalTrades,
  getMemberPortfolio,
  getCollectionsByOwner,
  getNotifications,
  getNotificationCount,
} from '../api/collections';

const defaultTrialCollectionIds = [
  '743a77ad-768a-406c-880c-6773188ac766', // Labralords
  '918ef4ec-a015-43f4-b6ff-cf3d33a45ac4', // IotaPunks - Punkathon #1
  'ff30e81f-d76b-4740-863f-980831d83174', // IotaPunks - Punkathon #2
  'e136f55b-df12-4e4b-a9b7-14c4c320df89', // IotaPunks #The T3tr1s Collection
  'bbb50ffb-2e87-4b9b-93a1-ebedac9c9a0c', // #The Punk Ape Collection (public-mint)
];

const trialCollectionIdsString: string = process.env.TRIAL_COLLECTION_IDS || defaultTrialCollectionIds.join(',');
const trialCollectionIds: string[] = trialCollectionIdsString?.split(',').map((id) => id.trim()) || [];

export const resolvers: IExecutableSchemaDefinition['resolvers'] = {
  Query: {
    async nftCollections(_root, _arguments, context, _info) {
      const { user } = context;
      const collectionIds = user?.access ? [] : trialCollectionIds;
      const collections = await getCollections(
        _arguments.offset,
        _arguments.limit,
        _arguments.sortBy,
        _arguments.sortOrder,
        _arguments.searchQuery,
        _arguments.timeSpan,
        collectionIds,
        _arguments.network,
      );
      return collections;
    },
    async nftCollection(_root, arguments_, context, _info) {
      const { user } = context;
      const collectionId = user?.access
        ? arguments_.collectionId
        : trialCollectionIds.includes(arguments_.collectionId)
        ? arguments_.collectionId
        : undefined;
      if (!collectionId) {
        return null;
      }
      const collection = await getCollectionById(collectionId);
      return collection;
    },
    async nftCollectionStatistics(_root, arguments_, context, _info) {
      const { user } = context;
      const collectionId = user?.access
        ? arguments_.collectionId
        : trialCollectionIds.includes(arguments_.collectionId)
        ? arguments_.collectionId
        : undefined;
      if (!collectionId) {
        return null;
      }
      const collectionStats = await getCollectionStatistics(collectionId);
      return collectionStats;
    },
    async listPriceHistogram(_root, arguments_, context, _info) {
      const { user } = context;
      const collectionId = user?.access
        ? arguments_.collectionId
        : trialCollectionIds.includes(arguments_.collectionId)
        ? arguments_.collectionId
        : undefined;
      if (!collectionId) {
        return null;
      }
      const collectionStats = await getListPriceHistogram(
        collectionId,
        Number.parseInt(arguments_.groupSize, 10),
        arguments_.nBuckets,
        arguments_.searchQuery,
        arguments_.traitFilters,
        arguments_.network,
      );
      return collectionStats;
    },
    async traitFilters(_root, arguments_, context, _info) {
      const { user } = context;
      const collectionId = user?.access
        ? arguments_.collectionId
        : trialCollectionIds.includes(arguments_.collectionId)
        ? arguments_.collectionId
        : undefined;
      if (!collectionId) {
        return null;
      }
      const traitFilters = await getTraitFilters(collectionId);
      return traitFilters;
    },

    async memberPortfolio(_root, arguments_, context, _info) {
      const { user } = context;

      if (!user?.access) {
        return null;
      }

      return getMemberPortfolio(
        user.eth_address,
        arguments_.offset,
        arguments_.limit,
        arguments_.sortBy,
        arguments_.sortOrder,
        arguments_.searchQuery,
        arguments_.traitFilters,
      );
    },
    async collectionsByOwner(_root, _arguments, context, _info) {
      const { user } = context;

      if (!user?.access) {
        return null;
      }

      const collections = getCollectionsByOwner(
        user.eth_address,
        _arguments.offset,
        _arguments.limit,
        _arguments.sortBy,
        _arguments.sortOrder,
        _arguments.searchQuery,
        _arguments.timeSpan,
        _arguments.network,
      );
      return collections;
    },
    async traitsForNft(_root, arguments_, context, _info) {
      const { user } = context;
      const collectionId = user?.access
        ? arguments_.collectionId
        : trialCollectionIds.includes(arguments_.collectionId)
        ? arguments_.collectionId
        : undefined;
      if (!collectionId) {
        return null;
      }
      const traits = await getTraitsForNft(arguments_.nftId);
      return traits;
    },
    async listings(_root, arguments_, context, _info) {
      const { user } = context;
      const collectionId = user?.access
        ? arguments_.collectionId
        : trialCollectionIds.includes(arguments_.collectionId)
        ? arguments_.collectionId
        : undefined;
      if (!collectionId) {
        return [];
      }
      const listings = await getCurrentListingsByCollection(
        collectionId,
        arguments_.offset,
        arguments_.limit,
        arguments_.sortBy,
        arguments_.sortOrder,
        arguments_.searchQuery,
        arguments_.traitFilters,
        arguments_.auctions,
        arguments_.network,
      );
      return listings;
    },
    async listingCount(_root, arguments_, context, _info) {
      const { user } = context;
      const collectionId = user?.access
        ? arguments_.collectionId
        : trialCollectionIds.includes(arguments_.collectionId)
        ? arguments_.collectionId
        : undefined;
      if (!collectionId) {
        return { total: 0 };
      }
      const countData = await getListingCount(
        collectionId,
        arguments_.searchQuery,
        arguments_.traitFilters,
        arguments_.auctions,
        arguments_.network,
      );
      return countData;
    },
    async globalListings(_root, arguments_, context, _info) {
      const { user } = context;
      const collectionIds = user?.access ? [] : trialCollectionIds;
      const listings = await getGlobalListings(
        arguments_.offset,
        arguments_.limit,
        arguments_.sortBy,
        arguments_.sortOrder,
        arguments_.searchQuery,
        arguments_.traitFilters,
        arguments_.minPrice,
        arguments_.maxPrice,
        arguments_.minRank,
        arguments_.maxRank,
        collectionIds,
        arguments_.network,
      );
      return listings;
    },
    async globalTrades(_root, arguments_, context, _info) {
      const { user } = context;
      const collectionIds = user?.access ? [] : trialCollectionIds;
      const listings = await getGlobalTrades(
        arguments_.offset,
        arguments_.limit,
        arguments_.sortBy,
        arguments_.sortOrder,
        arguments_.searchQuery,
        arguments_.traitFilters,
        arguments_.minPrice,
        arguments_.maxPrice,
        arguments_.minRank,
        arguments_.maxRank,
        collectionIds,
        arguments_.network,
      );
      return listings;
    },
    async trades(_root, arguments_, context, _info) {
      const { user } = context;
      const collectionId = user?.access
        ? arguments_.collectionId
        : trialCollectionIds.includes(arguments_.collectionId)
        ? arguments_.collectionId
        : undefined;
      if (!collectionId) {
        return [];
      }
      const trades = await getCurrentTradesByCollection(
        collectionId,
        arguments_.offset,
        arguments_.limit,
        arguments_.sortBy,
        arguments_.sortOrder,
        arguments_.searchQuery,
        arguments_.traitFilters,
        arguments_.network,
        arguments_.network === 'iota' ? arguments_.show1MiTrades : true,
      );
      return trades;
    },
    async tradeCount(_root, arguments_, context, _info) {
      const { user } = context;
      const collectionId = user?.access
        ? arguments_.collectionId
        : trialCollectionIds.includes(arguments_.collectionId)
        ? arguments_.collectionId
        : undefined;
      if (!collectionId) {
        return { total: 0 };
      }
      const countData = await getTradeCount(
        collectionId,
        arguments_.searchQuery,
        arguments_.traitFilters,
        arguments_.network,
        arguments_.network === 'iota' ? arguments_.show1MiTrades : true,
      );
      return countData;
    },
    async collectionCount(_root, arguments_, context, _info) {
      const { user } = context;
      const collectionIds = user?.access ? [] : trialCollectionIds;
      const countData = await getCollectionCount(arguments_.searchQuery, collectionIds);
      return countData;
    },
    async tradeGraphData(_root, arguments_, context, _info) {
      const { user } = context;
      const collectionId = user?.access
        ? arguments_.collectionId
        : trialCollectionIds.includes(arguments_.collectionId)
        ? arguments_.collectionId
        : undefined;
      if (!collectionId) {
        return [];
      }
      const tradeGraphData = await getTradeGraphData(
        collectionId,
        arguments_.timeSpan,
        arguments_.searchQuery,
        arguments_.traitFilters,
        arguments_.network,
        arguments_.network === 'iota' ? arguments_.show1MiTrades : true,
      );
      return tradeGraphData;
    },
    async notifications(_root, _arguments, context, _info) {
      const { user } = context;
      if (!user?.access) {
        return [];
      }
      const notifications = await getNotifications(user.eth_address, _arguments.offset, _arguments.limit);
      return notifications;
    },
    async notificationCount(_root, _arguments, context, _info) {
      const { user } = context;
      if (!user?.access) {
        return { total: 0 };
      }
      const countData = await getNotificationCount(user.eth_address);
      return countData;
    },
  },
};

export default { resolvers } as { resolvers: IExecutableSchemaDefinition['resolvers'] };
