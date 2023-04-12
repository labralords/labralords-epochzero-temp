import { labralordsCollectionId } from '@labralords/common';
import { collection, Firestore, getDocs, limit as limitFunction, orderBy, query, where } from 'firebase/firestore';
import { Collection, Nft, Transaction, TransactionType } from '../contracts/soonaverse';

export const enum SoonaverseCollectionName {
  MEMBER = 'member',
  AWARD = 'award',
  COLLECTION = 'collection',
  NFT = 'nft',
  SPACE = 'space',
  PROPOSAL = 'proposal',
  NOTIFICATION = 'notification',
  MILESTONE = 'milestone',
  TRANSACTION = 'transaction',
  BADGES = 'badges',
  AVATARS = 'avatars',
  TOKEN = 'token',
  TOKEN_MARKET = 'token_market',
  TOKEN_PURCHASE = 'token_purchase',
}

export const getLabralordMemberAddresses = async (database: Firestore) => {
  const queryParameters = [where('hidden', '==', false), where('collection', '==', labralordsCollectionId)];
  const myQuery = query(collection(database, SoonaverseCollectionName.NFT), ...queryParameters);
  const snapshot = await getDocs(myQuery);
  return snapshot.docs
    .map((d) => <Nft>d.data())
    .filter((nft) => !nft.placeholderNft)
    .map((nft): string | null => {
      const isSold = !!(nft as any).sold;
      return nft.isOwned && isSold ? nft.owner : null;
    })
    .filter(Boolean);
};

export const getCollections = async (database: Firestore, fromDate: Date, limit: number) => {
  const queryParameters = [where('approved', '==', true), orderBy('updatedOn', 'asc'), limitFunction(limit)];
  if (fromDate) {
    queryParameters.push(where('updatedOn', '>=', fromDate));
  }
  const myQuery = query(collection(database, SoonaverseCollectionName.COLLECTION), ...queryParameters);
  const snapshot = await getDocs(myQuery);
  const collections = snapshot.docs.map((d) => <Collection>d.data());
  return collections;
};

export const getNfts = async (database: Firestore, fromDate: Date, limit: number) => {
  const queryParameters = [where('hidden', '==', false), orderBy('updatedOn', 'asc'), limitFunction(limit)];
  if (fromDate) {
    queryParameters.push(where('updatedOn', '>=', fromDate));
  }
  const myQuery = query(collection(database, SoonaverseCollectionName.NFT), ...queryParameters);
  const snapshot = await getDocs(myQuery);
  const nfts = snapshot.docs.map((d) => <Nft>d.data());
  return nfts;
};

export const getListings = async (database: Firestore, fromDate: Date, limit: number) => {
  return getNfts(database, fromDate, limit);
};

export const getTrades = async (database: Firestore, fromDate: Date, limit: number) => {
  const queryParameters = [
    where('type', '==', TransactionType.PAYMENT),
    orderBy('createdOn', 'asc'),
    limitFunction(limit),
  ];
  if (fromDate) {
    queryParameters.push(where('createdOn', '>=', fromDate));
  }
  const myQuery = query(collection(database, SoonaverseCollectionName.TRANSACTION), ...queryParameters);
  const snapshot = await getDocs(myQuery);
  const transactions = snapshot.docs.map((d) => <Transaction>d.data());
  return transactions;
};

export default {
  getCollections,
  getNfts,
  getListings,
  getTrades,
};
