import { NftCollectionDatabaseEntry, NftDatabaseEntry, SaleDatabaseEntry } from '@labralords/database';

export interface Cursor {
  ref?: string | null;
  name: string;
  offset?: number;
  limit?: number;
}

export interface CursorResponse<T> {
  items: T[];
  cursor: Cursor;
}

export interface Repository {
  name: string;
  fetchCollections(cursor: Cursor): Promise<void>;
  fetchTrades(cursor: Cursor): Promise<void>;
  // fetchListings(cursor: Cursor): Promise<void>;
  fetchNfts(cursor: Cursor): Promise<void>;

  fetchCollectionsPage(cursor: Cursor): Promise<CursorResponse<NftCollectionDatabaseEntry>>;
  fetchTradesPage(
    cursor: Cursor,
    nftIdMap: Record<string, { id: string; collectionId: string }>,
  ): Promise<CursorResponse<SaleDatabaseEntry>>;
  // fetchListingsPage(cursor: Cursor, collectionIdMap: Record<string, string>): Promise<CursorResponse<NftDatabaseEntry>>;
  fetchNftsPage(cursor: Cursor, collectionIdMap: Record<string, string>): Promise<CursorResponse<NftDatabaseEntry>>;
}
