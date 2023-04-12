<script lang="ts">
  import EChart from './EChart.svelte';

  export let title: string = '';
  export let data: [number, number][] = [];

  $: option = {
    title: {
      text: title,
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
        symbolSize: 8,
        data,
        type: 'scatter',
      },
    ],
    tooltip: {
      trigger: 'item',
    },
    backgroundColor: 'transparent',
  };
</script>

<EChart id="trades" theme="dark" {option} height={400} />
