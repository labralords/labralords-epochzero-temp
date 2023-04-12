<script lang="ts">
  import { v4 as uuidV4 } from 'uuid';
  import { isMetamask } from '../util';
  import auth from '../services/auth';

  export let downloadUrl: string;
  export let exportButtonText: string;
  export let fileName: string;

  const exportButtonId = uuidV4();
  const downloadButtonId = uuidV4();

  const reset = () => {
    const exportButton = document.getElementById(exportButtonId);
    const downloadLink = document.getElementById(downloadButtonId);
    downloadLink.style.display = 'none';
    exportButton.style.display = 'block';
  };

  const exportData = async () => {
    try {
      const newAccessToken = await auth.silentlyAuthenticateUser();
      const exportButton = document.getElementById(exportButtonId);
      const downloadLink = document.getElementById(downloadButtonId);
      if (isMetamask) {
        downloadLink.setAttribute(
          'href',
          newAccessToken ? `${downloadUrl}&token=${encodeURIComponent(newAccessToken)}` : downloadUrl,
        );
        downloadLink.style.display = 'block';
        exportButton.style.display = 'none';
        return;
      }
      const response = await fetch(downloadUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'text/csv',
          Authorization: newAccessToken ? `Bearer ${newAccessToken}` : '',
        },
      });
      if (response.status >= 200 && response.status < 300) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        downloadLink.setAttribute('href', url);
        downloadLink.setAttribute(
          'download',
          response.headers?.get('content-disposition')?.split('filename=')?.[1] || fileName,
        );
        document.body.appendChild(downloadLink);
        downloadLink.click();
        URL.revokeObjectURL(url);
      } else {
        throw new Error(response.statusText);
      }
    } catch (err) {
      alert(`Failed to export transaction history: ${err.message}`);
    }
  };
</script>

<button
  id={exportButtonId}
  class="inline-flex justify-between gap-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
  on:click|stopPropagation={() => exportData()}>{exportButtonText}</button
>
<a
  href="#"
  id={downloadButtonId}
  style="display: none;"
  class="ml-4 inline-flex justify-between gap-2 text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
  on:click|stopPropagation={() => reset()}>Download CSV</a
>
