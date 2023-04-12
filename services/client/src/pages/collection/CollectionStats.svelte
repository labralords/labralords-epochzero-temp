<script lang="ts">
  import type { NftCollectionStatistics } from '@labralords/common';
  import { GET_COLLECTION_STATISTICS } from '../../queries';
  import { query, type ReadableQuery } from 'svelte-apollo';
  import { getPrice, humanizeNumber } from '../../util';
  import StatsItem from '../../lib/StatsItem.svelte';
  import { isAuthenticated } from '../../store';

  export let collectionId: string;
  export let selectedNetwork: string;

  let loaded: boolean = false;
  let supply: number;
  let minted: number;
  let averageNftPerHolder: number;
  let revealPercentage: number;
  let uniqueHolders: number;
  let royaltiesFee: number;
  let listingCount: number;
  let newListingCount: number;
  let floorPrice: number;
  let sevenDaySales: number;
  let oneDaySales: number;
  let oneHourSales: number;

  const queryResult = query(GET_COLLECTION_STATISTICS, {
    variables: {
      collectionId,
    },
  }) as ReadableQuery<{
    nftCollectionStatistics: NftCollectionStatistics;
  }>;

  const refetch = () => {
    queryResult.refetch({
      collectionId,
    });
  };

  $: $isAuthenticated, refetch();
  $: {
    ({
      supply,
      minted,
      uniqueHolders,
      royaltiesFee,
      listingCount,
      newListingCount,
      floorPrice,
      sevenDaySales,
      oneDaySales,
      oneHourSales,
      revealPercentage,
      averageNftPerHolder,
    } = $queryResult.data?.nftCollectionStatistics || {});
  }

  $: loaded = !$queryResult.loading;
</script>

<div
  class="grid ml-5 mr-5 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-4 bg-white dark:bg-gray-800 shadow-sm rounded-lg lg:divide-x lg:divide-gray-700"
>
  <div class="grid grid-cols-3">
    <StatsItem label="Supply" value={humanizeNumber(supply)} {loaded} />
    <StatsItem label="Minted" value={humanizeNumber(minted)} {loaded} />
    <StatsItem label="Revealed" value={`${humanizeNumber(revealPercentage, 1)}%`} {loaded} />
  </div>
  <div class="grid grid-cols-3">
    <StatsItem label="Royalty" value={`${humanizeNumber(royaltiesFee * 100)}%`} {loaded} />
    <StatsItem label="Holders" value={humanizeNumber(uniqueHolders)} {loaded} />
    <StatsItem label="Avg NFT per holder" value={humanizeNumber(averageNftPerHolder, 1)} {loaded} />
  </div>
  <div class="grid grid-cols-3">
    <StatsItem label="Listings" value={humanizeNumber(listingCount)} {loaded} />
    <StatsItem label="New listings" value={humanizeNumber(newListingCount)} {loaded} />
    <StatsItem label="Floor" value={getPrice(floorPrice, selectedNetwork)} {loaded} />
  </div>
  <div class="grid grid-cols-3">
    <StatsItem label="7D Sales" value={humanizeNumber(sevenDaySales)} {loaded} />
    <StatsItem label="1D Sales" value={humanizeNumber(oneDaySales)} {loaded} />
    <StatsItem label="1H Sales" value={humanizeNumber(oneHourSales)} {loaded} />
  </div>
</div>
