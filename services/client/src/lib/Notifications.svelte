<script lang="ts">
  import type { NotificationData } from '@labralords/common';
  import { GET_NOTIFICATIONS } from '../queries';
  import { query, type ReadableQuery } from 'svelte-apollo';
  import { isAuthenticated } from '../store';
  import { formatDistance } from 'date-fns';

  import { formatAddress, getPrice } from '../util';

  let limit = 5;
  let offset = 0;

  const queryResult = query(GET_NOTIFICATIONS, {
    variables: {
      limit,
      offset,
    },
  }) as ReadableQuery<{
    notifications: NotificationData[];
    notificationCount: {
      total: number;
    };
  }>;

  const refetch = () => {
    queryResult.refetch({
      limit,
      offset,
    });
  };

  export let notifications: NotificationData[] = [];

  $: $isAuthenticated, refetch();
  $: if ($queryResult.data) {
    notifications = $queryResult.data.notifications;
  }

  export let notificationCount: number = 0;

  $: if ($queryResult.data) {
    notificationCount = $queryResult.data.notificationCount.total;
  }

  let showNotifications = false;

  const toggleNotificationsDropdown = () => {
    showNotifications = !showNotifications;
  };

  const now = new Date();
  const dropDownClass =
    'z-10 w-full max-w-sm bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-800 dark:divide-gray-700';
</script>

{#if $isAuthenticated}
  <div style="position:relative; display:flex;">
    <button
      id="dropdownNotificationButton"
      data-dropdown-toggle="dropdownNotification"
      class="inline-flex items-center text-sm font-medium text-center text-gray-500 hover:text-gray-900 focus:outline-none dark:hover:text-white dark:text-gray-400"
      type="button"
      on:click={() => toggleNotificationsDropdown()}
    >
      <svg class="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"
        ><path
          d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"
        /></svg
      >
      {#if notificationCount > 0}
        <div class="flex relative">
          <div
            class="inline-flex relative -top-2 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"
          />
        </div>
      {/if}
    </button>

    <!-- Dropdown menu -->
    <div
      id="dropdownNotification"
      class={showNotifications ? dropDownClass : `hidden ${dropDownClass}`}
      aria-labelledby="dropdownNotificationButton"
      style="position: absolute; width: 300px;right: -140px; top:34px;"
    >
      <div class="block py-2 px-4 font-medium text-center text-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white">
        Notifications
      </div>
      <div class="divide-y divide-gray-100 dark:divide-gray-700">
        {#if notifications.length > 0}
          {#each notifications as notification}
            <a href="#" class="flex py-3 px-4 hover:bg-gray-100 dark:hover:bg-gray-700">
              <div class="flex-shrink-0">
                <img
                  class="w-11 h-11 rounded-full"
                  src={notification?.context?.media_url}
                  alt={notification?.context?.name}
                />
              </div>
              <div class="pl-3 w-full">
                <div class="text-gray-500 text-sm mb-1.5 dark:text-gray-400">
                  <span class="font-semibold text-gray-900 dark:text-white">{notification?.context?.name}</span> sold to
                  <span class="font-normal text-gray-900 dark:text-white"
                    >{notification?.context?.sold_to_username ||
                      formatAddress(notification?.context?.sold_to_address)}</span
                  >
                  for {getPrice(notification?.context?.sale_price, notification?.context?.network)}
                </div>
                <div class="text-xs text-blue-600 dark:text-blue-500">
                  {notification?.createdAt &&
                    formatDistance(new Date(Number.parseInt(notification?.createdAt)), now, {
                      addSuffix: true,
                    })}
                </div>
              </div>
            </a>
          {/each}
        {:else}
          <div class="py-3 px-4 text-center text-gray-500 dark:text-gray-400">No notifications</div>
        {/if}
      </div>
      {#if notificationCount > limit}
        <a
          href="#"
          class="block py-2 text-sm font-medium text-center text-gray-900 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white"
        >
          <div class="inline-flex items-center ">
            <svg
              class="mr-2 w-4 h-4 text-gray-500 dark:text-gray-400"
              aria-hidden="true"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
              ><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path
                fill-rule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clip-rule="evenodd"
              /></svg
            >
            Show more
          </div>
        </a>
      {/if}
    </div>
  </div>
{/if}
