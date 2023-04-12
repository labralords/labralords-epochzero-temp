import Hapi from '@hapi/hapi';
import Joi from 'joi';
import _ from 'lodash';

import { stringify } from 'csv-stringify';
// eslint-disable-next-line import/no-unresolved
import { parse } from 'csv-parse/sync';
import Boom from '@hapi/boom';
import { format, utcToZonedTime } from 'date-fns-tz';
import { nftCollection, ranks } from '@labralords/database';
import { getBrowserInfo, verifyAccessTokenOrRefreshToken } from '../shared/jwt';

/* eslint-disable import/prefer-default-export */
import { getMemberPortfolio, getRankings, getTransactionHistoryForMember } from '../api/collections';

const authenticate = async (request: Hapi.Request) => {
  try {
    const { token: queryToken } = request.query;
    const rft: string = request?.state?.rft;
    const token = queryToken || request?.headers?.authorization?.split(' ')?.[1];
    const browserInfo = getBrowserInfo(request);
    return await verifyAccessTokenOrRefreshToken(token, rft, browserInfo);
  } catch {
    throw Boom.unauthorized('Invalid token');
  }
};

export const exportMemberTransactions: Hapi.ServerRoute = {
  method: 'GET',
  path: '/member/transactions',
  handler: async (request, h): Promise<Hapi.ResponseObject> => {
    const { timezone } = request.query;
    const { ethAddress } = await authenticate(request);
    const transactions = await getTransactionHistoryForMember(ethAddress);
    const csvData = stringify(
      transactions.map((t) => ({
        ...t,
        timestamp:
          timezone?.toLowerCase() === 'utc'
            ? new Date(t.timestamp).toISOString()
            : format(utcToZonedTime(new Date(t.timestamp), timezone), 'yyyy-MM-dd HH:mm:ssXXX', {
                timeZone: timezone,
              }),
      })),
      { header: true },
    );
    return h.response(csvData).type('text/csv').code(200);
  },
  options: {
    validate: {
      query: Joi.object({
        timezone: Joi.string().trim().default('UTC'),
        token: Joi.string().trim(),
      }),
    },
    cors: {
      credentials: true,
    },
  },
};

export const exportMemberPortfolio: Hapi.ServerRoute = {
  method: 'GET',
  path: '/member/nfts',
  handler: async (request, h): Promise<Hapi.ResponseObject> => {
    const { timezone } = request.query;
    const { ethAddress } = await authenticate(request);
    const nfts = await getMemberPortfolio(ethAddress, 0, 0);
    const csvData = stringify(
      nfts.map(({ name, uri, network, isListed, listedAt, currentPrice, ownerAddress, rank, floorPrice }) => ({
        name,
        uri,
        network,
        isListed: !!isListed,
        listedAt: listedAt
          ? timezone?.toLowerCase() === 'utc'
            ? new Date(listedAt).toISOString()
            : format(utcToZonedTime(new Date(listedAt), timezone), 'yyyy-MM-dd HH:mm:ssXXX', {
                timeZone: timezone,
              })
          : null,
        listPrice: currentPrice ? (Number.parseInt(currentPrice, 10) / 1_000_000).toString() : null,
        token: network === 'iota' ? 'MIOTA' : 'SMR',
        ownerAddress,
        rank,
        floorPrice: floorPrice ? (Number.parseInt(floorPrice, 10) / 1_000_000).toString() : null,
      })),
      { header: true },
    );
    return h.response(csvData).type('text/csv').code(200);
  },
  options: {
    validate: {
      query: Joi.object({
        timezone: Joi.string().trim().default('UTC'),
        token: Joi.string().trim(),
      }),
    },
    cors: {
      credentials: true,
    },
  },
};

export const getRanks: Hapi.ServerRoute = {
  method: 'GET',
  path: '/collections/{collectionId}/ranks',
  handler: async (request, h): Promise<Hapi.ResponseObject> => {
    const { collectionId } = request.params;
    await authenticate(request);
    const rankings = await getRankings(collectionId);
    const csvData = stringify(rankings, { header: true });
    return h.response(csvData).type('text/csv').code(200);
  },
  options: {
    validate: {
      params: Joi.object({
        collectionId: Joi.string().uuid().required(),
      }),
    },
    cors: {
      credentials: true,
    },
  },
};

interface RankInputDataItem {
  id: string;
  rank: number;
  name: string;
  uri: string;
}

export const postRanks: Hapi.ServerRoute = {
  method: 'POST',
  path: '/collections/{collectionId}/ranks',
  handler: async (request, h): Promise<Hapi.ResponseObject> => {
    const { collectionId } = request.params;
    const { file } = request.payload as any;
    const { ethAddress } = await authenticate(request);
    const ownsCollection = await nftCollection.userOwnsCollection(ethAddress, collectionId);
    if (!ownsCollection) {
      throw Boom.forbidden('You do not own this collection');
    }

    const rawCsvData = await file.payload;
    const rankData: RankInputDataItem[] = parse(rawCsvData, {
      columns: true,
      skip_empty_lines: true,
      cast: true,
    });
    const schema = Joi.array().items(
      Joi.object({
        id: Joi.string().uuid().optional(),
        rank: Joi.number().allow('').optional(),
        name: Joi.string().required(),
        uri: Joi.string().optional(),
      }),
    );
    const { error } = schema.validate(rankData);
    if (error) {
      throw Boom.badRequest(error.message);
    }

    const hasUniqueNames = _.uniqBy(rankData, (a) => a?.name?.trim()).length === rankData.length;
    const rankDataWithRanks = rankData.filter((r) => !!r.rank);
    if (hasUniqueNames) {
      await ranks.updateRanksBatch(
        rankDataWithRanks.map(({ rank, name }) => ({ rank, name, collection_id: collectionId })),
      );
    }

    const itemsWithId = rankDataWithRanks.filter((r) => !!r.id);
    await nftCollection.updateRanks(collectionId, itemsWithId);
    await nftCollection.setPresetRanksAvailable(collectionId, hasUniqueNames);
    return h.response().code(200);
  },
  options: {
    validate: {
      params: Joi.object({
        collectionId: Joi.string().uuid().required(),
      }),
      payload: Joi.any().meta({ swaggerType: 'file' }).required().allow('').description('CSV file'),
    },
    cors: {
      credentials: true,
    },
    payload: {
      maxBytes: 20_715_200,
      output: 'data',
      parse: true,
      allow: 'multipart/form-data',
      multipart: { output: 'annotated' },
    },
  },
};
