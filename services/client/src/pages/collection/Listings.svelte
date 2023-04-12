<script lang="ts">
  import { _ } from 'svelte-i18n';
  import Fa from 'svelte-fa';
  import { faArrowDownAZ, faArrowDownZA, faGavel, faList } from '@fortawesome/free-solid-svg-icons';
  import { Dropdown, DropdownItem, Tooltip } from 'flowbite-svelte';
  import type { NftData, TraitFilter } from '@labralords/common';
  import { createEventDispatcher } from 'svelte';
  import { writable } from 'svelte/store';
  import { query, type ReadableQuery } from 'svelte-apollo';

  import { isAuthenticated, selectedNetwork } from '../../store';
  import Pagination from '../../lib/Pagination.svelte';
  import type { Order } from '../../contracts';
  import Listing from './Listing.svelte';
  import LoadingList from '../../lib/LoadingList.svelte';
  import { GET_LISTINGS } from '../../queries';
  import { getQueryStrings, setQueryStrings, validateOrder } from '../../util';

  export let hasValidRanks: boolean;
  export let showPlaceholderOnly: boolean;
  export let collectionId: string;
  export let loading = true;
  export let traitFilters: TraitFilter[] = [];

  const dispatch = createEventDispatcher();

  const queryStrings = getQueryStrings();

  const setListingQueryStrings = (queryStrings: Record<string, string>) => {
    setQueryStrings(Object.fromEntries(Object.entries(queryStrings).map(([key, value]) => [`l-${key}`, value])));
  };

  const getListingQueryString = (key: string) => {
    return queryStrings[`l-${key}`];
  };

  interface Listing {
    listed_at: string;
    current_price: string;
    rank: number;
  }

  export const validateOrderBy = (v: string): keyof Listing =>
    (['listed_at', 'current_price', 'rank'] as (keyof Listing)[]).includes(v as keyof Listing)
      ? (v as keyof Listing)
      : null;

  let orderBy: keyof Listing = validateOrderBy(getListingQueryString('orderBy')) || 'current_price';
  let order: Order = validateOrder(getListingQueryString('order')) || 'asc';

  const requestedLimit = parseInt(getListingQueryString('limit'), 10) || 25;
  let limit = Math.min(Math.max(requestedLimit, 25), 10);
  let offset = parseInt(getListingQueryString('offset'), 10) || 0;
  let searchQuery = '';
  let auctions = getListingQueryString('auctions') === 'true' || false;

  const queryResult = query(GET_LISTINGS, {
    variables: {
      collectionId,
      traitFilters,
      offset,
      limit,
      searchQuery,
      sortBy: orderBy,
      sortOrder: order,
      auctions,
      network: $selectedNetwork,
    },
  }) as ReadableQuery<{
    listings: NftData[];
    listingCount: {
      total: number;
    };
  }>;

  const LabelMap = {
    listed_at: $_('Date'),
    current_price: $_('Price'),
    rank: $_('Rank'),
  };

  $: $selectedNetwork, $isAuthenticated, traitFilters.length, (offset = 0), refetch();
  $: listings = $queryResult?.data?.listings || [];
  $: total = $queryResult?.data?.listingCount?.total || 0;

  const refetch = () => {
    queryResult.refetch({
      collectionId,
      traitFilters,
      offset,
      limit,
      searchQuery,
      sortBy: orderBy,
      sortOrder: order,
      auctions,
      network: $selectedNetwork,
    });
  };

  const setOrderBy = (field: keyof Listing) => {
    offset = 0;
    orderBy = field;
    setListingQueryStrings({ offset: offset?.toString(), orderBy: orderBy as string, order });
    refetch();
  };

  const toggleOrderDirection = () => {
    offset = 0;
    order = order === 'asc' ? 'desc' : 'asc';
    setListingQueryStrings({ offset: offset?.toString(), orderBy: orderBy as string, order });
    refetch();
  };

  const toggleAuctions = () => {
    offset = 0;
    auctions = !auctions;
    setListingQueryStrings({ offset: offset?.toString(), auctions: auctions?.toString() });
    refetch();
  };

  const sortDropdownOpen = writable(false);

  const now = Date.now();
  const toggleModal = (listing: NftData) => {
    dispatch('select', listing);
  };
</script>

<div class="p-4 bg-white rounded-lg border shadow-md sm:p-8 dark:bg-gray-800 dark:border-gray-700">
  <div class="flex justify-between items-center mb-4">
    <h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white">
      <Tooltip content={auctions ? 'Current auctions' : 'Current listings'}>
        {auctions
          ? $_('page.collection.auctions', { default: 'Auctions' })
          : $_('page.collection.listings', { default: 'Listings' })} ({total})
      </Tooltip>
    </h5>
    <div class="flex gap-2 items-center">
      <span class="hover:cursor-pointer mr-2" on:click={() => toggleAuctions()}>
        <Tooltip content={auctions ? 'Show listings' : 'Show auctions'}>
          <Fa icon={auctions ? faList : faGavel} />
        </Tooltip>
      </span>
      <span class="hover:cursor-pointer" on:click={() => toggleOrderDirection()}>
        <Fa icon={order === 'desc' ? faArrowDownZA : faArrowDownAZ} />
      </span>
      <Dropdown bind:open={$sortDropdownOpen} label={`${LabelMap[orderBy]}`} inline={true}>
        <DropdownItem
          on:click={() => {
            sortDropdownOpen.set(false);
            setOrderBy('listed_at');
          }}>Date</DropdownItem
        >
        <DropdownItem
          on:click={() => {
            sortDropdownOpen.set(false);
            setOrderBy('current_price');
          }}>Price</DropdownItem
        >
        {#if hasValidRanks}
          <DropdownItem
            on:click={() => {
              sortDropdownOpen.set(false);
              setOrderBy('rank');
            }}>Rank</DropdownItem
          >
        {/if}
      </Dropdown>
    </div>
  </div>
  <div class="flow-root">
    <ul class="divide-y divide-gray-200 dark:divide-gray-700">
      {#if loading}
        <LoadingList />
      {:else}
        {#each listings as listing}
          <Listing {listing} {hasValidRanks} {showPlaceholderOnly} on:click={() => toggleModal(listing)} {now} />
        {/each}
      {/if}
    </ul>
    <Pagination
      itemsPerPage={limit}
      selectedPage={offset / limit}
      {total}
      on:page={(page) => {
        offset = (page.detail + 1) * limit - limit;
        setListingQueryStrings({ offset: offset?.toString(), limit: limit?.toString() });
        refetch();
      }}
    />
  </div>
</div>
