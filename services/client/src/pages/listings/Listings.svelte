<script lang="ts">
  import type { NftData, TraitFilter } from '@labralords/common';
  import { query, type ReadableQuery } from 'svelte-apollo';
  import { GET_GLOBAL_LISTINGS } from '../../queries';
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import type { Order } from '../../contracts';
  import Listing from '../collection/Listing.svelte';
  import Filters from '../../lib/Filters.svelte';
  import { isAuthenticated, selectedNetwork } from '../../store';

  export let minPrice: string = null;
  export let maxPrice: string = null;
  export let minRank: number = null;
  export let maxRank: number = null;
  export let networkOnly: boolean = false;

  const dispatch = createEventDispatcher();

  let offset = 0;
  let limit = 25;
  let searchQuery: string = '';
  let sortBy: string = 'listed_at';
  let sortOrder: Order = 'desc';
  let traitFilters: TraitFilter[] = [];

  const queryResult = query(GET_GLOBAL_LISTINGS, {
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
    globalListings: NftData[];
  }>;

  $: $selectedNetwork, $isAuthenticated, refetch();
  $: listings = $queryResult?.data?.globalListings || [];

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
              if (fetchMoreResult.globalListings.length < limit) {
                hasMore = false;
              }
              return {
                globalListings: [...prev.globalListings, ...fetchMoreResult.globalListings],
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

{#if listings?.length > 0}
  <div
    class="grid gap-5 mt-5 ml-5 mr-5 grid-flow-row-dense grid-cols-1 md:grid-cols-2 xl:grid-cols-3 grid-rows-2 md:grid-rows-1 mt-30"
  >
    {#each listings as listing}
      <Listing
        {listing}
        hasValidRanks={true}
        showPlaceholderOnly={false}
        on:click={() => dispatch('nft-select', listing)}
        {now}
      />
    {/each}
  </div>
{:else}
  <div class="text-center font-thin mt-32">No listings found</div>
{/if}
