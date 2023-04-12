<script lang="ts">
  import Fa from 'svelte-fa';
  import { faArrowDownAZ, faArrowDownZA } from '@fortawesome/free-solid-svg-icons';
  import { query, type ReadableQuery } from 'svelte-apollo';
  import { useNavigate } from 'svelte-navigator';
  import { Button, Input, Tooltip } from 'flowbite-svelte';
  import type { NftCollectionData, TradeStatistics } from '@labralords/common';
  import { GET_COLLECTIONS } from '../../queries';
  import { getPrice, getQueryStrings, setQueryStrings, validateOrder, validateTimeSpan } from '../../util';
  import Pagination from '../../lib/Pagination.svelte';
  import TimeSpanSelector from '../../lib/TimeSpanSelector.svelte';
  import type { Order } from '../../contracts';
  import WarningNotice from '../../lib/WarningNotice.svelte';
  import { isAuthenticated, selectedNetwork } from '../../store';

  type CollectionDataWithTradeStats = NftCollectionData & TradeStatistics;

  const navigate = useNavigate();

  const queryStrings = getQueryStrings();

  export const validateOrderBy = (v: string): keyof CollectionDataWithTradeStats =>
    (['name', 'volume', 'numberOfTrades', 'averagePrice'] as (keyof CollectionDataWithTradeStats)[]).includes(
      v as keyof CollectionDataWithTradeStats,
    )
      ? (v as keyof CollectionDataWithTradeStats)
      : null;

  let orderBy: keyof CollectionDataWithTradeStats = validateOrderBy(queryStrings?.orderBy) || 'volume';
  let order: Order = validateOrder(queryStrings?.order) || 'desc';

  const requestedLimit = parseInt(queryStrings?.limit, 10) || 25;
  let limit = Math.min(Math.max(requestedLimit, 25), 100);
  let offset = parseInt(queryStrings?.offset, 10) || 0;
  let searchQuery = queryStrings?.search || '';
  let selectedTimeSpan = validateTimeSpan(queryStrings?.timeSpan) || '1 month';

  const collections = query(GET_COLLECTIONS, {
    variables: {
      sortBy: orderBy,
      sortOrder: order,
      limit,
      offset,
      searchQuery: searchQuery?.trim(),
      timeSpan: selectedTimeSpan,
      network: $selectedNetwork,
    },
  }) as ReadableQuery<{
    nftCollections: CollectionDataWithTradeStats[];
    collectionCount: { total: number };
  }>;

  const refetch = () => {
    collections.refetch({
      offset,
      limit,
      sortBy: orderBy,
      sortOrder: order,
      searchQuery: searchQuery?.trim(),
      timeSpan: selectedTimeSpan,
      network: $selectedNetwork,
    });
  };

  $: $selectedNetwork, $isAuthenticated, refetch();

  const sortBy = (newOrderBy: keyof CollectionDataWithTradeStats) => {
    offset = 0;
    if (orderBy === newOrderBy) {
      order = order === 'asc' ? 'desc' : 'asc';
      setQueryStrings({ offset: offset?.toString(), orderBy, order });
      refetch();
      return;
    }
    order = 'desc';
    orderBy = newOrderBy;
    setQueryStrings({ offset: offset?.toString(), orderBy, order });
    refetch();
  };

  let sortedCollections: CollectionDataWithTradeStats[] = [];

  $: orderIcon = order === 'asc' ? faArrowDownAZ : faArrowDownZA;
  $: sortedCollections = $collections?.data?.nftCollections;
</script>

<svelte:head>
  <title>Labralords. | Collections</title>
</svelte:head>

<div class="m-5 mt-10 mr-auto ml-auto w-10/12 relative shadow-md sm:rounded-lg overflow-x-hidden">
  <h1 class="mb-5 text-3xl font-thin text-left">Collections</h1>
  <p class="mb-5 text-gray-400 font-thin italic">
    Labralords is currently in alpha with a limited set of collections. Get life time access by buying and holding our
    NFT at Soonaverse.
  </p>
  {#if !$isAuthenticated}
    <WarningNotice
      title="Login required"
      message="You need connect your wallet to view collections. Only Labralords NFT holders can view collections. Make sure you connect the correct wallet."
    />
  {/if}
  <div class="text-right">
    <TimeSpanSelector
      bind:selectedTimeSpan
      on:change={() => {
        setQueryStrings({ timeSpan: selectedTimeSpan });
        refetch();
      }}
    />
  </div>
  <div class="overflow-x-scroll">
    <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
      <caption class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
        <div class="relative w-screen sm:w-96">
          <form on:submit|preventDefault={refetch}>
            <Input
              bind:value={searchQuery}
              noBorder
              id="search"
              iconClass="h-5 w-5 mr-2 dark:text-green-500"
              placeholder="Search by collection name"
              class="p-4 w-screen sm:w-96"
              autocomplete="off"
            />
            <Button
              on:click={() => {
                setQueryStrings({ search: searchQuery });
                refetch();
              }}
              textSize="text-sm"
              class="text-white absolute right-1 bottom-1 py-2"
              type="submit">Search</Button
            >
          </form>
        </div>
      </caption>
      <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
        <tr>
          <th scope="col" class="py-3 px-6 cursor-pointer" on:click={() => sortBy('name')}>
            <span class="flex gap-2 items-center">
              Project {#if orderBy === 'name'}
                <Fa icon={orderIcon} />
              {/if}
            </span>
          </th>
          <th scope="col" class="py-3 px-6 cursor-pointer" on:click={() => sortBy('numberOfTrades')}>
            <span class="flex gap-2 items-center"
              ><Tooltip class="normal-case" content="Number of trades in the given time span"># of Trades</Tooltip>
              {#if orderBy === 'numberOfTrades'}
                <Fa icon={orderIcon} />
              {/if}
            </span>
          </th>
          <th scope="col" class="py-3 px-6 cursor-pointer" on:click={() => sortBy('volume')}>
            <span class="flex gap-2 items-center"
              ><Tooltip class="normal-case" content="Volume in the given time span">Volume</Tooltip>
              {#if orderBy === 'volume'}
                <Fa icon={orderIcon} />
              {/if}
            </span>
          </th>
          <th scope="col" class="py-3 px-6 cursor-pointer" on:click={() => sortBy('averagePrice')}>
            <span class="flex gap-2 items-center"
              ><Tooltip class="normal-case" content="Average price in the given time span">Avg Price</Tooltip>
              {#if orderBy === 'averagePrice'}
                <Fa icon={orderIcon} />
              {/if}
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        {#if $collections.loading}
          <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
            <th colspan="4" scope="row" class="py-4 px-6 font-medium text-gray-900 whitespace-nowrap dark:text-white">
              <div role="status" class="max-w-sm animate-pulse">
                <div class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4" />
                <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px] mb-2.5" />
                <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5" />
                <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[330px] mb-2.5" />
                <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[300px] mb-2.5" />
                <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px]" />
                <span class="sr-only">Loading...</span>
              </div>
            </th>
          </tr>
        {:else if $collections?.data?.nftCollections?.length > 0}
          {#each sortedCollections as collection}
            <tr
              on:click={() => navigate(`/collections/${collection.id}`)}
              class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-600 hover:cursor-pointer"
            >
              <th scope="row" class="py-4 px-6 font-thin text-gray-900 whitespace-nowrap dark:text-white">
                {collection.name}
              </th>
              <th scope="row" class="py-4 px-6 font-thin text-gray-900 whitespace-nowrap dark:text-white"
                >{collection.numberOfTrades}</th
              >
              <th scope="row" class="py-4 px-6 font-thin text-gray-900 whitespace-nowrap dark:text-white"
                >{getPrice(parseInt(collection.volume, 10), $selectedNetwork)}</th
              >
              <th scope="row" class="py-4 px-6 font-thin text-gray-900 whitespace-nowrap dark:text-white"
                >{getPrice(parseInt(collection.averagePrice, 10), $selectedNetwork)}</th
              >
            </tr>
          {/each}
          <div />
        {:else}
          <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
            <th colspan="4" scope="row" class="py-4 px-6 font-thin text-gray-900 whitespace-nowrap dark:text-white">
              No collections found
            </th>
          </tr>
        {/if}
      </tbody>
    </table>
    {#if $collections?.data?.nftCollections?.length > 0}
      <div class="my-5">
        <Pagination
          itemsPerPage={limit}
          selectedPage={offset / limit}
          total={$collections?.data?.collectionCount?.total || 0}
          on:page={(page) => {
            offset = (page.detail + 1) * limit - limit;
            setQueryStrings({ offset: offset?.toString(), limit: limit?.toString() });
            refetch();
          }}
        />
      </div>
    {/if}
  </div>
</div>
