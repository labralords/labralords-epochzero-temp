/* eslint-disable class-methods-use-this */
import _ from 'lodash';
import {
  nftCollection,
  nft as nftDatabase,
  NftCollectionDatabaseEntry,
  NftDatabaseEntry,
  sales,
  cursors,
  users,
  UserDatabaseEntry,
} from '@labralords/database';
import got, { OptionsOfJSONResponseBody } from 'got';
import { labralordsCollectionId, promiseRetry, promiseTimeout } from '@labralords/common';
import { Collection, Member, Nft, Transaction } from '../contracts/soonaverse';
import { Cursor, CursorResponse, Repository } from './contracts';
import { fromFirestoreDate, mapCollection, mapMember, mapNft, mapTrade } from '../mappers/soonaverse';

const getMillisFromISODate = (date: string) => {
  return new Date(date).getTime();
};

const isDateString = (date: string) => {
  return !Number.isNaN(getMillisFromISODate(date));
};

const createUnknownNft = (nftData: {
  network: string;
  sourceNftId: string;
  collectionId: string;
}): NftDatabaseEntry => {
  return {
    collection_id: nftData.collectionId,
    created_at: new Date().toISOString(),
    current_price: null,
    is_auctioned: false,
    is_listed: false,
    listed_at: null,
    media_source: '',
    media_url: '',
    name: '',
    network: nftData.network,
    source: 'soonaverse',
    has_valid_ranks: false,
    source_nft_id: nftData.sourceNftId,
    owner_address: '',
    owner_type: 'user',
    rank: null,
    raw_stats: {},
    raw_traits: {},
    missing_metadata: true,
    updated_at: new Date().toISOString(),
  };
};

export class SoonaverseRepository implements Repository {
  private requestTimeout: number;

  private baseUrl = 'https://soonaverse.com/api';

  private requestConfig: OptionsOfJSONResponseBody = {};

  private defaultResponseLimit = 100;

  public name: string;

  public constructor({ requestTimeout }: { requestTimeout: number }) {
    this.requestTimeout = requestTimeout;
    this.requestConfig = {
      timeout: { request: this.requestTimeout },
      responseType: 'json',
    };
    this.name = 'soonaverse';
  }

  public async getLabralordsMemberAddressesPage(cursor: Cursor): Promise<CursorResponse<Nft>> {
    const url = `${this.baseUrl}/getMany?collection=nft&fieldName=collection&fieldValue=${labralordsCollectionId}${
      cursor.ref ? `&startAfter=${cursor.ref}` : ''
    }`;
    const response = await got<Nft[]>(url, this.requestConfig);
    const nfts = response.body || [];
    const newCursor = cursor;
    newCursor.ref = nfts[nfts.length - 1]?.uid;
    return { cursor: newCursor, items: nfts };
  }

  public async getLabralordsMemberAddresses(): Promise<string[]> {
    const cursor = { limit: this.defaultResponseLimit, offset: 0, ref: '', name: 'labralords-access' };
    let lastFetchCount = Number.POSITIVE_INFINITY;
    let memberAddresses: string[] = [];
    while (lastFetchCount >= cursor.limit) {
      console.log('fetching access page', cursor);
      const { cursor: nextCursor, items } = await this.getLabralordsMemberAddressesPage(cursor);
      if (items.length > 0) {
        console.log('found more addresses', items.length);
        const collectionSourceIds = items
          .filter((n) => !n.placeholderNft)
          .map((n): string | null => {
            const isSold = !!(n as any).sold;
            return n.isOwned && isSold ? n.owner : null;
          })
          .filter(Boolean);
        memberAddresses = [...memberAddresses, ...collectionSourceIds];
      }
      const count = items?.length;
      lastFetchCount = count;
      cursor.ref = nextCursor.ref;
    }

    return _.uniq(memberAddresses);
  }

  public async fetchSingleCollection(collectionId: string): Promise<NftCollectionDatabaseEntry> {
    console.log('fetching single collection', collectionId);
    const url = `${this.baseUrl}/getById?collection=collection&uid=${collectionId}`;
    const response = await got<Collection>(url, this.requestConfig);
    const collection = response.body;
    if (!collection) {
      throw new Error(`Collection ${collectionId} not found`);
    }
    const mappedCollection = mapCollection(collection);
    await nftCollection.upsertNftCollectionBatch([mappedCollection]);
    return mappedCollection;
  }

  public async fetchSingleNft(nftId: string): Promise<NftDatabaseEntry> {
    console.log('fetching nft', nftId);
    const url = `${this.baseUrl}/getById?collection=nft&uid=${nftId}`;
    const response = await got<Nft>(url, this.requestConfig);
    const nft = response.body;

    if (!nft) {
      throw new Error(`NFT ${nftId} not found`);
    }
    let collectionIdMap: Record<string, string> = await nftCollection.getCollectionIdMap([nft.collection]);

    if (!collectionIdMap[nft.collection]) {
      console.log('fetching collection', nft.collection);
      await this.fetchSingleCollection(nft.collection);
      collectionIdMap = await nftCollection.getCollectionIdMap([nft.collection]);
    }

    if (!collectionIdMap[nft.collection]) {
      throw new Error(`Collection ${nft.collection} not found`);
    }

    const mappedNft = mapNft(nft, collectionIdMap);

    await nftDatabase.upsertNftBatch([mappedNft]);
    return mappedNft;
  }

  public async handleCollectionRequest(
    url: string,
    cursor: Cursor,
  ): Promise<CursorResponse<NftCollectionDatabaseEntry>> {
    const response = await got<Collection[]>(url, this.requestConfig);
    const collections = response.body || [];
    const mappedCollections = collections.map((c) => mapCollection(c));
    return { cursor, items: mappedCollections };
  }

  public async fetchCollectionsPage(cursor: Cursor): Promise<CursorResponse<NftCollectionDatabaseEntry>> {
    const isDateCursor = isDateString(cursor.ref);
    const url = isDateString(cursor.ref)
      ? `${this.baseUrl}/getUpdatedAfter?collection=collection&updatedAfter=${getMillisFromISODate(cursor.ref)}`
      : `${this.baseUrl}/getMany?collection=collection${cursor.ref ? `&startAfter=${cursor.ref}` : ''}`;
    const { cursor: newCursor, items } = await this.handleCollectionRequest(url, cursor);
    const last = items[items.length - 1];
    newCursor.ref = (isDateCursor ? last.updated_at : last?.source_collection_id) || cursor.ref;
    return { cursor: newCursor, items };
  }

  public async fetchCollections(startCursor?: Cursor): Promise<void> {
    const cursor = { limit: this.defaultResponseLimit, offset: 0, ...startCursor };
    let lastFetchCount = Number.POSITIVE_INFINITY;
    while (lastFetchCount >= cursor.limit) {
      console.log('fetching collections page', cursor);
      const { cursor: nextCursor, items } = await this.fetchCollectionsPage(cursor);
      if (items.length > 0) {
        console.log('upserting collections', items.length);
        await nftCollection.upsertNftCollectionBatch(items);
      }
      const count = items?.length;
      lastFetchCount = count;
      cursor.ref = nextCursor.ref;
      await cursors.updateCursor(this.name, cursor.name, cursor.ref);
    }
  }

  public async handleNftRequest(url: string, cursor: Cursor): Promise<CursorResponse<NftDatabaseEntry>> {
    const response = await got<Nft[]>(url, this.requestConfig);
    const nfts = response.body || [];
    const collectionSourceIds = _.uniq(nfts.map((n) => n.collection));
    let collectionIdMap: Record<string, string> = await nftCollection.getCollectionIdMap(collectionSourceIds);
    if (Object.keys(collectionIdMap).length !== collectionSourceIds.length) {
      const missingCollections = collectionSourceIds.filter((c) => !collectionIdMap[c]);
      console.log('missing collections', missingCollections);
      for (const missingCollection of missingCollections) {
        await this.fetchSingleCollection(missingCollection);
      }
      collectionIdMap = await nftCollection.getCollectionIdMap(collectionSourceIds);

      if (Object.keys(collectionIdMap).length !== collectionSourceIds.length) {
        throw new Error(`Missing collections: ${missingCollections}`);
      }
    }
    const mappedNfts = nfts.filter((nft) => !nft.placeholderNft).map((c) => mapNft(c, collectionIdMap));
    return { cursor, items: mappedNfts };
  }

  public async fetchNftsPage(cursor: Cursor): Promise<CursorResponse<NftDatabaseEntry>> {
    const isDateCursor = isDateString(cursor.ref);
    const url = isDateString(cursor.ref)
      ? `${this.baseUrl}/getUpdatedAfter?collection=nft&updatedAfter=${getMillisFromISODate(cursor.ref)}`
      : `${this.baseUrl}/getMany?collection=nft${cursor.ref ? `&startAfter=${cursor.ref}` : ''}`;
    const { cursor: newCursor, items } = await this.handleNftRequest(url, cursor);
    const last = items[items.length - 1];
    newCursor.ref = (isDateCursor ? last.updated_at : last?.source_nft_id) || cursor.ref;
    return { cursor: newCursor, items };
  }

  public async fetchNfts(startCursor?: Cursor): Promise<void> {
    const cursor = { limit: this.defaultResponseLimit, offset: 0, ...startCursor };
    let lastFetchCount = Number.POSITIVE_INFINITY;
    while (lastFetchCount >= cursor.limit) {
      console.log('fetching nfts page', cursor);
      const { cursor: nextCursor, items } = await this.fetchNftsPage(cursor);
      if (items.length > 0) {
        await nftDatabase.upsertNftBatch(items);
        await nftCollection.setCollectionContentUpdatedAt(
          _.uniqBy(items, 'collection_id').map((index) => index.collection_id),
          new Date().toISOString(),
        );
      }
      const count = items?.length;
      lastFetchCount = count;
      cursor.ref = nextCursor.ref;
      await cursors.updateCursor(this.name, cursor.name, cursor.ref);
    }
  }

  public async handleMemberRequest(url: string, cursor: Cursor): Promise<CursorResponse<UserDatabaseEntry>> {
    const response = await got<Member[]>(url, this.requestConfig);
    const members = response.body || [];
    const mappedMembers = members.map((m) => mapMember(m));
    return { cursor, items: mappedMembers };
  }

  public async fetchMembersPage(cursor: Cursor): Promise<CursorResponse<UserDatabaseEntry>> {
    const isDateCursor = isDateString(cursor.ref);
    const url = isDateString(cursor.ref)
      ? `${this.baseUrl}/getUpdatedAfter?collection=member&updatedAfter=${getMillisFromISODate(cursor.ref)}`
      : `${this.baseUrl}/getMany?collection=member${cursor.ref ? `&startAfter=${cursor.ref}` : ''}`;
    const { cursor: newCursor, items } = await this.handleMemberRequest(url, cursor);
    const last = items[items.length - 1];
    newCursor.ref = (isDateCursor ? last.updated_at : last?.eth_address) || cursor.ref;
    return { cursor: newCursor, items };
  }

  public async fetchMembers(startCursor?: Cursor): Promise<void> {
    const cursor = { limit: this.defaultResponseLimit, offset: 0, ...startCursor };
    let lastFetchCount = Number.POSITIVE_INFINITY;
    while (lastFetchCount >= cursor.limit) {
      console.log('fetching members page', cursor);
      const { cursor: nextCursor, items } = await this.fetchMembersPage(cursor);
      if (items.length > 0) {
        await users.upsertMemberBatch(items);
      }
      const count = items?.length;
      lastFetchCount = count;
      cursor.ref = nextCursor.ref;
      await cursors.updateCursor(this.name, cursor.name, cursor.ref);
    }
  }

  public async handleTradeRequest(url: string, cursor: Cursor): Promise<CursorResponse<Transaction>> {
    const response = await got<Transaction[]>(url, this.requestConfig);
    const trades = response.body || [];
    return { cursor, items: trades };
  }

  public async fetchTradesPage(cursor: Cursor): Promise<CursorResponse<any>> {
    const isDateCursor = isDateString(cursor.ref);
    const url = isDateString(cursor.ref)
      ? `${this.baseUrl}/getUpdatedAfter?collection=transaction&updatedAfter=${getMillisFromISODate(cursor.ref)}`
      : `${this.baseUrl}/getMany?collection=transaction${cursor.ref ? `&startAfter=${cursor.ref}` : ''}`;
    const { cursor: newCursor, items } = await this.handleTradeRequest(url, cursor);
    const last = items[items.length - 1];
    newCursor.ref = (isDateCursor ? fromFirestoreDate(last?.updatedOn).toISOString() : last?.uid) || cursor.ref;
    return { cursor: newCursor, items };
  }

  public async fetchTrades(startCursor?: Cursor): Promise<void> {
    const cursor = { limit: this.defaultResponseLimit, offset: 0, ...startCursor };
    let lastFetchCount = Number.POSITIVE_INFINITY;
    while (lastFetchCount >= cursor.limit) {
      console.log('fetching trades page', cursor);
      const { cursor: nextCursor, items } = await this.fetchTradesPage(cursor);
      if (items.length > 0) {
        const filteredTrades = items.filter(
          (t) =>
            !t.payload?.invalidPayment &&
            ['PAYMENT', 'BILL_PAYMENT'].includes(t.type) &&
            !t.payload?.royalty &&
            (t.payload?.chainReference || t.payload?.walletReference?.chainReference),
        );
        const nftSourceIds = _.uniq(filteredTrades.map((trade) => trade.payload?.nft).filter(Boolean));
        let nftIdsMap = await promiseTimeout(nftDatabase.getNftIds(nftSourceIds), this.requestTimeout);

        const nftsNotFetched = new Set(nftSourceIds.filter((nftSourceId) => !nftIdsMap[nftSourceId]?.id));
        if (nftsNotFetched.size > 0) {
          for (const nftSourceId of nftsNotFetched) {
            try {
              await promiseRetry(() => promiseTimeout(this.fetchSingleNft(nftSourceId), 20_000));
            } catch (error) {
              console.log('failed to fetch nft', nftSourceId, error);
              const trade = filteredTrades.find((t) => t.payload?.nft === nftSourceId);
              const sourceCollectionId = trade?.payload?.collection;
              if (!sourceCollectionId) {
                console.log('no collection id for trade', trade);
                // eslint-disable-next-line no-continue
                continue;
              }

              const collectionIdMap = await nftCollection.getCollectionIdMap([sourceCollectionId]);
              await nftDatabase.upsertNftBatch([
                createUnknownNft({
                  network: trade.network,
                  sourceNftId: trade.payload?.nft,
                  collectionId: collectionIdMap[sourceCollectionId],
                }),
              ]);
            }
          }

          nftIdsMap = await promiseTimeout(nftDatabase.getNftIds(nftSourceIds), this.requestTimeout);

          const missingNfts = nftSourceIds.filter((n) => !nftIdsMap[n]?.id);
          if (missingNfts.length > 0) {
            throw new Error(`Missing nfts: ${missingNfts}`);
          }
        }

        const mappedTrades = filteredTrades
          .filter((t) => t.payload.nft !== null && !!nftIdsMap[t.payload.nft]?.id)
          .map((c) => mapTrade(c, nftIdsMap));
        await sales.insertSaleBatch(mappedTrades);
      }
      const count = items?.length;
      lastFetchCount = count;
      cursor.ref = nextCursor.ref;
      await cursors.updateCursor(this.name, cursor.name, cursor.ref);
    }
  }
}

export default SoonaverseRepository;
