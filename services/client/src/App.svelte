<script lang="ts">
  import { Router, Route } from 'svelte-navigator';
  import { faWalkieTalkie } from '@fortawesome/free-solid-svg-icons';
  import { init, getLocaleFromNavigator } from 'svelte-i18n';
  import Fa from 'svelte-fa';
  import _ from 'lodash';

  import Home from './pages/home/Page.svelte';
  import Collections from './pages/collections/Page.svelte';
  import Collection from './pages/collection/Page.svelte';
  import MyCollections from './pages/myCollections/Page.svelte';
  import User from './pages/user/Page.svelte';
  import Listings from './pages/listings/Page.svelte';
  import Trades from './pages/trades/Page.svelte';
  import Navigation from './lib/Navigation.svelte';
  import { isMetaMaskInstalled } from './util';
  import auth from './services/auth';
  import initGraphqlClient from './services/graphql';
  import { isAuthenticated, notifications, selectedNetwork } from './store';
  import Notification from './lib/Notification.svelte';
  import { removeNotification } from './services/notifications';

  // register('en', () => import('./en.json'));
  // register('en-US', () => import('./en-US.json'));
  // register('pt', () => import('./pt.json'));
  // en, en-US and pt are not available yet

  init({
    fallbackLocale: 'en',
    initialLocale: getLocaleFromNavigator(),
  });

  initGraphqlClient();

  const feedbackUrl = 'https://forms.gle/4Lv6iRRkyTJCT8h97';

  let nonceFailure = false;
  let failure = false;
  let connectClicked = false;
  let alreadyPending = false;

  const disconnect = async () => {
    await auth.logout();
  };

  const onConnectMetamask = async () => {
    connectClicked = true;
    failure = false;
    nonceFailure = false;
    alreadyPending = false;
    if (isMetaMaskInstalled()) {
      if ($isAuthenticated) {
        disconnect();
      } else {
        await auth.login();
      }
    } else {
      window.open('https://metamask.io/', '_blank');
    }
  };

  const onNetworkChange = (network: CustomEvent<string>) => {
    selectedNetwork.set(network.detail);
    localStorage.setItem('network', network.detail);
  };
</script>

{#each $notifications as notification}
  <Notification
    {notification}
    on:dismiss={() => {
      removeNotification(notification.id);
    }}
  />
{/each}

<main class="h-full min-h-full">
  <Router>
    <header>
      <Navigation
        metamaskInstalled={isMetaMaskInstalled()}
        on:metamask-connect={onConnectMetamask}
        on:network={onNetworkChange}
      />
    </header>
    <main class="h-full min-h-full">
      <Route path="/">
        <Home />
      </Route>

      <Route path="collections">
        <Collections />
      </Route>
      <Route path="listings">
        <Listings />
      </Route>
      <Route path="trades">
        <Trades />
      </Route>
      <Route path="collections/:id" let:params>
        <Collection collectionId={params.id} />
      </Route>
      <Route path="user">
        {#if $isAuthenticated}
          <User />
        {:else}
          <div class="text-center mt-24 font-thin">
            <h1 class="text-4xl mb-6">Restricted</h1>
            Please connect using your wallet. You need to hold a Labralord NFT to unlock the full potential of this app.
          </div>
        {/if}
      </Route>
      <Route path="my-collections">
        {#if $isAuthenticated}
          <MyCollections />
        {:else}
          <div class="text-center mt-24 font-thin">
            <h1 class="text-4xl mb-6">Restricted</h1>
            Please connect using your wallet. You need to hold a Labralord NFT to unlock the full potential of this app.
          </div>
        {/if}
      </Route>

      <a
        href={feedbackUrl}
        target="_blank"
        class="fixed flex bg-gray-700 bottom-0 right-0 p-4 rounded-full h-4 w-4 m-2 hover:bg-gray-600 hover:cursor-pointer items-center justify-center"
      >
        <Fa icon={faWalkieTalkie} />
      </a>
    </main>
  </Router>
</main>

<style>
</style>
