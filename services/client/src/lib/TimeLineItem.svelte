<script lang="ts">
  export let title: string;
  export let description: string;
</script>

<li class="mb-10 ml-4">
  <div
    class="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -left-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"
  />
  <h3 class="text-lg font-normal text-gray-900 dark:text-white">{title}</h3>
  <p class="mb-4 text-base text-gray-500 dark:text-gray-400 font-thin">{description}</p>
</li>
