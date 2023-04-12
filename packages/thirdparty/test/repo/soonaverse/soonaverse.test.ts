/* eslint-disable @typescript-eslint/no-empty-function */
import { SoonaverseRepository } from '../../../src/repo/soonaverse';
import {
  soonaverseCollectionExample,
  soonaverseListingExample,
  soonaverseNftExample,
  soonaverseTransactionExample,
} from './responses';

jest.mock('../../../src/repo/soonaverseQueryHelpers', () => ({
  getCollections: jest.fn(() => {
    return [soonaverseCollectionExample];
  }),
  getNfts: jest.fn(() => {
    return [soonaverseNftExample];
  }),
  getListings: jest.fn(() => {
    return [soonaverseListingExample];
  }),
  getTrades: jest.fn(() => {
    return [soonaverseTransactionExample];
  }),
}));

describe('Soonaverse Repository', () => {
  test('should fetch collections', async () => {
    const soonaverse = new SoonaverseRepository({ requestTimeout: 1000 });
    const { cursor, items } = await soonaverse.fetchCollectionsPage({ limit: 1, name: 'soonaverse' });
    expect(cursor.ref).toBe('2022-02-25T02:09:42.538Z');
    expect(items).toEqual([
      {
        name: 'Soonanaut NFT (NF3)',
        description:
          "The Soonanaut NFT is a part of the SoonLabs Soonaverse NF3 OG Set. Owners benefit from an array of features infused into the NFT: Membership to the Soonaverse Hub, airdrops, category-specific (Soonanauts, Artifacts, and Aliens) airdrops, “members only” offers, future Soonaverse platform capabilities such as editing features, digital twins, sets, builders, staking and P2E compatibility. All membership rights and features transfer with the sale/ownership of the NFT…AND, if you purchase 1 NFT from each category the designs “interlock” into a unique image. We call it the NF3. NF3 owners receive 2x bonuses on airdrops, VIP Access to special edition NF3 only sales events, and free access to Soonaverse Services Team. If 4 of your NFTs' attributes match (Fauna, Water, Planets, and Backgrounds) your NF3 goes ULTRA giving you 5x bonuses on airdrops. If ALL of your NFTs' attributes match then your NF3 goes MEGA ULTRA and you get 50x bonuses on airdrops!!! There are only 10 of those in existence, so happy hunting!",
        source: 'soonaverse',
        source_collection_id: '0xcbe28532602d67eec7c937c0037509d426f38223',
        has_valid_ranks: false,
        included_in_trial: false,
        show_placeholder_only: false,
        nfts_minted: 5000,
        nft_count: 5000,
        available_from: '2022-03-01T18:00:31.889Z',
        mint_price: 200_000_000,
        royalties_fee: 0.05,
        twitter_username: 'soon_labs',
        discord_username: null,
        created_at: '2022-02-25T00:09:42.000Z',
        updated_at: '2022-02-25T02:09:42.538Z',
      },
    ]);
  });

  test('should fetch nfts', async () => {
    const uuid = '4981fd9d-e7a7-403a-bc1f-371689f60be2';
    const soonaverse = new SoonaverseRepository({ requestTimeout: 1000 });
    const { cursor, items } = await soonaverse.fetchNftsPage({ limit: 1, name: 'soonaverse' });
    expect(cursor.ref).toBe('2022-05-15T19:13:30.611Z');
    expect(items).toEqual([
      {
        collection_id: uuid,
        created_at: '2022-05-15T19:13:30.611Z',
        current_price: null,
        is_auctioned: false,
        is_listed: false,
        listed_at: null,
        media_source: 'bafybeibbzhftslj26mdyfp2grek5bhfcut2ajy4aakv4ad5cigvcdnrnvu',
        media_url:
          'https://firebasestorage.googleapis.com/v0/b/soonaverse.appspot.com/o/0x69278e7ea657216937b139f070449bf000cbd835%2Ffxbxfh6tzq%2Fnft_media?alt=media&token=8c86feda-c95a-42e8-8e30-47467184d933',
        name: 'Runbot #372',
        owner_address: '0x3ffb94c3ef42b9bc085cfecee3af7208a1953373',
        owner_type: 'user',
        rank: null,
        source: 'soonaverse',
        source_nft_id: '0x00005b4bd47c7289fce2353a83cfc589710b1ed3',
        updated_at: '2022-05-15T19:13:30.611Z',
      },
    ]);
  });
  test('should handle when collection_id cannot be found from source_collection_id', async () => {});

  // test('should fetch listings', async () => {
  //   const uuid = '4981fd9d-e7a7-403a-bc1f-371689f60be2';
  //   const soonaverse = new SoonaverseRepository({ requestTimeout: 1000 });
  //   const { cursor, items } = await soonaverse.fetchListingsPage(
  //     { limit: 1 },
  //     // { [soonaverseListingExample.collection]: uuid },
  //   );
  //   expect(cursor.ref).toBe('2022-05-15T19:13:30.611Z');
  //   expect(items).toEqual([
  //     {
  //       collection_id: uuid,
  //       created_at: '2022-05-15T19:13:30.611Z',
  //       current_price: '1000000',
  //       is_auctioned: false,
  //       is_listed: true,
  //       listed_at: '2022-05-15T19:13:30.611Z',
  //       media_source: 'bafybeibbzhftslj26mdyfp2grek5bhfcut2ajy4aakv4ad5cigvcdnrnvu',
  //       media_url:
  //         'https://firebasestorage.googleapis.com/v0/b/soonaverse.appspot.com/o/0x69278e7ea657216937b139f070449bf000cbd835%2Ffxbxfh6tzq%2Fnft_media?alt=media&token=8c86feda-c95a-42e8-8e30-47467184d933',
  //       name: 'Runbot #372',
  //       owner_address: '0x3ffb94c3ef42b9bc085cfecee3af7208a1953373',
  //       owner_type: 'user',
  //       rank: null,
  //       source: 'soonaverse',
  //       source_nft_id: '0x00005b4bd47c7289fce2353a83cfc589710b1ed3',
  //       updated_at: '2022-05-15T19:13:30.611Z',
  //     },
  //   ]);
  // });
  test('should handle when collection_id cannot be found from source_collection_id', async () => {});

  test('should fetch trades', async () => {
    // const nftId = '6de7528d-240f-45b5-bdd9-0c3599806a51';
    // const collectionId = '4981fd9d-e7a7-403a-bc1f-371689f60be2';
    const soonaverse = new SoonaverseRepository({ requestTimeout: 1000 });
    const { cursor, items } = await soonaverse.fetchTradesPage(
      { limit: 1, name: 'soonaverse' },
      // { '0x6fc9c051af6352c75e26a1ed71953de2e0b16fb8': { id: nftId, collectionId } },
    );
    expect(cursor.ref).toBe('2022-06-11T08:11:43.642Z');
    expect(items).toEqual([
      {
        nft_id: '6de7528d-240f-45b5-bdd9-0c3599806a51',
        collection_id: '4981fd9d-e7a7-403a-bc1f-371689f60be2',
        buyer_address: 'iota1qzjvr39kzrtglt5taewxp4z9n3mtaxgsjf326y58j2jpm463dqzz65rtujs',
        seller_address: 'iota1qrwx0ln3ye24jvmkhllgf5q4v47mz3lunyr3r57kalmhxzfu4cg2qsnfzjn',
        sale_price: '10000000',
        source_member_id: '0x2bd31af41200e6113a6f95847825cf45d71f0bf3',
        timestamp: '2022-06-11T08:11:43.642Z',
      },
    ]);
  });

  test('should handle when collection_id and nft_id cannot be found', async () => {});
});
