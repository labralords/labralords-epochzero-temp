<script lang="ts">
  import type { TradeData } from '@labralords/common';
  import { formatDistance } from 'date-fns';
  import LoadingImage from '../../lib/LoadingImage.svelte';
  import ImageLoader from '../../lib/ImageLoader.svelte';
  import SoonaverseIcon from '../../lib/SoonaverseIcon.svelte';
  import { formatAddress, getPrice } from '../../util';
  import LoadingVideo from '../../lib/LoadingVideo.svelte';

  export let hasValidRanks: boolean;
  export let showPlaceholderOnly: boolean;
  export let trade: TradeData;
  export let now = Date.now();
</script>

<li class="py-3 sm:py-4 list-none">
  <div class="flex items-center gap-2">
    <div class="flex-shrink-0 hover:cursor-pointer" on:click>
      {#if showPlaceholderOnly}
        <LoadingImage />
      {:else}
        <ImageLoader class="w-14 h-14 object-cover" src={trade.mediaUri} alt={trade.name}>
          <svelte:fragment slot="loading">
            <div role="status" class="shadow animate-pulse">
              <LoadingImage />
              <span class="sr-only">Loading...</span>
            </div>
          </svelte:fragment>
          <svelte:fragment slot="error">
            <div role="status">
              <LoadingImage />
              <span class="sr-only">Placeholder image</span>
            </div>
          </svelte:fragment>
          <svelte:fragment slot="video">
            <div role="status">
              <LoadingVideo />
              <span class="sr-only">Placeholder video</span>
            </div>
          </svelte:fragment>
        </ImageLoader>
      {/if}
    </div>
    <div class="w-10/12">
      <div class="flex items-center justify-between space-x-4">
        <div
          class="flex-1 min-w-0 hover:cursor-pointer hover:text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap"
          on:click
        >
          {trade.name}
        </div>
        <div class="inline-flex gap-2 items-center text-base  text-gray-900 dark:text-white font-normal">
          {getPrice(parseInt(trade.salePrice, 10), trade.network)}
          <a href={trade.uri} target="_blank">
            <SoonaverseIcon />
          </a>
        </div>
      </div>
      <div class="flex justify-between">
        {#if trade.sourcePreviousOwnerId}
          <a
            href={`https://soonaverse.com/member/${trade.sourcePreviousOwnerId}`}
            target="_blank"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            {formatAddress(trade.sourcePreviousOwnerId)}
          </a>
        {:else}
          <span class="text-gray-500 dark:text-gray-400">Mint</span>
        {/if}
        <span class="text-gray-500 dark:text-gray-400"> → </span>
        <a
          href={`https://soonaverse.com/member/${trade.sourceMemberId}`}
          target="_blank"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          {formatAddress(trade.sourceMemberId)}
        </a>
      </div>

      <div class="flex items-end space-x-4 justify-between">
        <div class="flex-shrink-0 text-gray-400 text-sm">
          {#if hasValidRanks}
            {#if trade?.rank}
              Rank #{trade?.rank}
            {:else}
              Rank not available
            {/if}
          {:else}
            Unranked
          {/if}
        </div>
        <div class="flex-shrink-0 text-gray-400 italic text-sm">
          {formatDistance(new Date(parseInt(trade.timestamp, 10)), now, { addSuffix: true })}
        </div>
      </div>
    </div>
  </div>
</li>
