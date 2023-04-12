<script lang="ts">
  import type { TradeData, TraitFilter } from '@labralords/common';
  import { query, type ReadableQuery } from 'svelte-apollo';
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { GET_GLOBAL_TRADES } from '../../queries';
  import type { Order } from '../../contracts';
  import Trade from '../collection/Trade.svelte';
  import Filters from '../../lib/Filters.svelte';
  import { isAuthenticated, selectedNetwork } from '../../store';

  const dispatch = createEventDispatcher();

  export let minPrice: string = null;
  export let maxPrice: string = null;
  export let minRank: number = null;
  export let maxRank: number = null;
  export let networkOnly: boolean = false;

  let offset = 0;
  let limit = 25;
  let searchQuery: string = '';
  let sortBy: string = 'timestamp';
  let sortOrder: Order = 'desc';
  let traitFilters: TraitFilter[] = [];

  const queryResult = query(GET_GLOBAL_TRADES, {
    variables: {
      offset,
      limit,
      searchQuery,
      sortBy,
      sortOrder,
      traitFilters,
      minPrice,
      maxPrice,
      minRank,
      maxRank,
      network: networkOnly ? $selectedNetwork : undefined,
    },
  }) as ReadableQuery<{
    globalTrades: TradeData[];
  }>;

  $: $selectedNetwork, $isAuthenticated, refetch();
  $: trades = $queryResult?.data?.globalTrades || [];

  const refetch = () => {
    offset = 0;
    queryResult.refetch({
      offset,
      limit,
      searchQuery,
      sortBy,
      sortOrder,
      traitFilters,
      minPrice,
      maxPrice,
      minRank,
      maxRank,
      network: networkOnly ? $selectedNetwork : undefined,
    });
  };

  const now = Date.now();

  export let threshold = 0;
  export let hasMore = true;
  let isLoadMore = false;

  onMount(() => {
    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onScroll);
  });

  const onScroll = async () => {
    const scrollOffset =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight -
      document.documentElement.scrollTop;
    if (scrollOffset <= threshold) {
      if (!isLoadMore && hasMore) {
        offset += limit;
        try {
          await queryResult.fetchMore({
            variables: {
              offset,
              limit,
              searchQuery,
              sortBy,
              sortOrder,
              traitFilters,
              minPrice,
              maxPrice,
              minRank,
              maxRank,
              network: networkOnly ? $selectedNetwork : undefined,
            },
            updateQuery: (prev, { fetchMoreResult }) => {
              if (!fetchMoreResult) {
                return prev;
              }
              if (fetchMoreResult.globalTrades.length < limit) {
                hasMore = false;
              }
              return {
                globalTrades: [...prev.globalTrades, ...fetchMoreResult.globalTrades],
              };
            },
          });
        } catch (e) {
          console.error(e);
        } finally {
          isLoadMore = true;
        }
      }
    } else {
      isLoadMore = false;
    }
  };

  onDestroy(() => {
    window.removeEventListener('scroll', null);
    window.removeEventListener('resize', null);
  });
</script>

<Filters
  bind:networkOnly
  bind:searchQuery
  bind:maxPrice
  bind:maxRank
  bind:minPrice
  bind:minRank
  on:changed={() => refetch()}
/>

{#if trades?.length > 0}
  <div
    class="grid gap-5 mt-5 ml-5 mr-5 grid-flow-row-dense grid-cols-1 md:grid-cols-2 xl:grid-cols-3 grid-rows-2 md:grid-rows-1 mt-30"
  >
    {#each trades as trade}
      <Trade
        {trade}
        hasValidRanks={true}
        showPlaceholderOnly={false}
        on:click={() => dispatch('nft-select', trade)}
        {now}
      />
    {/each}
  </div>
{:else}
  <div class="text-center font-thin mt-32">No trades found</div>
{/if}
