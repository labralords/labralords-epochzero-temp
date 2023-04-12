<script lang="ts">
  import Fa from 'svelte-fa';
  import { faTwitter } from '@fortawesome/free-brands-svg-icons';
  // import { faTwitter, faDiscord } from '@fortawesome/free-brands-svg-icons';
  import SoonaverseIcon from '../../lib/SoonaverseIcon.svelte';
  import WarningNotice from '../../lib/WarningNotice.svelte';

  export let name: string;
  export let twitterUsername: string = null;
  export let discordUsername: string = null;
  export let soonaverseUri: string;
  export let hasValidRanks: boolean = false;
  export let allNotMinted: boolean = false;
</script>

<div class="mx-5 mt-10 mb-10">
  {#if name}
    <h1 class="text-3xl font-thin text-left overflow-hidden text-ellipsis whitespace-nowrap">{name}</h1>
    <div class="flex gap-2 items-center">
      {#if twitterUsername}
        <a href={`https://twitter.com/${twitterUsername}`} target="_blank">
          <Fa icon={faTwitter} />
        </a>
      {/if}
      <!-- {#if discordUsername}
        <a href={`https://discord.com/users/${discordUsername}`} target="_blank">
          <Fa icon={faDiscord} />
        </a>
      {/if} -->
      <a href={soonaverseUri} target="_blank">
        <SoonaverseIcon />
      </a>
    </div>
    {#if hasValidRanks && allNotMinted}
      <WarningNotice
        title="Do not trust rankings"
        message="Collection is not finished minting. Ranks will probably change."
      />
    {:else}
      <WarningNotice title="Do not trust rankings" message="None of the collections has verified ranks yet" />
    {/if}
  {:else}
    <div role="status" class="max-w-sm animate-pulse">
      <div class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4" />
      <div class="flex items-center w-full space-x-2 max-w-[480px]">
        <div class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-6" />
        <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-6" />
        <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-6" />
      </div>
      <span class="sr-only">Loading...</span>
    </div>
  {/if}
</div>
