<script lang="ts">
  import type { NftCollectionData } from '@labralords/common';
  import { createEventDispatcher } from 'svelte';
  import { Modal } from 'flowbite-svelte';
  import ExportCsvData from './ExportCsvData.svelte';
  import { PUBLIC_API_URL } from '../constants';
  import auth from '../services/auth';
  import { addNotification } from '../services/notifications';

  const baseUrl = PUBLIC_API_URL;

  export let collection: NftCollectionData;
  export let open = false;

  const dispatch = createEventDispatcher();

  const rankApiUrl = `${baseUrl}/collections/${collection.id}/ranks`;

  let files;

  const uploadCsv = async () => {
    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      const newAccessToken = await auth.silentlyAuthenticateUser();
      const response = await fetch(rankApiUrl, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          Authorization: newAccessToken ? `Bearer ${newAccessToken}` : '',
        },
      });
      open = false;
      if (response.status === 200) {
        addNotification({
          type: 'success',
          message: 'Ranks updated successfully',
        });
      } else {
        addNotification({
          type: 'error',
          message: `Error updating ranks: ${response.statusText}`,
        });
      }
    } catch (err) {
      addNotification({
        type: 'error',
        message: `Failed to upload ranks: ${err.message}`,
      });
    }
  };
</script>

<Modal bind:open title="Update ranks">
  <div class="m-2">
    <p class="text-fsm font-normal text-center">
      Update collection ranks by downloading the CSV below, update the ranks in the CSV and upload it here.
    </p>
    <div class="flex justify-center my-6">
      <ExportCsvData downloadUrl={rankApiUrl} exportButtonText="Export rankings" fileName="collection-rankings.csv" />
    </div>
    <p class="text-fsm font-normal text-center">After updating the ranks in the CSV, upload it below.</p>
    <div class="flex justify-center my-6">
      <input
        class="block w-full text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
        bind:files
        type="file"
        accept="text/csv"
      />
    </div>
    <div class="flex justify-center my-6">
      <button
        class="inline-flex justify-between gap-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        on:click={() => uploadCsv()}
      >
        Update
      </button>
    </div>

    <slot name="footer">
      <div class="text-left">
        <button
          on:click={() => dispatch('handlebtn1')}
          type="button"
          class=" text-white bg-yellow-700 hover:bg-yellow-800 focus:ring-4 focus:ring-yellow-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-yellow-600 dark:hover:bg-yellow-700 dark:focus:ring-yellow-800"
          >Close</button
        >
      </div>
    </slot>
  </div></Modal
>
