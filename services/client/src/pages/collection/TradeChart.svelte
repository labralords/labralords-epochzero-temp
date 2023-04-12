<script lang="ts">
  import type { TradeData, TraitFilter } from '@labralords/common';
  import { formatDistance } from 'date-fns';
  import { createEventDispatcher } from 'svelte';
  import { query, type ReadableQuery } from 'svelte-apollo';

  import { isAuthenticated, selectedNetwork } from '../../store';
  import LoadingChart from '../../lib/LoadingChart.svelte';
  import EChart from '../../lib/EChart.svelte';
  import { availableTimeSpans, getPrice, getQueryStrings, setQueryStrings } from '../../util';
  import { GET_TRADE_GRAPH_DATA } from '../../queries';
  import { Dropdown, DropdownItem, Tooltip } from 'flowbite-svelte';
  import Fa from 'svelte-fa';
  import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

  export let hasValidRanks: boolean;
  export let loading: boolean = true;
  export let collectionId: string;
  export let searchQuery: string = '';
  export let traitFilters: TraitFilter[] = [];

  const dispatch = createEventDispatcher();
  const queryStrings = getQueryStrings();

  const timeSpans = availableTimeSpans;
  let show1MiTrades = false;

  let timeSpan: { value: string; label: string } =
    timeSpans.find((t) => t.value === queryStrings?.timeSpan) || timeSpans[2];
  let option: any;
  const now = Date.now();

  const queryResult = query(GET_TRADE_GRAPH_DATA, {
    variables: {
      collectionId,
      timeSpan: timeSpan?.value,
      searchQuery,
      traitFilters,
      network: $selectedNetwork,
      show1MiTrades,
    },
  }) as ReadableQuery<{
    tradeGraphData: TradeData[];
  }>;

  $: $selectedNetwork, $isAuthenticated, traitFilters.length, refetch();
  $: trades = $queryResult?.data?.tradeGraphData || [];

  const handleOnClick = (e: any) => {
    const tradeItemIndex = e?.detail?.dataIndex;
    const currentTrade = trades?.[tradeItemIndex];
    dispatch('select', currentTrade);
  };

  const refetch = () => {
    queryResult.refetch({
      collectionId,
      timeSpan: timeSpan?.value,
      searchQuery,
      traitFilters,
      network: $selectedNetwork,
      show1MiTrades,
    });
  };

  $: {
    option = {
      grid: {
        left: '15%',
        bottom: '10%',
        right: '20%',
        top: '10%',
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        boundaryGap: false,
      },
      series: [
        {
          symbolSize: 6,
          data: trades?.map((d) => [parseInt(d?.timestamp, 10), parseInt(d?.salePrice, 10) / 1000000]),
          type: 'scatter',
          tooltip: {
            formatter: (params) => {
              const tradeItemIndex = params?.dataIndex;
              const currentTrade = trades?.[tradeItemIndex];

              const rank = currentTrade?.rank;

              const rankMessage = hasValidRanks ? (rank ? `Rank #${rank}` : 'Rank not available') : 'Unranked';

              return `<img class="w-24" src="${
                currentTrade.mediaUri
              }"/><div class="flex flex-col"><div>${rankMessage}</div><div>${getPrice(
                parseInt(currentTrade?.salePrice, 10),
                currentTrade?.network,
              )}</div><div>${formatDistance(new Date(parseInt(currentTrade.timestamp, 10)), now, {
                addSuffix: true,
              })}</div></div>`;
            },
          },
        },
      ],
      tooltip: {
        trigger: 'item',
      },
      backgroundColor: 'transparent',
    };
  }
</script>

<div class="flex justify-between ml-5 mr-12">
  <div class="flex gap-4 items-center">
    <h2 class="font-thin uppercase text-lg">Trades</h2>
    {#if $selectedNetwork === 'iota'}
      <Tooltip content={show1MiTrades ? 'Hide 1Mi trades' : 'Show 1Mi trades'}>
        <a
          href="#"
          on:click|preventDefault={(e) => {
            show1MiTrades = !show1MiTrades;
            refetch();
          }}
        >
          <Fa icon={show1MiTrades ? faEye : faEyeSlash} class="text-gray-400 hover:text-gray-50 hover:cursor-pointer" />
        </a>
      </Tooltip>
    {/if}
  </div>
  <div class="flex gap-2 items-center">
    <span class="place-self-center">Span:</span>
    <Dropdown label={timeSpan?.label} inline={true} class="z-10">
      {#each timeSpans as t}
        <DropdownItem
          on:click={() => {
            timeSpan = t;
            setQueryStrings({ timeSpan: t.value });
            refetch();
          }}
        >
          {t?.label}
        </DropdownItem>
      {/each}
    </Dropdown>
  </div>
</div>

{#if loading}
  <LoadingChart />
{:else if trades.length > 0}
  <div class="mb-10">
    <EChart id="trades" theme="dark" {option} on:click={handleOnClick} />
  </div>
{:else}
  <div class="flex flex-col items-center justify-center h-64">
    <div class="text-gray-400 dark:text-gray-600 ">No trade data available</div>
  </div>
{/if}
