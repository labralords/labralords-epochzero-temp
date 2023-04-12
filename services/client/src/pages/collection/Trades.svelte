<script lang="ts">
  import { _ } from 'svelte-i18n';
  import Fa from 'svelte-fa';
  import { faArrowDownAZ, faArrowDownZA } from '@fortawesome/free-solid-svg-icons';
  import { Dropdown, DropdownItem, Tooltip } from 'flowbite-svelte';
  import { createEventDispatcher } from 'svelte';
  import { query, type ReadableQuery } from 'svelte-apollo';
  import type { TradeData, TraitFilter } from '@labralords/common';
  import { writable } from 'svelte/store';
  import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

  import { isAuthenticated, selectedNetwork } from '../../store';
  import Trade from './Trade.svelte';
  import Pagination from '../../lib/Pagination.svelte';
  import type { Order } from '../../contracts';
  import LoadingList from '../../lib/LoadingList.svelte';
  import { GET_TRADES } from '../../queries';
  import { getQueryStrings, setQueryStrings, validateOrder } from '../../util';

  export let hasValidRanks: boolean;
  export let showPlaceholderOnly: boolean;
  export let collectionId: string;
  export let loading: boolean = true;
  export let traitFilters: TraitFilter[] = [];

  const dispatch = createEventDispatcher();

  const queryStrings = getQueryStrings();

  const setListingQueryStrings = (queryStrings: Record<string, string>) => {
    setQueryStrings(Object.fromEntries(Object.entries(queryStrings).map(([key, value]) => [`t-${key}`, value])));
  };

  const getListingQueryString = (key: string) => {
    return queryStrings[`t-${key}`];
  };
  interface Trade {
    timestamp: string;
    sale_price: string;
    rank: number;
  }

  export const validateOrderBy = (v: string): keyof Trade =>
    (['timestamp', 'sale_price', 'rank'] as (keyof Trade)[]).includes(v as keyof Trade) ? (v as keyof Trade) : null;

  let orderBy: keyof Trade = validateOrderBy(getListingQueryString('orderBy')) || 'timestamp';
  let order: Order = validateOrder(getListingQueryString('order')) || 'desc';
  const requestedLimit = parseInt(getListingQueryString('limit'), 10) || 25;
  let limit = Math.min(Math.max(requestedLimit, 25), 10);
  let offset = parseInt(getListingQueryString('offset'), 10) || 0;
  let searchQuery = '';
  let show1MiTrades = false;

  const queryResult = query(GET_TRADES, {
    variables: {
      collectionId,
      traitFilters,
      offset,
      limit,
      searchQuery,
      sortBy: orderBy,
      sortOrder: order,
      network: $selectedNetwork,
      show1MiTrades,
    },
  }) as ReadableQuery<{
    trades: TradeData[];
    tradeCount: {
      total: number;
    };
  }>;

  const LabelMap = {
    timestamp: $_('Date'),
    sale_price: $_('Price'),
    rank: $_('Rank'),
  };

  $: $selectedNetwork, $isAuthenticated, traitFilters.length, (offset = 0), refetch();
  $: trades = $queryResult?.data?.trades || [];
  $: total = $queryResult?.data?.tradeCount?.total || 0;

  const refetch = () => {
    queryResult.refetch({
      collectionId,
      traitFilters,
      offset,
      limit,
      searchQuery,
      sortBy: orderBy,
      sortOrder: order,
      network: $selectedNetwork,
      show1MiTrades,
    });
  };

  const setOrderBy = (field: keyof Trade) => {
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

  const sortDropdownOpen = writable(false);

  const now = Date.now();
  const toggleModal = (trade: TradeData) => {
    dispatch('select', trade);
  };
</script>

<div class="p-4 bg-white rounded-lg border shadow-md sm:p-8 dark:bg-gray-800 dark:border-gray-700">
  <div class="flex justify-between items-center mb-4">
    <div class="flex gap-4 items-center">
      <h5 data-tooltip-target="tooltip-default" class="text-xl font-bold leading-none text-gray-900 dark:text-white">
        <Tooltip content="Trades last 60 days">
          {$_('page.collection.trades', { default: 'Trades' })} ({total})
        </Tooltip>
      </h5>
      {#if $selectedNetwork === 'iota'}
        <Tooltip content={show1MiTrades ? 'Hide 1Mi trades' : 'Show 1Mi trades'}>
          <a
            href="#"
            on:click|preventDefault={(e) => {
              show1MiTrades = !show1MiTrades;
              refetch();
            }}
          >
            <Fa
              icon={show1MiTrades ? faEye : faEyeSlash}
              class="text-gray-400 hover:text-gray-50 hover:cursor-pointer"
            />
          </a>
        </Tooltip>
      {/if}
    </div>
    <div class="flex gap-2 items-center">
      <span class="hover:cursor-pointer" on:click={() => toggleOrderDirection()}>
        <Fa icon={order === 'desc' ? faArrowDownZA : faArrowDownAZ} />
      </span>
      <Dropdown bind:open={$sortDropdownOpen} label={`${LabelMap[orderBy]}`} inline={true}>
        <DropdownItem
          on:click={() => {
            sortDropdownOpen.set(false);
            setOrderBy('timestamp');
          }}>Date</DropdownItem
        >
        <DropdownItem
          on:click={() => {
            sortDropdownOpen.set(false);
            setOrderBy('sale_price');
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
        {#each trades as trade}
          <Trade {trade} {hasValidRanks} {showPlaceholderOnly} on:click={() => toggleModal(trade)} {now} />
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
