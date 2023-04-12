import { DataResponse, HistogramData, NftCollectionData, NftCollectionStatistics } from '@labralords/common';

export type NftCollectionsResponse = DataResponse<{ nftCollections: NftCollectionData[] }>;
export type NftCollectionResponse = DataResponse<{ nftCollection: NftCollectionData }>;
export type NftCollectionStatsResponse = DataResponse<{ collectionStats: NftCollectionStatistics }>;
export type FloorPriceHistogramResponse = DataResponse<{ floorHistogram: HistogramData }>;
