<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createEventDispatcher } from 'svelte';

  import * as echarts from 'echarts';

  export let id: string;
  export let theme: string | object;
  export let width = 200;
  export let height = 200;

  export let option: echarts.EChartsCoreOption;
  export let notMerge = false;
  export let lazyUpdate = false;

  const dispatch = createEventDispatcher();

  let chart: echarts.ECharts; // our chart instance

  const setOption = () => {
    if (chart && !chart.isDisposed()) {
      chart.setOption(option, notMerge, lazyUpdate);
    }
  };

  const destroyChart = () => {
    if (chart && !chart.isDisposed()) {
      chart.dispose();
      chart?.off('click');
    }
  };

  const makeChart = () => {
    destroyChart();
    chart = echarts.init(document.getElementById(id), theme);
    chart.on('click', (params) => {
      dispatch('click', params);
    });
  };

  onMount(() => {
    makeChart();
  });

  onDestroy(() => {
    destroyChart();
  });

  let timeoutId: any;
  const handleResize = () => {
    if (timeoutId == undefined) {
      timeoutId = setTimeout(() => {
        if (chart && !chart.isDisposed()) {
          chart.resize();
        }
        timeoutId = undefined;
      }, 500);
    }
  };

  $: width && handleResize();
  $: option && setOption();
  $: if (chart && theme) {
    makeChart();
    setOption();
  }
</script>

<div bind:clientWidth={width} class="dark:background-color">
  <div {id} class="w-full h-96" />
</div>
