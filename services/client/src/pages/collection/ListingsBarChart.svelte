<script lang="ts">
  import type { HistogramData, TraitFilter } from '@labralords/common';
  import { Dropdown, DropdownItem, Toggle } from 'flowbite-svelte';
  import BarChart from '../../lib/BarChart.svelte';
  import { getPrice, getQueryStrings, giota, miota, setQueryStrings } from '../../util';
  import { query, type ReadableQuery } from 'svelte-apollo';
  import { GET_LIST_PRICE_HISTOGRAM } from '../../queries';
  import { writable } from 'svelte/store';
  import LoadingChart from '../../lib/LoadingChart.svelte';
  import { isAuthenticated, selectedNetwork } from '../../store';

  export let collectionId: string;
  export let traitFilters: TraitFilter[] = [];

  const categories = writable<number[]>([]);

  const queryStrings = getQueryStrings();
  const requestedGroupSize = parseInt(queryStrings?.groupSize, 10) || 25;
  let selectedGroupSize = requestedGroupSize * miota;

  const histogram = query(GET_LIST_PRICE_HISTOGRAM, {
    variables: {
      collectionId,
      groupSize: selectedGroupSize.toString(10),
      traitFilters,
      network: $selectedNetwork,
    },
  }) as ReadableQuery<{
    listPriceHistogram: HistogramData;
  }>;

  const set = (groupSize: number) => {
    sortDropdownOpen.set(false);
    selectedGroupSize = groupSize;
    setQueryStrings({ groupSize: (selectedGroupSize / miota).toString(10) });
    refetch();
    updateCategories();
  };

  const sortDropdownOpen = writable(false);

  const updateCategories = () => {
    const cats = new Array(10).fill(0).map((_default, i) => {
      return (i + 1) * selectedGroupSize;
    });
    categories.set(cats);
  };

  const refetch = () => {
    histogram.refetch({
      collectionId,
      groupSize: selectedGroupSize.toString(10),
      traitFilters,
      network: $selectedNetwork,
    });
  };

  $: $selectedNetwork, $isAuthenticated, traitFilters.length, refetch();

  updateCategories();
  const stacked = writable<boolean>(queryStrings?.stacked === 'true' || false);
  const setStacked = (e: any) => {
    const checked = e.target.checked;
    stacked.set(checked);
    setQueryStrings({ stacked: checked?.toString() });
  };
</script>

{#if $histogram.loading}
  <LoadingChart />
{:else if $histogram?.data?.listPriceHistogram?.data?.length > 0}
  <div class="flex ml-5 mr-12 justify-between items-center">
    <h2 class="font-thin uppercase text-lg">Listings</h2>
    <div class="flex gap-2">
      <div class="flex gap-2">
        <span class="place-self-center">Group Size:</span>
        {#if $selectedNetwork === 'smr'}
          <Dropdown
            bind:open={$sortDropdownOpen}
            class="z-10"
            inline={true}
            label={getPrice(selectedGroupSize, $selectedNetwork)}
          >
            <DropdownItem on:click={() => set(5 * miota)}>5 SMR</DropdownItem>
            <DropdownItem on:click={() => set(10 * miota)}>10 SMR</DropdownItem>
            <DropdownItem on:click={() => set(25 * miota)}>25 SMR</DropdownItem>
            <DropdownItem on:click={() => set(50 * miota)}>50 SMR</DropdownItem>
            <DropdownItem on:click={() => set(100 * miota)}>100 SMR</DropdownItem>
            <DropdownItem on:click={() => set(250 * miota)}>250 SMR</DropdownItem>
            <DropdownItem on:click={() => set(500 * miota)}>500 SMR</DropdownItem>
            <DropdownItem on:click={() => set(1 * giota)}>1000 SMR</DropdownItem>
            <DropdownItem on:click={() => set(2 * giota)}>2000 SMR</DropdownItem>
            <DropdownItem on:click={() => set(5 * giota)}>5000 SMR</DropdownItem>
            <DropdownItem on:click={() => set(10 * giota)}>10000 SMR</DropdownItem>
          </Dropdown>
        {:else}
          <Dropdown
            bind:open={$sortDropdownOpen}
            class="z-10"
            inline={true}
            label={getPrice(selectedGroupSize, $selectedNetwork)}
          >
            <DropdownItem on:click={() => set(5 * miota)}>5 Mi</DropdownItem>
            <DropdownItem on:click={() => set(10 * miota)}>10 Mi</DropdownItem>
            <DropdownItem on:click={() => set(25 * miota)}>25 Mi</DropdownItem>
            <DropdownItem on:click={() => set(50 * miota)}>50 Mi</DropdownItem>
            <DropdownItem on:click={() => set(100 * miota)}>100 Mi</DropdownItem>
            <DropdownItem on:click={() => set(250 * miota)}>250 Mi</DropdownItem>
            <DropdownItem on:click={() => set(500 * miota)}>500 Mi</DropdownItem>
            <DropdownItem on:click={() => set(1 * giota)}>1 Gi</DropdownItem>
            <DropdownItem on:click={() => set(2 * giota)}>2 Gi</DropdownItem>
            <DropdownItem on:click={() => set(5 * giota)}>5 Gi</DropdownItem>
            <DropdownItem on:click={() => set(10 * giota)}>10 Gi</DropdownItem>
          </Dropdown>
        {/if}
      </div>
      <Toggle on:click={setStacked} checked={$stacked}>Stacked</Toggle>
    </div>
  </div>
  <BarChart
    selectedNetwork={$selectedNetwork}
    values={$histogram?.data?.listPriceHistogram?.data || []}
    categories={$categories}
    stacked={$stacked}
  />
{:else}
  <div class="flex flex-col items-center justify-center h-full">
    <div class="text-gray-400 dark:text-gray-600">No listing data available</div>
  </div>
{/if}
