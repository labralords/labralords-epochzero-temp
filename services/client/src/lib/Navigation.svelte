<script lang="ts">
  import MetaMaskIcon from './MetamaskIcon.svelte';
  import { createEventDispatcher } from 'svelte';
  import { Navbar, NavBrand, NavHamburger, NavLi, NavUl } from 'flowbite-svelte';
  import { useLocation, useNavigate } from 'svelte-navigator';
  import { Dropdown, DropdownItem, Toggle } from 'flowbite-svelte';
  import { writable } from 'svelte/store';
  import { isAuthenticated, selectedNetwork } from '../store';
  import Notifications from './Notifications.svelte';

  export let metamaskInstalled = false;

  const dispatch = createEventDispatcher();
  const navigate = useNavigate();
  const location = useLocation();

  const networks = {
    iota: 'IOTA',
    smr: 'Shimmer',
  };

  const networkDropdownOpen = writable(false);

  const setNetwork = (network: string) => {
    networkDropdownOpen.set(false);
    dispatch('network', network);
  };
</script>

<Navbar
  let:hidden
  let:toggle
  color="dark:bg-black"
  navClass="bg-white border-gray-200 px-2 sm:px-4 py-2.5 dark:bg-black"
>
  <NavBrand href="/" />
  <div class="flex md:order-2 items-center gap-2">
    <Notifications />
    <Dropdown bind:open={$networkDropdownOpen} class="z-10" inline={true} label={networks[$selectedNetwork]}>
      <DropdownItem on:click={() => setNetwork('smr')}>{networks['smr']}</DropdownItem>
      <DropdownItem on:click={() => setNetwork('iota')}>{networks['iota']}</DropdownItem>
    </Dropdown>
    <button
      on:click={() => dispatch('metamask-connect')}
      type="button"
      class="text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-1.5 text-center inline-flex items-center dark:focus:ring-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700 mx-2"
    >
      <MetaMaskIcon />
      <span>{metamaskInstalled ? ($isAuthenticated ? 'Disconnect' : 'Connect') : 'Install MetaMask'}</span>
    </button>
    <NavHamburger on:click={toggle} />
  </div>
  <NavUl {hidden} class="order-1">
    <NavLi
      href="#"
      on:click={(e) => {
        e.preventDefault();
        navigate('/');
      }}
      active={$location.pathname === '/'}>Home</NavLi
    >
    <NavLi
      href="#"
      on:click={(e) => {
        e.preventDefault();
        navigate('/collections');
      }}
      active={$location.pathname.startsWith('/collections')}>Collections</NavLi
    >
    <NavLi
      href="#"
      on:click={(e) => {
        e.preventDefault();
        navigate('/listings');
      }}
      active={$location.pathname.startsWith('/listings')}>Listings</NavLi
    >
    <NavLi
      href="#"
      on:click={(e) => {
        e.preventDefault();
        navigate('/trades');
      }}
      active={$location.pathname.startsWith('/trades')}>Trades</NavLi
    >
    {#if $isAuthenticated}
      <NavLi
        href="#"
        on:click={(e) => {
          e.preventDefault();
          navigate('/user');
        }}
        active={$location.pathname.startsWith('/user')}>User</NavLi
      >
    {/if}
    {#if $isAuthenticated}
      <NavLi
        href="#"
        on:click={(e) => {
          e.preventDefault();
          navigate('/my-collections');
        }}
        active={$location.pathname.startsWith('/my-collections')}>My collections</NavLi
      >
    {/if}
  </NavUl>
</Navbar>
