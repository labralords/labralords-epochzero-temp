<script lang="ts">
  import { Toast } from 'flowbite-svelte';
  import { onMount } from 'svelte';
  import type { Notification } from '../services/notifications';
  import CheckIcon from './icons/CheckIcon.svelte';
  import ErrorIcon from './icons/ErrorIcon.svelte';
  import InformationIcon from './icons/InformationIcon.svelte';
  import WarningIcon from './icons/WarningIcon.svelte';

  export let notification: Notification;

  const getColor = (t: 'success' | 'error' | 'info' | 'warning') => {
    switch (t) {
      case 'success':
        return 'green';
      case 'error':
        return 'red';
      case 'info':
        return 'blue';
      case 'warning':
        return 'yellow';
    }
  };

  const color = getColor(notification.type);
  let show = true;

  onMount(() => {
    if (notification.timeout) {
      setTimeout(() => {
        show = false;
      }, notification.timeout);
    }
  });
</script>

<Toast {color} position="tr" class="z-20" bind:open={show}>
  <svelte:fragment slot="icon">
    {#if notification.type === 'success'}
      <CheckIcon />
    {:else if notification.type === 'error'}
      <ErrorIcon />
    {:else if notification.type === 'info'}
      <InformationIcon />
    {:else if notification.type === 'warning'}
      <WarningIcon />
    {/if}
  </svelte:fragment>
  <p>{notification.message}</p>
  {#if notification.link}
    <a href={notification.link.href} target={notification.link.target} class="text-gray-200 underline"
      >{notification.link.text}</a
    >
  {/if}
</Toast>
