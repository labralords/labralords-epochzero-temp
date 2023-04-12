<script lang="ts">
  import type {
    NftCollectionData,
    NftData,
    TraitFilter,
    TraitFilterData,
    TraitCategory,
    Trait,
  } from '@labralords/common';
  import Listings from './Listings.svelte';
  import { query, type ReadableQuery } from 'svelte-apollo';
  import Fa from 'svelte-fa';
  import { faXmark } from '@fortawesome/free-solid-svg-icons';
  import { GET_COLLECTION_DATA } from '../../queries';
  import Trades from './Trades.svelte';
  import CollectionStats from './CollectionStats.svelte';
  import TradeChart from './TradeChart.svelte';
  import ListingsBarChart from './ListingsBarChart.svelte';
  import CollectionHeader from './CollectionHeader.svelte';
  import NftModal from '../../lib/NftModal.svelte';
  import { writable } from 'svelte/store';
  import { Dropdown, DropdownItem } from 'flowbite-svelte';
  import { onDestroy, onMount, SvelteComponent } from 'svelte';
  import { isAuthenticated } from '../../store';

  export let collectionId: string;

  let name: string;
  let network: string;
  let loading: boolean = true;
  let twitterUsername: string;
  let discordUsername: string;
  let soonaverseUri: string;
  let minted: number = 0;
  let supply: number = 0;
  let hasValidRanks: boolean = false;
  let showPlaceholderOnly: boolean = true;

  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

  const queryResult = query(GET_COLLECTION_DATA, {
    variables: {
      collectionId,
    },
  }) as ReadableQuery<{
    nftCollection: NftCollectionData;
    traitFilters: TraitFilterData;
  }>;

  let allNotMinted = false;
  let sortedTraitCategories: any[] = [];
  let traitsByCategory: Record<string, any[]> = {};
  let filterByCategory: Record<string, TraitFilter> = {};

  let traitFilters: TraitFilter[] = [];

  $: $isAuthenticated, refetch();

  $: {
    ({
      name,
      network,
      twitterUsername,
      discordUsername,
      uri: soonaverseUri,
      minted,
      supply,
      hasValidRanks,
      showPlaceholderOnly,
    } = $queryResult?.data?.nftCollection || {});
    allNotMinted = supply - minted > 0;
    const traitCategories = $queryResult?.data?.traitFilters?.traitCategories || [];
    sortedTraitCategories = traitCategories
      .concat([])
      .sort((a, b) => collator.compare(a.traitCategoryLabel, b.traitCategoryLabel));
    traitsByCategory = Object.fromEntries(
      $queryResult?.data?.traitFilters?.traitsByCategory?.map(({ key, value }) => [
        key,
        value.concat([]).sort((a, b) => collator.compare(a.traitLabel, b.traitLabel)),
      ]) || [],
    );
  }

  $: {
    traitFilters = Object.entries(filterByCategory).map(([_, filter]) => ({
      traitCategoryId: filter.traitCategoryId,
      traitCategoryLabel: filter.traitCategoryLabel,
      traitId: filter.traitId,
      traitLabel: filter.traitLabel,
    }));
  }

  $: loading = $queryResult?.loading;

  let nftModalOpen = writable(false);
  let modal: SvelteComponent;

  const closeModal = () => {
    modal.closeModal();
    nftModalOpen.set(false);
  };

  const selectedNft = writable<Pick<NftData, 'name' | 'id' | 'collectionId' | 'mediaUri' | 'uri' | 'rank'> | null>(
    null,
  );
  const selectedCategory = writable<TraitCategory>(null);
  const selectedTrait = writable<Trait>(null);

  const categoryDropdownOpen = writable(false);
  const traitDropdownOpen = writable(false);

  const openModal = (nft: Pick<NftData, 'name' | 'id' | 'collectionId' | 'mediaUri' | 'uri' | 'rank'>) => {
    nftModalOpen.set(true);
    selectedNft.set(nft);
  };

  const getTraitsByCategory = (traitCategoryId: string) => {
    const traits = traitsByCategory?.[traitCategoryId];
    if (!traits) {
      return [];
    }
    return traits;
  };

  const addTraitFilter = (traitCategoty: TraitCategory, trait: Trait) => {
    filterByCategory[traitCategoty.id] = {
      traitCategoryLabel: traitCategoty.traitCategoryLabel,
      traitCategoryId: traitCategoty.id,
      traitLabel: trait.traitLabel,
      traitId: trait.id,
    };
  };

  const removeTrait = (categoryId: string) => {
    filterByCategory = Object.fromEntries(Object.entries(filterByCategory).filter(([key]) => key !== categoryId));
  };

  const refetch = () => {
    queryResult.refetch({
      collectionId,
    });
  };

  let interval: NodeJS.Timer;

  onMount(() => {
    interval = setInterval(() => {
      refetch();
    }, 60000);
  });

  onDestroy(() => {
    clearInterval(interval);
  });
</script>

<CollectionHeader {name} {twitterUsername} {discordUsername} {soonaverseUri} {hasValidRanks} {allNotMinted} />

<CollectionStats selectedNetwork={network} {collectionId} />

{#if sortedTraitCategories.length}
  <div class="m-5 flex gap-2 items-center">
    <span>Filter:</span>
    <Dropdown
      bind:open={$categoryDropdownOpen}
      label={$selectedCategory?.traitCategoryLabel || 'Category'}
      inline={true}
      class="max-h-64 overflow-scroll z-10"
    >
      {#each sortedTraitCategories as category}
        <DropdownItem
          class={filterByCategory[category.id]
            ? 'dark:bg-gray-600 !dark:text-gray-500 !text-gray-500 hover:cursor-default hover:dark:text-gray-500 hover:text-gray-500'
            : ''}
          on:click={() => {
            categoryDropdownOpen.set(false);
            if (filterByCategory[category.id]) return;
            selectedTrait.set(null);
            selectedCategory.set(category);
          }}
        >
          {category.traitCategoryLabel}
        </DropdownItem>
      {/each}
    </Dropdown>
    {#if $selectedCategory}
      <Dropdown
        bind:open={$traitDropdownOpen}
        label={$selectedTrait?.traitLabel || 'Trait'}
        inline={true}
        class="max-h-64 overflow-scroll z-10"
      >
        {#each getTraitsByCategory($selectedCategory?.id) as trait}
          <DropdownItem
            on:click={() => {
              traitDropdownOpen.set(false);
              selectedTrait.set(trait);
            }}
          >
            {trait?.traitLabel}
          </DropdownItem>
        {/each}
      </Dropdown>
    {/if}
    {#if $selectedTrait}
      <button
        on:click={() => {
          addTraitFilter($selectedCategory, $selectedTrait);
          selectedTrait.set(null);
          selectedCategory.set(null);
        }}
        class="flex justify-between gap-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >Add</button
      >
    {/if}
  </div>
  <div class="m-5 flex gap-2 items-center">
    {#if traitFilters?.length}
      {#each traitFilters as filter}
        <span class="flex gap-2 rounded-full items-center bg-gray-600 py-2 px-4 text-white text-center">
          <span class="font-bold">{filter.traitCategoryLabel}:</span><span>{filter.traitLabel}</span><span
            class="hover:text-gray-500 hover:cursor-pointer"
            on:click={() => removeTrait(filter.traitCategoryId)}><Fa icon={faXmark} /></span
          ></span
        >
      {/each}
    {/if}
  </div>
{/if}

<div
  class="grid gap-5 mt-5 ml-5 mr-5 grid-flow-row-dense grid-cols-1 md:grid-cols-2 xl:grid-cols-3 grid-rows-2 md:grid-rows-1 mt-30"
>
  <Listings
    {collectionId}
    {hasValidRanks}
    {traitFilters}
    {showPlaceholderOnly}
    on:select={({ detail: nft }) => openModal(nft)}
    {loading}
  />

  <Trades
    {hasValidRanks}
    {showPlaceholderOnly}
    {collectionId}
    {traitFilters}
    on:select={({ detail: nft }) =>
      openModal({
        id: nft.nftId,
        collectionId: nft.collectionId,
        mediaUri: nft.mediaUri,
        name: nft.name,
        uri: nft.uri,
        rank: nft.rank,
      })}
    {loading}
  />
  <div class="col-span-1 md:col-span-2 xl:col-span-1">
    <TradeChart
      {collectionId}
      {hasValidRanks}
      {traitFilters}
      {loading}
      on:select={({ detail: nft }) =>
        openModal({
          id: nft.nftId,
          collectionId: nft.collectionId,
          mediaUri: nft.mediaUri,
          name: nft.name,
          uri: nft.uri,
          rank: nft.rank,
        })}
    />
    <ListingsBarChart {collectionId} {traitFilters} />
  </div>
  {#if $selectedNft}
    <NftModal
      bind:this={modal}
      {hasValidRanks}
      nft={$selectedNft}
      bind:open={$nftModalOpen}
      on:handlebtn1={closeModal}
    />
  {/if}
</div>
