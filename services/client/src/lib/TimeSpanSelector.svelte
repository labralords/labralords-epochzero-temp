<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { availableTimeSpans } from '../util';
  const dispatch = createEventDispatcher();

  export let selectedTimeSpan = '1 month';
  export let timeSpans = availableTimeSpans;

  const commonStyle =
    'py-1 px-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white';
</script>

<nav aria-label="Time span selector">
  <ul class="inline-flex items-center">
    {#each timeSpans as timeSpan}
      <li>
        <a
          href="#"
          on:click={() => {
            selectedTimeSpan = timeSpan.value;
            dispatch('change', { value: timeSpan.value });
          }}
          class={`${commonStyle} ${selectedTimeSpan === timeSpan.value ? 'dark:bg-gray-700' : 'dark:bg-gray-800'}`}
          >{timeSpan.label}</a
        >
      </li>
    {/each}
  </ul>
</nav>
