export interface Timestamp {
  now(): Timestamp;
  fromDate(date: Date): Timestamp;
  fromMillis(milliseconds: number): Timestamp;
  readonly seconds: number;
  readonly nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
  isEqual(other: Timestamp): boolean;
  valueOf(): string;
}

export enum CollectionType {
  CLASSIC = 0,
  GENERATED = 1,
  SFT = 2,
}

export interface DiscountLine {
  xp: number;
  amount: number;
}

export enum Categories {
  COLLECTIBLE = 'COLLECTIBLE',
  PFP = 'PFP',
  PHOTOGRAPHY = 'PHOTOGRAPHY',
  ANIMATION = 'ANIMATION',
  THREE_D = '3D',
  GENERATIVE = 'GENERATIVE',
  SINGLE = 'SINGLE',
  INTERACTIVE = 'INTERACTIVE',
  ABSTRACT = 'ABSTRACT',
  PIXELART = 'PIXELART',
  GAME = 'GAME',
  ART = 'ART',
}

export interface BaseRecord {
  uid: string;
  createdOn?: FirestoreDate;
  updatedOn?: FirestoreDate;
  createdBy?: string;

  // Sharabble url
  wenUrl?: string;
  wenUrlShort?: string;

  // Doc cursor used internally.
  _doc?: any;
  // Sometimes we want data from parent collecton because we search through it.
  _subColObj?: any;
}

export enum Access {
  OPEN = 0,
  MEMBERS_ONLY = 1,
  GUARDIANS_ONLY = 2,
  MEMBERS_WITH_BADGE = 3,
  MEMBERS_WITH_NFT_FROM_COLLECTION = 4,
}

export type EthAddress = string;
export type IotaAddress = string;
export type IpfsCid = string;

export interface FileMetedata {
  metadata: IpfsCid;
  original: IpfsCid;
  avatar: IpfsCid;
  fileName: string;
}

export interface CollectionBase extends BaseRecord {
  name: string;
  description: string;
  bannerUrl: string;
  royaltiesFee: number;
  royaltiesSpace: EthAddress;
  discounts: DiscountLine[];
  total: number;
  sold: number;
  discord: string;
  url: string;
  twitter: string;
  approved: boolean;
  rejected: boolean;
  limitedEdition?: boolean;
}

export interface FirestoreDate {
  _seconds: number;
  _nanoseconds: number;
}

export interface Collection {
  id: string;
  space: string;
  ipfsMetadata: string;
  updatedOn: FirestoreDate;
  price: number;
  total: number;
  twitter: string;
  approved: boolean;
  accessAwards: [];
  access: number;
  description: string;
  royaltiesFee: number;
  type: number;
  mintingData: {
    aliasBlockId: string;
    mintedBy: string;
    address: string;
    nftId: string;
    aliasId: string;
    network: 'smr' | 'iota';
    mintingOrderId: string;
    newPrice: number;
    blockId: string;
    unsoldMintingOptions: string;
    nftsToMint: number;
    nftsStorageDeposit: number;
    mintedOn: FirestoreDate;
    aliasStorageDeposit: number;
    storageDeposit: number;
  };
  rejected: boolean;
  bannerUrl: string;
  limitedEdition: boolean;
  placeholderUrl: string;
  url: string;
  createdBy: string;
  sold: number;
  discord: string;
  status: string;
  createdOn: FirestoreDate;
  availableFrom: FirestoreDate;
  name: string;
  placeholderNft: string;
  royaltiesSpace: string;
  ipfsMedia: string;
  uid: string;
  discounts: [];
  category: string;
}

export interface PropertyStats {
  [propName: string]: {
    label: string;
    value: string;
  };
}

export enum NftAccess {
  OPEN = 0,
  MEMBERS = 1,
}

export enum NftAvailable {
  UNAVAILABLE = 0,
  SALE = 1,
  AUCTION = 2,
  AUCTION_AND_SALE = 3,
}

export interface Nft extends BaseRecord {
  name: string;
  description: string;
  collection: EthAddress;
  owner?: EthAddress;
  isOwned?: boolean;
  media: string;
  ipfsMedia: string;
  ipfsMetadata: string;
  saleAccess?: NftAccess;
  saleAccessMembers?: string[];
  available: NftAvailable;
  availableFrom: FirestoreDate;
  auctionFrom?: FirestoreDate;
  auctionTo?: Timestamp | null;
  auctionHighestBid?: number | null;
  auctionHighestBidder?: string | null;
  auctionHighestTransaction?: string | null;
  price: number;
  availablePrice?: number | null;
  auctionFloorPrice?: number | null;
  auctionLength?: number | null;
  type: CollectionType;
  space: string;
  url: string;
  approved: boolean;
  rejected: boolean;
  properties: PropertyStats;
  stats: PropertyStats;
  placeholderNft: boolean;
}

export interface Member extends BaseRecord {
  name: string;
  about: string;
  github: string;
  twitter: string;
  discord: string;
  validatedAddress: {
    iota: string;
    smr: string;
  };
}

export const TRANSACTION_AUTO_EXPIRY_MS = 4 * 60 * 1000;
export const TRANSACTION_MAX_EXPIRY_MS = 3 * 24 * 60 * 60 * 1000;
export enum TransactionType {
  BADGE = 'BADGE',
  VOTE = 'VOTE',
  PLEDGE = 'PLEDGE',
  ORDER = 'ORDER',
  PAYMENT = 'PAYMENT',
  BILL_PAYMENT = 'BILL_PAYMENT',
  CREDIT = 'CREDIT',
}

export enum TransactionOrderType {
  NFT_PURCHASE = 'NFT_PURCHASE',
  NFT_BID = 'NFT_BID',
  SPACE_ADDRESS_VALIDATION = 'SPACE_ADDRESS_VALIDATION',
  MEMBER_ADDRESS_VALIDATION = 'MEMBER_ADDRESS_VALIDATION',
  TOKEN_PURCHASE = 'TOKEN_PURCHASE',
  TOKEN_AIRDROP = 'TOKEN_AIRDROP',
  TOKEN_BUY = 'TOKEN_BUY',
}

export enum TransactionCreditType {
  TOKEN_PURCHASE = 'TOKEN_PURCHASE',
  TOKEN_BUY = 'TOKEN_BUY',
}

export enum TransactionValidationType {
  ADDRESS_AND_AMOUNT = 0,
  ADDRESS = 1,
}

export enum Entity {
  SPACE = 'space',
  MEMBER = 'member',
}

export enum Network {
  IOTA = 'iota',
  SHIMMER = 'smr',
}

export interface VoteTransaction {
  proposalId: string;
  votes: string[];
}

export interface WalletResult {
  createdOn: Timestamp;
  processedOn: Timestamp;
  chainReference?: string | null;
  chainReferences?: string[];
  error?: any | null;
  confirmed: boolean;
  count: number;
}

export interface BadgeTransaction {
  award: string;
  name: string;
  image: FileMetedata;
  description: string;
  xp: number;
}

export interface OrderTransaction {
  amount: number;
  targetAddress: IotaAddress;
  type: TransactionOrderType;
  reconciled: boolean;
  void: boolean;
  nft?: EthAddress;
  beneficiary?: Entity;
  beneficiaryUid?: EthAddress;
  beneficiaryAddress?: IotaAddress;
  royaltiesFee?: number;
  royaltiesSpace?: EthAddress;
  royaltiesSpaceAddress?: IotaAddress;
  expiresOn: Timestamp;
  validationType: TransactionValidationType;
  collection?: EthAddress;
  token?: EthAddress;
  quantity?: number;
}

export interface PaymentTransaction {
  amount: number;
  sourceAddress: IotaAddress;
  targetAddress: IotaAddress;
  reconciled: boolean;
  void: boolean;
  chainReference: string;
  walletReference: WalletResult;
  sourceTransaction: string[];
  nft?: EthAddress;
  collection?: EthAddress;
  invalidPayment: boolean;
}

export interface BillPaymentTransaction {
  amount: number;
  sourceAddress: IotaAddress;
  targetAddress: IotaAddress;
  reconciled: boolean;
  void: boolean;
  previousOwnerEntity?: Entity;
  previousOwner?: EthAddress;
  ownerEntity?: Entity;
  owner?: EthAddress;
  chainReference: string;
  walletReference: WalletResult;
  sourceTransaction: string[];
  nft?: EthAddress;
  royalty: boolean;
  collection?: EthAddress;
  delay: number;
}

export interface CreditPaymentTransaction {
  type?: TransactionCreditType;
  amount: number;
  sourceAddress: IotaAddress;
  targetAddress: IotaAddress;
  reconciled: boolean;
  void: boolean;
  chainReference: string;
  walletReference: WalletResult;
  sourceTransaction: string[];
  nft?: EthAddress;
  collection?: EthAddress;
}

export interface IOTATangleTransaction {
  tranId: string;
  network: string;
  payment: boolean;
  ipfsMedia: string;
  ipfsMetadata: string;
  refund: boolean;
  member?: EthAddress;
  space?: EthAddress;
  previousOwnerEntity?: Entity;
  previousOwner?: EthAddress;
  ownerEntity?: Entity;
  owner?: EthAddress;
  nft?: EthAddress;
  token?: EthAddress;
  quantity?: number;
  royalty: boolean;
  collection?: EthAddress;
}

export type TransactionPayload =
  | VoteTransaction
  | BadgeTransaction
  | OrderTransaction
  | PaymentTransaction
  | BillPaymentTransaction
  | CreditPaymentTransaction
  | IOTATangleTransaction;

export interface Transaction extends BaseRecord {
  sourceNetwork?: Network;
  targetNetwork?: Network;
  type: TransactionType;
  member?: EthAddress;
  space?: EthAddress;
  linkedTransactions: EthAddress[];
  payload: any;
  shouldRetry?: boolean;
  ignoreWallet?: boolean;
}

export interface TransactionBillPayment extends Transaction {
  payload: BillPaymentTransaction;
}

export interface TransactionOrder extends Transaction {
  payload: OrderTransaction;
}

export interface TransactionCredit extends Transaction {
  payload: CreditPaymentTransaction;
}

export interface TransactionPayment extends Transaction {
  payload: PaymentTransaction;
}
