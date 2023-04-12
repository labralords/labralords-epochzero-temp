<script lang="ts">
  import { Button, Checkbox, Input } from 'flowbite-svelte';
  import { createEventDispatcher } from 'svelte';
  import { miota } from '../util';

  const dispatch = createEventDispatcher();

  export let minPrice: string;
  export let maxPrice: string;
  export let minRank: number;
  export let maxRank: number;
  export let searchQuery: string;
  export let networkOnly: boolean;

  const onPriceChange = (e: FocusEvent | KeyboardEvent, name: string) => {
    const target = e.target as HTMLInputElement;
    if (name === 'minPrice') {
      const p = parseInt(target.value, 10) * miota;
      minPrice = p ? p.toString(10) : null;
    } else {
      const p = parseInt(target.value, 10) * miota;
      maxPrice = p ? p.toString(10) : null;
    }
    if ((e as KeyboardEvent).key !== 'Enter') {
      return;
    }
    dispatch('changed');
  };

  const onRankChange = (e: FocusEvent | KeyboardEvent, name: string) => {
    const target = e.target as HTMLInputElement;
    if (name === 'minRank') {
      minRank = parseInt(target.value, 10);
    } else {
      maxRank = parseInt(target.value, 10);
    }
    if ((e as KeyboardEvent).key !== 'Enter') {
      return;
    }
    dispatch('changed');
  };

  const onSearchChange = (e: FocusEvent | KeyboardEvent) => {
    const target = e.target as HTMLInputElement;
    searchQuery = target?.value?.trim();
    if ((e as KeyboardEvent).key !== 'Enter') {
      return;
    }
    dispatch('changed');
  };
</script>

<div class="mt-16">
  <div class="flex justify-center">
    <Input
      type="text"
      size="sm"
      placeholder="Search name"
      class="w-64"
      on:blur={(e) => onSearchChange(e)}
      on:keypress={(e) => onSearchChange(e)}
    />
    <Checkbox
      class="ml-4"
      label="Network only"
      bind:checked={networkOnly}
      on:click={() => {
        networkOnly = !networkOnly;
        dispatch('changed');
      }}>Network only</Checkbox
    >
  </div>
  <div class="flex gap-4 justify-center mt-2">
    <div>
      <Input
        type="number"
        size="sm"
        placeholder="Min price"
        on:blur={(e) => onPriceChange(e, 'minPrice')}
        on:keypress={(e) => onPriceChange(e, 'minPrice')}
      />
    </div>
    <div>
      <Input
        type="number"
        size="sm"
        placeholder="Max price"
        on:blur={(e) => onPriceChange(e, 'maxPrice')}
        on:keypress={(e) => onPriceChange(e, 'maxPrice')}
      />
    </div>
    <div>
      <Input
        type="number"
        size="sm"
        placeholder="Min rank"
        on:blur={(e) => onRankChange(e, 'minRank')}
        on:keypress={(e) => onRankChange(e, 'minRank')}
      />
    </div>
    <div>
      <Input
        type="number"
        size="sm"
        placeholder="Max rank"
        on:blur={(e) => onRankChange(e, 'maxRank')}
        on:keypress={(e) => onRankChange(e, 'maxRank')}
      />
    </div>
    <Button size="sm" on:click={() => dispatch('changed')}>Go</Button>
  </div>
</div>
