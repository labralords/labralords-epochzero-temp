<script lang="ts">
  import _ from 'lodash';
  import Fa from 'svelte-fa';
  import { faArrowDownAZ, faArrowDownZA } from '@fortawesome/free-solid-svg-icons';
  import type { NftCollectionData, TradeStatistics } from '@labralords/common';
  import { query, type ReadableQuery } from 'svelte-apollo';
  import { GET_COLLECTIONS_BY_OWNER } from '../../queries';
  import { Button, Input, Tooltip } from 'flowbite-svelte';
  import { getPrice, getQueryStrings, setQueryStrings, validateOrder, validateTimeSpan } from '../../util';
  import { navigate } from 'svelte-navigator';
  import TimeSpanSelector from '../../lib/TimeSpanSelector.svelte';
  import UpdateMetadataModal from '../../lib/UpdateMetadataModal.svelte';
  import Pagination from '../../lib/Pagination.svelte';
  import type { Order } from '../../contracts';
  import { isAuthenticated, selectedNetwork } from '../../store';
  import { writable } from 'svelte/store';
  import type { SvelteComponent } from 'svelte';

  type CollectionDataWithTradeStats = NftCollectionData & TradeStatistics;
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

  const queryResult = query(GET_COLLECTIONS_BY_OWNER, {
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
    collectionsByOwner: CollectionDataWithTradeStats[];
    collectionCount: { total: number };
  }>;

  const refetch = () => {
    queryResult.refetch({
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

  $: collections = $queryResult?.data?.collectionsByOwner || [];
  $: orderIcon = order === 'asc' ? faArrowDownAZ : faArrowDownZA;
  $: loading = $queryResult.loading;

  let updateMetadataModalOpen = writable(false);
  let modal: SvelteComponent;

  const closeModal = () => {
    modal.closeModal();
    updateMetadataModalOpen.set(false);
  };

  const selectedCollection = writable<CollectionDataWithTradeStats>(null);

  const openModal = (collection: CollectionDataWithTradeStats) => {
    updateMetadataModalOpen.set(true);
    selectedCollection.set(collection);
  };
</script>

<div class="m-5 mt-10 mr-auto ml-auto w-10/12 relative shadow-md sm:rounded-lg overflow-x-hidden">
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
          <th scope="col" class="py-3 px-6 cursor-pointer" on:click={() => sortBy('averagePrice')}>
            <span class="flex gap-2 items-center">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {#if loading}
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
        {:else if collections?.length > 0}
          {#each collections as collection}
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
                >{getPrice(parseInt(collection.volume, 10), collection.network)}</th
              >
              <th scope="row" class="py-4 px-6 font-thin text-gray-900 whitespace-nowrap dark:text-white"
                >{getPrice(parseInt(collection.averagePrice, 10), collection.network)}</th
              >
              <th scope="row" class="py-4 px-6 font-thin text-gray-900 whitespace-nowrap dark:text-white">
                <button
                  class="inline-flex justify-between gap-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-xs px-2 py-1 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  on:click|stopPropagation={() => openModal(collection)}>Update ranks</button
                >
              </th>
            </tr>
          {/each}
          <div />
        {:else}
          <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
            <th colspan="5" scope="row" class="py-4 px-6 font-thin text-gray-900 whitespace-nowrap dark:text-white">
              No collections found
            </th>
          </tr>
        {/if}
      </tbody>
    </table>
    {#if collections.length > 0}
      <div class="my-5">
        <Pagination
          itemsPerPage={limit}
          selectedPage={offset / limit}
          total={$queryResult?.data?.collectionCount?.total || 0}
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

{#if $selectedCollection}
  <UpdateMetadataModal
    bind:this={modal}
    collection={$selectedCollection}
    bind:open={$updateMetadataModalOpen}
    on:handlebtn1={() => closeModal()}
  />
{/if}
