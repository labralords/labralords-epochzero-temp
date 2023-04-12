<script lang="ts">
  import { getPrice, getPriceObject } from '../util';

  import EChart from './EChart.svelte';

  export let title: string = '';
  export let stacked: boolean = false;
  export let values: number[] = [];
  export let categories: number[] = [];
  export let selectedNetwork: string;

  let option: any = {};

  const getSeries = () => {
    const series: any[] = [
      {
        data: values,
        type: 'bar',
        itemStyle: { normal: { color: '#1b64f2' } },
        tooltip: {
          formatter: (params) => {
            const categoryIndex = params?.dataIndex;
            const currentCategory = categories?.[categoryIndex];
            const value = params?.data;
            if (categoryIndex === 0) {
              return `<b>< ${getPrice(currentCategory, selectedNetwork)}:</b> ${value}`;
            }
            if (categoryIndex === categories.length - 1) {
              return `<b>> ${getPrice(currentCategory, selectedNetwork)}:</b> ${value}`;
            }
            const previousCategory = categories[categoryIndex - 1];
            const p = getPriceObject(currentCategory, selectedNetwork);
            const upperBound = p.value ? `${p.value - 0.1}${p.unit}` : 'N/A';
            return `<b>${getPrice(previousCategory, selectedNetwork)} - ${upperBound}:</b> ${value}`;
          },
        },
      },
    ];

    if (stacked) {
      (series[0] as any).stack = 'stack';
      let total = 0;
      series.unshift({
        data: values.map((_v, i) => {
          total = total + (values[i - 1] || 0);
          return total;
        }),
        type: 'bar',
        stack: 'stack',
        itemStyle: { normal: { color: '#1f2937' } },
        tooltip: {
          formatter: (params) => {
            const categoryIndex = params?.dataIndex;
            const currentCategory = categories?.[categoryIndex - 1];
            const value = params?.data;
            return `<b>< ${getPrice(currentCategory, selectedNetwork)}:</b> ${value}`;
          },
        },
      });
    }
    return series;
  };

  $: stacked,
    values,
    (option = {
      title: {
        text: title,
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          formatter: function (currentValue: number, i: number) {
            if (i === 0) {
              return `< ${getPrice(currentValue, selectedNetwork)}`;
            }
            if (i === categories?.length - 1) {
              return `> ${getPrice(currentValue, selectedNetwork)}`;
            }
            return getPrice(currentValue, selectedNetwork);
          },
        },
      },
      yAxis: {
        type: 'value',
      },
      series: getSeries(),
      tooltip: {
        trigger: 'item',
      },
      backgroundColor: 'transparent',
    });
</script>

<EChart id="floor-price" theme="dark" {option} height={400} notMerge={true} />
