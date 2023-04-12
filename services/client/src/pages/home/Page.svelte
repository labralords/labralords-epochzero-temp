<script>
  import Roadmap from './Roadmap.svelte';
  import Footer from '../../lib/Footer.svelte';
  import { AccordionFlush } from 'flowbite-svelte';
</script>

<svelte:head>
  <title>Labralords. | Welcome</title>
</svelte:head>

<div class="stars">
  <h1 class="hidden">hidden</h1>
  <div class="top-section" />
  <section class="md:w-1/2 mx-auto">
    <img class="welcome-image content-center mx-auto" alt="Labralord welcomes the visitor" src="/welcome.png" />
  </section>

  <section>
    <div class="mx-10 md:w-1/2 md:mx-auto">
      <p class="text-center my-32 text-lg font-thin">
        Labralords help you discover and analyze NFT markets on the IOTA tangle. The vision is to provide a tool that
        empowers you to make smarter NFT trades so you can sleep well at night.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-52">
        <div class="mb-10 md:mb-20 px-16 md:px-10">
          <img class="rounded-lg" alt="Discover NFTs on IOTA tangle" src="/discover.png" />
        </div>
        <div class="mb-10 md:mb-20">
          <h2 class="text-3xl font-thin mb-5">Discover.</h2>
          <p class="font-thin text-lg">
            Labralords let's you discover new and trending NFT collections. Be up to date on where you can do smart
            trades to boost your ROI.
          </p>
        </div>
        <div class="mb-10 md:mb-20 hidden md:block">
          <h2 class="text-3xl font-thin mb-5">Analyze.</h2>
          <p class="font-thin text-lg">
            Get live listing and trade data so you can act immediately on marked changes. How has the floor price
            developed over time? Labralords will give all you need to make smart decisions fast.
          </p>
        </div>
        <div class="mb-10 md:mb-20 px-16 md:px-10">
          <img class="rounded-lg" alt="Analyze NFTs on IOTA tangle" src="/analyse.png" />
        </div>
        <div class="mb-10 md:mb-20 md:hidden">
          <h2 class="text-3xl font-thin mb-5">Analyze.</h2>
          <p class="font-thin text-lg">
            Get live listing and trade data so you can act immediately on marked changes. How has the floor price
            developed over time? Labralords will give all you need to make smart decisions fast.
          </p>
        </div>
      </div>
    </div>
  </section>

  <section class="bg-gray-900 grid grid-cols-1 lg:grid-cols-2 space-image-bg pt-20">
    <div class="p-5 sm:pb-20 mx-auto">
      <h2 class="text-4xl mb-10 font-thin">NFT collection</h2>
      <p class="mb-3 italic font-thin">By holding one of our 10k unique Labralords NFTs you'll get:</p>
      <ul class="list-disc ml-5 mb-5">
        <li class="font-thin">Lifetime access to our NFT insights tool **</li>
        <li class="font-thin">Access to the upcoming Beta version</li>
        <li class="font-thin">Voting power on what to prioritize in our backlog</li>
        <li class="font-thin">More benefits to come +++</li>
      </ul>
      <p>
        The collection has a 7 % royalty fee. 5% goes to buying back NFTs off the floor, 2% goes back into the product.
        <b>Example:</b>
        <i>10Gi in royalties = 7.14Gi to buy and burn NFTs, and 2.86Gi back into the product</i>
      </p>
      <div class="text-center lg:text-left mt-20">
        <a
          href="https://soonaverse.com/collection/0x4254fba1c5e487b44f415072230f4148c6c03d1f"
          target="_blank"
          class="flex flex-col items-center text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-xl px-6 py-4 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
          >Mint on Soonaverse <span class="text-xs text-gray-200">Minting starts August 31, 2022, 15:00 UTC</span></a
        >
      </div>
    </div>
    <div class="p-5 mx-auto">
      <img alt="NFT collection preview" src="/nft-montage.png" class="object-contain h-full w-96" />
    </div>
    <div class="lg:col-span-2 text-sm text-right text-gray-400 mt-20 mx-2 mb-2 font-thin">
      ** as long as the product is in an operative state and that Labralords is able to continue the services
    </div>
  </section>
  <div class="background-overlay " style="background-color:rgba(0, 0, 0, 0.72);" />

  <section class="p-5 bg-gray-900">
    <div class="w-full md:w-1/2 mx-auto">
      <h2 class="text-4xl m-20 text-center font-thin">Roadmap</h2>
      <Roadmap />
    </div>
  </section>

  <section class="p-5">
    <div class="w-full md:w-1/2 mx-auto">
      <h2 class="text-4xl m-20 text-center font-thin">FAQ</h2>
      <AccordionFlush id="1">
        <h2 slot="header">How will we use the royalties?</h2>
        <div slot="body">
          <p class="mb-2 text-gray-500 dark:text-gray-400 font-thin">
            The Labralords NFT collection will have a 7% royalty. 5% goes to buying our NFTs off the floor and burning
            them, and 3% goes back into the product. We'll use the 5% royalties to buy NFTs from the floor and burn them
            as soon as that is possible.
          </p>
          <p class="mb-2 text-gray-500 dark:text-gray-400 font-thin">
            We had to abandon the previously proposed royalty payback system as that would classify our NFT as a
            security in some countries, which require the holder to have a license. We believe that this will be even
            more beneficial than the previously proposed system, as the floor price could increase for every NFT we
            burn.
          </p>
          <p class="mb-2 text-gray-500 dark:text-gray-400 font-thin">
            We will additionally open up for an paid subscription option as well, which will get into our final product.
            Estimated price for this will be 15 USD per month. A labralord holder will have access to the Beta and
            lifetime access to our final product.
          </p>
        </div>
      </AccordionFlush>
      <AccordionFlush id="2">
        <h2 slot="header">How will the voting system work?</h2>
        <div slot="body">
          <p class="mb-2 text-gray-500 dark:text-gray-400 font-thin">
            When we get the login system in place, we will create a suggestion page where the holders will be able to
            vote on what features they want to see in the Labralords tool. The more NFTs you hold, the more votes you
            will have. Holding one NFT gets you 1 vote. Holding 5 gives you 2x, 10 gives you 4x, 20 gives you 8x, more
            than 30 gives you 12x. Example: 20 NFTs * 8x boost = 160 votes.
          </p>
        </div>
      </AccordionFlush>
      <AccordionFlush id="2">
        <h2 slot="header">When is the Beta version released?</h2>
        <div slot="body">
          <p class="mb-2 text-gray-500 dark:text-gray-400 font-thin">
            The Beta version will get released when we have a proper login system in place. The development of the Beta
            will be done in an Agile way. The voting system will be the driver for what we will prioritize in our
            backlog, and features will get released as soon as they are ready.
          </p>
        </div>
      </AccordionFlush>
    </div>
  </section>

  <Footer />
</div>

<style>
  .space-image-bg {
    background-image: url('/space.png');
    background-color: rgba(0, 0, 0, 1);
    background-position: center center;
    background-repeat: no-repeat;
    background-size: cover;
  }

  .welcome-image {
    max-width: 100%;
    width: 400px;
  }

  .stars {
    background-image: url('/stars.png');
    background-color: rgba(0, 0, 0, 1);
    background-position: center top;
    background-repeat: no-repeat;
    background-size: auto;
  }

  .top-section {
    height: calc(100vh - 400px);
  }

  @media screen and (min-width: 800px) {
    .top-section {
      height: calc(100vh - 350px);
    }
  }
</style>
