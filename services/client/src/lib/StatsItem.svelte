<script lang="ts">
  export let label: string;
  export let value: string;
  export let loaded: boolean = false;
</script>

<div class="p-5">
  <div class="flex flex-col justify-around h-full">
    <div class="text-sm dark:text-gray-400 uppercase text-center">{label}</div>
    {#if loaded}
      <div class="text-lg font-bold text-center">{value}</div>
    {:else}
      <div role="status" class="max-w-sm animate-pulse">
        <div class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-6 mt-2 mx-auto" />
        <span class="sr-only">Loading...</span>
      </div>
    {/if}
  </div>
</div>
