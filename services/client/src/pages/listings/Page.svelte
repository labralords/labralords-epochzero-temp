<script lang="ts">
  import type { NftData } from '@labralords/common';
  import { writable } from 'svelte/store';
  import type { SvelteComponent } from 'svelte';
  import NftModal from '../../lib/NftModal.svelte';
  import Listings from './Listings.svelte';

  let minPrice: string = null;
  let maxPrice: string = null;
  let minRank: number = null;
  let maxRank: number = null;

  let nftModalOpen = writable(false);
  let modal: SvelteComponent;

  const closeModal = () => {
    modal.closeModal();
    nftModalOpen.set(false);
  };

  const selectedNft = writable<Pick<NftData, 'name' | 'id' | 'collectionId' | 'mediaUri' | 'uri' | 'rank'> | null>(
    null,
  );

  const openModal = (nft: Pick<NftData, 'name' | 'id' | 'collectionId' | 'mediaUri' | 'uri' | 'rank'>) => {
    nftModalOpen.set(true);
    selectedNft.set(nft);
  };
</script>

<Listings {maxPrice} {minPrice} {maxRank} {minRank} on:nft-select={({ detail: nft }) => openModal(nft)} />

{#if $selectedNft}
  <NftModal
    bind:this={modal}
    hasValidRanks={true}
    nft={$selectedNft}
    bind:open={$nftModalOpen}
    on:handlebtn1={closeModal}
  />
{/if}
