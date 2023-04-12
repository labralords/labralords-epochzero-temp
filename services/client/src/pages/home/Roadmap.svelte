<script lang="ts">
  import TimelineItem from '../../lib/TimeLineItem.svelte';
  import Timeline from '../../lib/Timeline.svelte';

  let timelineItems = [
    {
      title: 'Alpha release',
      description:
        'We want everyone to be able to test our product. So we are going to release a public Alpha version that everyone can use. When beta launches our product will only be available to the NFT holders.',
    },
    {
      title: 'NFT collection reveal',
      description:
        'Holding a NFT from our Labralords NFT collection gives you lifetime access to our NFT insights tool and early access through the upcoming beta. Holding also gives you voting power on what will get into our backlog. There will potentially be more benefits in the future.',
    },
    {
      title: 'Beta release',
      description:
        "A couple of iterations later... After some time tuning our Alpha version, we'll launch our Beta version that will restrict access to our product to our NFT holders only. This will have more tasty functionality than our previous Alpha version.",
    },
    {
      title: 'The big f****** release',
      description:
        'Our first offical production-ready release. A product packed with neat functionality and fine-tuned for production. Holders of Labralords NFT will have full access.',
    },
  ];
</script>

<Timeline>
  {#each timelineItems as timelineItem}
    <TimelineItem title={timelineItem.title} description={timelineItem.description} />
  {/each}
</Timeline>
