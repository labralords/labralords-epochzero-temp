<script lang="ts">
  import type { NftData, NftTraitDataExtended } from '@labralords/common';
  import { createEventDispatcher } from 'svelte';

  import { Modal } from 'flowbite-svelte';
  import SoonaverseIcon from './SoonaverseIcon.svelte';
  import ImageLoader from './ImageLoader.svelte';
  import LoadingImage from './LoadingImage.svelte';
  import { query, type ReadableQuery } from 'svelte-apollo';
  import { GET_TRAITS_FOR_NFT } from '../queries';
  import { Link } from 'svelte-navigator';

  export let hasValidRanks: boolean;
  export let nft: Pick<NftData, 'name' | 'id' | 'collectionId' | 'mediaUri' | 'uri' | 'rank'>;

  export let open = false;

  let sortedTraits: NftTraitDataExtended[] = [];
  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

  const queryResult = query(GET_TRAITS_FOR_NFT, {
    variables: {
      nftId: nft.id,
      collectionId: nft.collectionId,
    },
  }) as ReadableQuery<{
    traitsForNft: NftTraitDataExtended[];
  }>;

  const refetch = () => {
    queryResult.refetch({ nftId: nft.id });
  };

  $: {
    const traits = $queryResult?.data?.traitsForNft || [];
    sortedTraits = traits.concat([]).sort((a, b) => collator.compare(a.traitCategoryLabel, b.traitCategoryLabel));
  }
  $: nft.id, refetch();

  const dispatch = createEventDispatcher();
</script>

<Modal bind:open title={nft.name}>
  <div class="grid grid-cols-1 md:grid-cols-2">
    <div class="m-2">
      {#if hasValidRanks}
        {#if nft?.rank}
          Rank #{nft?.rank}
        {:else}
          Rank not available
        {/if}
      {/if}
      <ImageLoader supportVideoFormats={true} src={nft.mediaUri} alt={nft.name}>
        <svelte:fragment slot="loading">
          <div role="status" class="shadow animate-pulse">
            <LoadingImage className="w-full h-64 dark:bg-gray-600" />
            <span class="sr-only">Loading...</span>
          </div>
        </svelte:fragment>
        <svelte:fragment slot="error">
          <div role="status" class="mx-auto">
            <LoadingImage className="w-full h-64 dark:bg-gray-600" />
            <span class="sr-only">Placeholder image</span>
          </div>
        </svelte:fragment>
      </ImageLoader>
      <div class="mt-5 text-center">
        <a
          href={nft.uri}
          target="_blank"
          class="inline-flex justify-between gap-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >Soonaverse <SoonaverseIcon /></a
        >
        {#if !location.href.includes(`/collections/${nft.collectionId}`)}
          <Link
            to={`/collections/${nft.collectionId}`}
            class="inline-flex justify-between gap-2 text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-500 dark:focus:ring-gray-800"
            >Collection</Link
          >
        {/if}
      </div>
    </div>
    <div class="m-2">
      <h2>Traits</h2>
      {#each sortedTraits as trait}
        <div class="w-full max-w-xs text-gray-900 bg-white rounded-lg shadow dark:bg-gray-800 dark:text-gray-300 mb-1">
          <div class="flex items-center justify-between p-2">
            <div class="text-sm font-normal">
              <div class="text-sm font-semibold text-gray-900 dark:text-white">{trait.traitCategoryLabel}</div>
              <div class="text-sm font-normal">{trait.traitLabel}</div>
            </div>
            <div>
              <span class="text-xs font-medium text-blue-600 dark:text-blue-500">{trait?.percentage?.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      {:else}
        <p class="text-xs mt-4">No traits available. Contact us, we may need to verify your collection.</p>
      {/each}
    </div>
  </div>
  <slot name="footer">
    <div class="text-left">
      <button
        on:click={() => dispatch('handlebtn1')}
        type="button"
        class="text-white bg-yellow-700 hover:bg-yellow-800 focus:ring-4 focus:ring-yellow-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-yellow-600 dark:hover:bg-yellow-700 dark:focus:ring-yellow-800"
        >Close</button
      >
    </div>
  </slot>
</Modal>
