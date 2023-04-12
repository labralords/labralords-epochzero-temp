<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let total = 0;
  export let selectedPage = 0;
  export let itemsPerPage = 10;

  let lastPage = 0;
  let firstItem = 0;
  let lastItem = 0;
  const dispatch = createEventDispatcher();
  $: {
    lastPage = total / itemsPerPage - 1;
    firstItem = total ? selectedPage * itemsPerPage + 1 : 0;
    lastItem = Math.min(total, (selectedPage + 1) * itemsPerPage);
  }

  const buttonClasses =
    'py-2 px-4 text-sm font-medium text-white bg-gray-800 rounded-l hover:bg-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white';
</script>

<div class="flex flex-col items-center">
  <span class="text-sm text-gray-700 dark:text-gray-400">
    Showing <span class="font-semibold text-gray-900 dark:text-white">{firstItem}</span> to
    <span class="font-semibold text-gray-900 dark:text-white">{lastItem}</span>
    of <span class="font-semibold text-gray-900 dark:text-white">{total}</span> Entries
  </span>

  <div class="inline-flex mt-2 xs:mt-0">
    <button on:click={() => dispatch('page', Math.max(selectedPage - 1, 0))} class={`${buttonClasses} rounded-l`}>
      Prev
    </button>
    <button
      on:click={() => dispatch('page', Math.min(selectedPage + 1, Math.ceil(lastPage)))}
      class={`${buttonClasses} rounded-r border-0 border-l`}
    >
      Next
    </button>
  </div>
</div>
