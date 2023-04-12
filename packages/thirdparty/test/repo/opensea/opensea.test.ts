import got from 'got';
import { OpenseaRepository } from '../../../src/repo/opensea';
import { openseaCollectionExample } from './responses';

jest.mock('got');

describe('Opensea Repository', () => {
  test('should fetch collections', async () => {
    const mockedGot = jest.mocked(got);
    mockedGot.mockReturnValue({
      body: { collections: [openseaCollectionExample] },
    } as any);
    const opensea = new OpenseaRepository({ requestTimeout: 1000 });
    const collections = await opensea.fetchCollectionsPage({ limit: 1, name: 'opensea' });
    expect(collections).toEqual([
      {
        source: 'opensea',
        source_collection_id: 'doodles-official',
        available_from: '2021-10-17T13:00:47.419945',
        name: 'Doodles',
        description:
          'A community-driven collectibles project featuring art by Burnt Toast. Doodles come in a joyful range of colors, traits and sizes with a collection size of 10,000. Each Doodle allows its owner to vote for experiences and activations paid for by the Doodles Community Treasury.',
        has_valid_ranks: false,
        included_in_trial: false,
        nft_count: 10_000,
        nfts_minted: 10_000,
        royalties_fee: 5,
        mint_price: null,
        created_at: '2021-10-17T13:00:47.419945',
        updated_at: '2021-10-17T13:00:47.419945',
      },
    ]);
  });

  test('should fetch nfts', async () => {
    const mockedGot = jest.mocked(got);
    mockedGot.mockReturnValue({
      body: { collections: [openseaCollectionExample] },
    } as any);
    const opensea = new OpenseaRepository({ requestTimeout: 1000 });
    const collections = await opensea.fetchNftsPage({ limit: 1, name: 'opensea' }, {});
    expect(collections).toEqual([
      {
        source: 'opensea',
        source_collection_id: 'doodles-official',
        available_from: '2021-10-17T13:00:47.419945',
        name: 'Doodles',
        description:
          'A community-driven collectibles project featuring art by Burnt Toast. Doodles come in a joyful range of colors, traits and sizes with a collection size of 10,000. Each Doodle allows its owner to vote for experiences and activations paid for by the Doodles Community Treasury.',
        has_valid_ranks: false,
        included_in_trial: false,
        nft_count: 10_000,
        nfts_minted: 10_000,
        royalties_fee: 5,
        mint_price: null,
        created_at: '2021-10-17T13:00:47.419945',
        updated_at: '2021-10-17T13:00:47.419945',
      },
    ]);
  });
});

export {}; // To make it work with isolated modules: REMOVE after adding imports
