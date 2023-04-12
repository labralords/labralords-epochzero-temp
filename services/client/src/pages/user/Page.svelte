<script lang="ts">
  import _ from 'lodash';
  import { Card } from 'flowbite-svelte';

  import NftModal from '../../lib/NftModal.svelte';
  import { getPrice } from '../../util';
  import { PUBLIC_API_URL } from '../../constants';
  import type { Order } from '../../contracts';
  import type { NftData, TradeData, TraitFilter } from '@labralords/common';
  import { query, type ReadableQuery } from 'svelte-apollo';
  import { GET_MEMBER_PORTIFOLIO } from '../../queries';
  import { writable } from 'svelte/store';
  import { onDestroy, onMount, type SvelteComponent } from 'svelte';
  import ExportCsvData from '../../lib/ExportCsvData.svelte';

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const baseUrl = PUBLIC_API_URL;

  let offset = 0;
  let limit = 25;
  let searchQuery: string = '';
  let sortBy: string = 'listed_at';
  let sortOrder: Order = 'desc';
  let traitFilters: TraitFilter[] = [];

  const queryResult = query(GET_MEMBER_PORTIFOLIO, {
    variables: {
      offset,
      limit,
      searchQuery,
      sortBy,
      sortOrder,
      traitFilters,
    },
  }) as ReadableQuery<{
    memberPortfolio: NftData[];
  }>;

  $: nfts = $queryResult?.data?.memberPortfolio || [];

  let nftModalOpen = writable(false);
  let modal: SvelteComponent;

  const closeModal = () => {
    modal.closeModal();
    nftModalOpen.set(false);
  };

  const selectedNft = writable<Pick<NftData, 'name' | 'id' | 'collectionId' | 'mediaUri' | 'uri' | 'rank'> | null>(
    null,
  );

  const openModal = ({ id, ...nft }: Pick<TradeData, 'name' | 'id' | 'collectionId' | 'mediaUri' | 'uri' | 'rank'>) => {
    nftModalOpen.set(true);
    selectedNft.set({ id, ...nft });
  };

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
            },
            updateQuery: (prev, { fetchMoreResult }) => {
              if (!fetchMoreResult) {
                return prev;
              }
              if (fetchMoreResult.memberPortfolio.length < limit) {
                hasMore = false;
              }
              return {
                memberPortfolio: [...prev.memberPortfolio, ...fetchMoreResult.memberPortfolio],
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

<div class="flex justify-center mt-12 gap-2">
  <ExportCsvData
    downloadUrl={`${baseUrl}/member/transactions?timezone=${timezone}`}
    exportButtonText="Export transaction history"
    fileName="transaction-history.csv"
  />
  <ExportCsvData
    downloadUrl={`${baseUrl}/member/nfts?timezone=${timezone}`}
    exportButtonText="Export portfolio"
    fileName="user-portfolio.csv"
  />
</div>

{#if nfts?.length > 0}
  <div
    class="grid gap-5 pt-24 pb-5 ml-5 mr-5 grid-flow-row-dense grid-cols-1 md:grid-cols-3 xl:grid-cols-5 grid-rows-2 md:grid-rows-1"
  >
    {#each nfts as nft}
      <Card img={nft.mediaUri} size="xs" class="m-5 mx-auto">
        <h5
          on:click={() => openModal(nft)}
          class="text-xl font-bold tracking-tight text-gray-900 dark:text-white dark:hover:text-gray-400 hover:cursor-pointer"
        >
          {nft.name}
        </h5>
        <div class="mb-2">
          {#if nft?.hasValidRanks}
            {#if nft?.rank}
              Rank #{nft?.rank}
            {:else}
              Rank not available
            {/if}
          {:else}
            Unranked
          {/if}
        </div>
        <div class="flex justify-between items-center">
          <div class="flex flex-col">
            <span class="text-md font-bold text-gray-900 dark:text-white">Listing</span>
            <span class="text-sm text-gray-500 dark:text-gray-400"
              >{nft.currentPrice ? getPrice(parseInt(nft.currentPrice, 10), nft.network) : 'Not listed'}</span
            >
          </div>
          <div class="flex flex-col">
            <span class="text-md font-bold text-gray-900 dark:text-white">Floor</span>
            <span class="text-sm text-gray-500 dark:text-gray-400"
              >{getPrice(parseInt(nft.floorPrice, 10), nft.network)}</span
            >
          </div>
        </div>
      </Card>
    {/each}
  </div>
{:else}
  <div class="text-center font-thin mt-32">No nfts found</div>
{/if}

{#if $selectedNft}
  <NftModal
    bind:this={modal}
    hasValidRanks={true}
    nft={$selectedNft}
    bind:open={$nftModalOpen}
    on:handlebtn1={closeModal}
  />
{/if}
