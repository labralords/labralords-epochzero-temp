import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../../', '.env') });

/* eslint-disable import/first, import/order */
import { wait, toKebabCase, uppercaseEveryFirstLetter } from '@labralords/common';
import { getTraitsFieldName } from '@labralords/thirdparty';
import {
  CollectionTraitDBEntry,
  cursors,
  nft as nftDatabase,
  nftCollection,
  NftDatabaseEntry,
  NftHasTraitDatabaseEntry,
  ranks,
  traits as traitsDatabase,
} from '@labralords/database';
import Hapi from '@hapi/hapi';
import config from 'config';
import _ from 'lodash';
/* eslint-enable import/first, import/order */

const port = Number.parseInt(config.get('http.port'), 10);
const host: string = config.get('http.host');

const getRankData = (nfts: NftDatabaseEntry[]): Record<string, number> => {
  const selectedTraitsFieldName = getTraitsFieldName(nfts);
  const traitsFieldName = selectedTraitsFieldName || 'raw_traits';
  const traitData: { nftId: string; traitId: string; traitCategoryId: string }[] = [];
  const traitCountByIdMap: Record<string, number> = {};

  for (const nft of nfts) {
    for (const [traitCategory, traitRaw] of Object.entries(nft[traitsFieldName] || {})) {
      const traitCategoryIdentifier = toKebabCase(traitCategory?.toLowerCase());
      const trait = toKebabCase(traitRaw?.value?.trim()?.toLowerCase());
      if (!trait || !traitCategoryIdentifier) {
        // eslint-disable-next-line no-continue
        continue;
      }

      if (!traitCountByIdMap[`${trait}-${traitCategoryIdentifier}`]) {
        traitCountByIdMap[`${trait}-${traitCategoryIdentifier}`] = 1;
      } else {
        traitCountByIdMap[`${trait}-${traitCategoryIdentifier}`] += 1;
      }
      traitData.push({
        nftId: nft.id,
        traitId: trait,
        traitCategoryId: traitCategoryIdentifier,
      });
    }
  }

  const traitMap: Record<string, { traitId: string; traitCategoryId: string }[]> = {};
  for (const trait of traitData) {
    if (!traitMap[trait.nftId]) {
      traitMap[trait.nftId] = [];
    }
    traitMap[trait.nftId].push(trait);
  }

  return Object.fromEntries(
    Object.entries(traitMap)
      .map(([nftId, nftTraits]) => ({
        id: nftId,
        rarityScore: nftTraits.reduce(
          (accumulator, current) =>
            accumulator + 1 / (traitCountByIdMap[`${current.traitId}-${current.traitCategoryId}`] / nfts.length),
          0,
        ),
      }))
      .sort((a, b) => b.rarityScore - a.rarityScore)
      .map(({ id }, index) => [id, index + 1]),
  );
};

const scrape = async () => {
  try {
    const collections = await nftCollection.listNftCollections();
    for (const collection of collections) {
      const newCursorReference = new Date().toISOString();
      const cursor = await cursors.getCursor('metadata', collection.id);

      if (
        collection.collection_content_updated_at &&
        new Date(cursor?.ref).getTime() <= new Date(collection.collection_content_updated_at).getTime()
      ) {
        // eslint-disable-next-line no-continue
        continue;
      }

      console.log(`Update metadata for collection ${collection.id}`);
      const nfts = await nftDatabase.getNftsByCollectionId(collection.id);

      if (nfts.length === 0) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const traitMap: Record<string, { trait: string; trait_label: string }> = {};
      const traitCategoryMap: Record<string, { trait_category: string; trait_category_label: string }> = {};

      const selectedTraitsFieldName = getTraitsFieldName(nfts);
      const hasValidTraits = selectedTraitsFieldName !== null;
      const traitsFieldName = selectedTraitsFieldName || 'raw_traits';
      for (const nft of nfts) {
        for (const [traitCategory, traitRaw] of Object.entries(nft[traitsFieldName] || {})) {
          const traitCategoryIdentifier = traitCategory
            ?.trim()
            ?.toLowerCase()
            ?.replace(/[,.:;-]+$/, '');
          const trait = traitRaw?.value
            ?.trim()
            ?.toLowerCase()
            ?.replace(/[,.:;-]+$/, '');
          if (!traitMap[trait]) {
            traitMap[trait] = {
              trait: toKebabCase(trait),
              trait_label: uppercaseEveryFirstLetter(trait),
            };
          }
          if (!traitCategoryMap[traitCategoryIdentifier]) {
            traitCategoryMap[traitCategoryIdentifier] = {
              trait_category: toKebabCase(traitCategoryIdentifier),
              trait_category_label: uppercaseEveryFirstLetter(traitCategoryIdentifier),
            };
          }
        }
      }

      const { items: upsertedTraits } = await traitsDatabase.updateTraitBatch(
        _.uniqBy(
          Object.values(traitMap).filter((v) => !!v.trait && !!v.trait_label),
          'trait',
        ),
      );
      const { items: upsertedTraitCategories } = await traitsDatabase.updateTraitCategoryBatch(
        _.uniqBy(
          Object.values(traitCategoryMap).filter((v) => !!v.trait_category && !!v.trait_category_label),
          'trait_category',
        ),
      );

      const upsertedTraitsMap = Object.fromEntries(upsertedTraits.map((trait) => [trait.trait, trait]));
      const upsertedTraitCategoryMap = Object.fromEntries(
        upsertedTraitCategories.map((traitCategory) => [traitCategory.trait_category, traitCategory]),
      );
      const nftHasTraits: NftHasTraitDatabaseEntry[] = [];

      for (const nft of nfts) {
        for (const [traitCategory, traitRaw] of Object.entries(nft[traitsFieldName] || {})) {
          const traitCategoryIdentifier = toKebabCase(traitCategory?.toLowerCase());
          const trait = toKebabCase(traitRaw?.value?.trim()?.toLowerCase());
          if (!trait || !traitCategoryIdentifier) {
            // eslint-disable-next-line no-continue
            continue;
          }
          const traitUuid = upsertedTraitsMap[trait].id;
          const traitCategoryUuid = upsertedTraitCategoryMap[traitCategoryIdentifier].id;
          nftHasTraits.push({
            collection_id: collection.id,
            nft_id: nft.id,
            trait_id: traitUuid,
            trait_category_id: traitCategoryUuid,
          });
        }
      }

      const collectionTraits: Record<string, CollectionTraitDBEntry> = {};

      for (const { trait_category_id: traitCategoryId, trait_id: traitId } of nftHasTraits) {
        const key = `${traitCategoryId}-${traitId}`;
        if (!collectionTraits[key]) {
          collectionTraits[key] = {
            collection_id: collection.id,
            trait_category_id: traitCategoryId,
            trait_id: traitId,
            trait_count: 1,
            percentage: nfts?.length ? (1 / nfts.length) * 100 : 0,
          };
        } else {
          collectionTraits[key].trait_count += 1;
          collectionTraits[key].percentage = nfts?.length ? (collectionTraits[key].trait_count / nfts.length) * 100 : 0;
        }
      }

      await traitsDatabase.updateCollectionTraitsBatch(Object.values(collectionTraits));
      await traitsDatabase.updateNftHasTraitsBatch(nftHasTraits);
      await nftCollection.setHasValidTraits(collection.id, { hasValidTraits, traitsFieldName });

      if (collection.has_preset_ranks) {
        const ranksByName = await ranks.getRanksByName(collection.id);
        const updatedWithRanks = nfts.map((nft) => {
          return {
            ...nft,
            rank: ranksByName[nft.name]?.rank || null,
          };
        });
        await nftDatabase.updateNftRanksBatch(updatedWithRanks);
      } else {
        const rankBySourceId: Record<string, number> = getRankData(nfts);
        const updatedWithRanks = nfts.map((nft) => {
          return {
            ...nft,
            rank: rankBySourceId[nft.id] || null,
          };
        });
        await nftDatabase.updateNftRanksBatch(updatedWithRanks);
      }
      await cursors.updateCursor('metadata', collection.id, newCursorReference);
      await wait(500);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await wait(1000);
  }
};

const main = async () => {
  const app = Hapi.server({
    port,
    host,
    routes: {
      json: {
        space: 2,
      },
    },
  });
  app.route({
    method: 'GET',
    path: '/healthz',
    handler: () => 'OK',
  });
  await app.start();
  console.log('Server running on %s', app.info.uri);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await scrape();
    } catch (error) {
      console.error(`Failed to scrape: ${error}`);
    }
    await wait(1000);
  }
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
});
