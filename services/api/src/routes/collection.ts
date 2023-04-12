import Hapi from '@hapi/hapi';
import { getToken, NftCollectionStatistics, NftData, TradeData } from '@labralords/common';
import { nftCollection } from '@labralords/database';
import Joi from 'joi';
import Boom from '@hapi/boom';

import {
  getCollectionStatistics,
  getCurrentListingsByCollection,
  getCurrentTradesByCollection,
} from '../api/collections';

const getSortListingsByField = (field: string) => {
  switch (field) {
    case 'timestamp':
      return 'listed_at';
    case 'rank':
      return 'rank';
    case 'price':
      return 'current_price';
    default:
      return 'current_price';
  }
};

const getSortTradesByField = (field: string) => {
  switch (field) {
    case 'timestamp':
      return 'timestamp';
    case 'rank':
      return 'rank';
    case 'price':
      return 'current_price';
    default:
      return 'sale_price';
  }
};

const mapPublicListing = (listing: NftData) => ({
  id: listing.id,
  name: listing.name,
  uri: listing.uri,
  mediaUri: listing.mediaUri,
  token: getToken(listing.network),
  price: Number.parseInt(listing.currentPrice, 10) / 1_000_000,
  rank: listing.rank,
  ownerAddress: listing.ownerAddress,
  timestamp: listing.listedAt,
});

const mapPublicTrade = (trade: TradeData) => ({
  id: trade.id,
  name: trade.name,
  uri: trade.uri,
  mediaUri: trade.mediaUri,
  token: getToken(trade.network),
  price: Number.parseInt(trade.salePrice, 10) / 1_000_000,
  rank: trade.rank,
  buyerAddress: trade.sourceMemberId,
  sellerAddress: trade.sourcePreviousOwnerId,
  timestamp: trade.timestamp,
});

const mapPublicStats = (stats: NftCollectionStatistics) => ({
  supply: stats.supply,
  minted: stats.minted,
  revealPercentage: stats.revealPercentage,
  royaltiesFeePercentage: stats.royaltiesFee * 100,
  listingCount: stats.listingCount,
  newListingCount: stats.newListingCount,
  token: stats.token,
  floorPrice: stats.floorPrice / 1_000_000,
  uniqueHolders: stats.uniqueHolders,
  averageNftPerHolder: stats.averageNftPerHolder,
  oneHourSales: stats.oneHourSales,
  oneDaySales: stats.oneDaySales,
  sevenDaySales: stats.sevenDaySales,
});

export const getCollectionStats: Hapi.ServerRoute = {
  method: 'GET',
  path: '/collections/{collectionId}/stats',
  handler: async (request, h): Promise<Hapi.ResponseObject> => {
    const { collectionId } = request.params;

    const isPublicInformation = await nftCollection.collectionHasPublicAccess(collectionId);

    if (!isPublicInformation) {
      throw Boom.unauthorized('Data requested is not public');
    }

    const collectionStats = await getCollectionStatistics(collectionId);
    return h.response({ data: mapPublicStats(collectionStats) }).code(200);
  },
  options: {
    validate: {
      params: Joi.object({
        collectionId: Joi.string().uuid().required(),
      }),
    },
    cors: {
      credentials: false,
      origin: ['*'],
    },
  },
};

export const getListings: Hapi.ServerRoute = {
  method: 'GET',
  path: '/collections/{collectionId}/listings',
  handler: async (request, h): Promise<Hapi.ResponseObject> => {
    const { collectionId } = request.params;
    const { offset, limit, sortBy, sortOrder, name } = request.query;
    const isPublicInformation = await nftCollection.collectionHasPublicAccess(collectionId);

    if (!isPublicInformation) {
      throw Boom.unauthorized('Data requested is not public');
    }

    const listings = await getCurrentListingsByCollection(
      collectionId,
      offset,
      limit,
      getSortListingsByField(sortBy),
      sortOrder,
      name,
    );
    return h.response({ data: listings.map((listing) => mapPublicListing(listing)) }).code(200);
  },
  options: {
    validate: {
      query: Joi.object({
        limit: Joi.number().integer().min(1).max(100).default(10),
        offset: Joi.number().integer().min(0).default(0),
        sortBy: Joi.string().valid('timestamp', 'price', 'rank').default('price'),
        sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
        name: Joi.string().trim().optional(),
      }),
      params: Joi.object({
        collectionId: Joi.string().uuid().required(),
      }),
    },
    cors: {
      credentials: false,
      origin: ['*'],
    },
  },
};

export const getTrades: Hapi.ServerRoute = {
  method: 'GET',
  path: '/collections/{collectionId}/trades',
  handler: async (request, h): Promise<Hapi.ResponseObject> => {
    const { collectionId } = request.params;
    const { offset, limit, sortBy, sortOrder, name, network } = request.query;
    const isPublicInformation = await nftCollection.collectionHasPublicAccess(collectionId);

    if (!isPublicInformation) {
      throw Boom.unauthorized('Data requested is not public');
    }

    const trades = await getCurrentTradesByCollection(
      collectionId,
      offset,
      limit,
      getSortTradesByField(sortBy),
      sortOrder,
      name,
      undefined,
      network,
    );
    return h.response({ data: trades.map((trade) => mapPublicTrade(trade)) }).code(200);
  },
  options: {
    validate: {
      query: Joi.object({
        limit: Joi.number().integer().min(1).max(100).default(10),
        offset: Joi.number().integer().min(0).default(0),
        sortBy: Joi.string().trim().valid('timestamp', 'price', 'rank').default('timestamp'),
        sortOrder: Joi.string().trim().valid('asc', 'desc').default('desc'),
        name: Joi.string().trim().optional(),
        network: Joi.string().trim().valid('smr', 'iota').default('iota'),
      }),
      params: Joi.object({
        collectionId: Joi.string().uuid().required(),
      }),
    },
    cors: {
      credentials: false,
      origin: ['*'],
    },
  },
};
