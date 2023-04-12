<script>
  import Fa from 'svelte-fa';

  import SoonaverseIcon from './SoonaverseIcon.svelte';
  import { faDiscord, faTwitter } from '@fortawesome/free-brands-svg-icons';
</script>

<section class="p-10">
  <hr class="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
  <div class="block sm:flex sm:items-center sm:justify-between">
    <div class="text-center text-sm text-gray-500 sm:text-left dark:text-gray-400 font-thin">
      © 2022 <a href="https://labralords.com/" class="hover:underline">Labralords.</a> All Rights Reserved.
    </div>
    <div class="flex mt-4 space-x-6 justify-center sm:justify-right sm:mt-0 items-center">
      <a
        href="https://discord.gg/d38RcsnDTM"
        target="_blank"
        class="text-gray-500 hover:text-gray-900 dark:hover:text-white"
      >
        <Fa icon={faDiscord} />
        <span class="sr-only">Discord</span>
      </a>
      <a
        href="https://twitter.com/labralords"
        target="_blank"
        class="text-gray-500 hover:text-gray-900 dark:hover:text-white"
      >
        <Fa icon={faTwitter} />
        <span class="sr-only">Twitter page</span>
      </a>
      <a
        href="https://soonaverse.com/space/0xe59e578c515b303d16e33476466553664954bb48/overview"
        target="_blank"
        class="text-gray-500 hover:text-gray-900 dark:hover:text-white"
      >
        <SoonaverseIcon />
        <span class="sr-only">Soonaverse collection</span>
      </a>
    </div>
  </div>
</section>
