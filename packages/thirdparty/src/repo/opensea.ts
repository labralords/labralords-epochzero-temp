/* eslint-disable class-methods-use-this */
import _ from 'lodash';
import got, { OptionsOfJSONResponseBody } from 'got';

import { NftCollectionDatabaseEntry, NftDatabaseEntry, SaleDatabaseEntry } from '@labralords/database';
import { OpenseaCollectionsResponse, OpenseaListingsResponse } from '../contracts';
import { Cursor, CursorResponse, Repository } from './contracts';
import { mapCollection, mapListing } from '../mappers/opensea';

const apiKey = process.env.OPENSEA_API_KEY;

export class OpenseaRepository implements Repository {
  private requestTimeout: number;

  private baseUrl = 'https://api.opensea.io';

  private requestConfig: OptionsOfJSONResponseBody = {};

  private defaultResponseLimit = 100;

  public name: string;

  public constructor({ requestTimeout }: { requestTimeout: number }) {
    this.requestTimeout = requestTimeout;
    this.requestConfig = {
      timeout: { request: this.requestTimeout },
      responseType: 'json',
      headers: {
        'X-API-KEY': apiKey,
      },
    };
    this.name = 'opensea';
  }

  public async fetchCollectionsPage(cursor: Cursor): Promise<CursorResponse<NftCollectionDatabaseEntry>> {
    const url = `${this.baseUrl}/api/v1/collections?offset=${cursor.offset}&limit=${cursor.limit}`;
    const response = await got<OpenseaCollectionsResponse>(url, this.requestConfig);
    const collections = response.body?.collections || [];
    return { cursor, items: collections.map((c) => mapCollection(c)) };
  }

  public async fetchCollections(startCursor?: Cursor): Promise<void> {
    const cursor = { limit: this.defaultResponseLimit, offset: 0, ...startCursor };
    let lastFetchCount = Number.POSITIVE_INFINITY;
    while (lastFetchCount >= cursor.limit) {
      const { cursor: nextCursor, items } = await this.fetchCollectionsPage(cursor);
      const count = items?.length;
      lastFetchCount = count;
      cursor.ref = nextCursor.ref;
    }
  }

  public async fetchNftsPage(
    cursor: Cursor,
    collectionIdMap: Record<string, string>,
  ): Promise<CursorResponse<NftDatabaseEntry>> {
    throw new Error('Method not implemented.');
  }

  public async fetchNfts(startCursor?: Cursor): Promise<void> {
    const cursor = '';
    const url = `/api/v1/assets?order_direction=desc&limit=20&include_orders=false&cursor=${cursor}`;
  }

  public async fetchListingsPage(cursor: Cursor): Promise<CursorResponse<NftDatabaseEntry>> {
    const url = `${this.baseUrl}/v2/orders/ethereum/seaport/listings?listed_after=${cursor.ref}&limit=${cursor.limit}&order_by=created_date&order_direction=asc`;
    const response = await got<OpenseaListingsResponse>(url, this.requestConfig);
    const listings = response.body?.listings || [];
    return { cursor, items: listings.map((l) => mapListing(l)) };
  }

  public async fetchListings(startCursor?: Cursor): Promise<void> {
    const cursor = { limit: this.defaultResponseLimit, offset: 0, ...startCursor };
    let lastFetchCount = Number.POSITIVE_INFINITY;
    while (lastFetchCount >= cursor.limit) {
      const { cursor: nextCursor, items } = await this.fetchListingsPage(cursor);
      const count = items?.length;
      lastFetchCount = count;
      cursor.ref = nextCursor.ref;
      // TODO: save listings to db
    }
  }

  public async fetchTradesPage(
    cursor: Cursor,
    nftIdMap: Record<string, { id: string; collectionId: string }>,
  ): Promise<CursorResponse<SaleDatabaseEntry>> {
    throw new Error('Method not implemented.');
  }

  public async fetchTrades(fstartCursor?: Cursor): Promise<void> {}
}

export default OpenseaRepository;
