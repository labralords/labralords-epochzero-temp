import { NftDatabaseEntry } from '@labralords/database';
import _ from 'lodash';

export interface TraitEvaluation {
  hasMoreTraitsThanCategories: boolean;
  hasCategories: boolean;
  hasTraits: boolean;
  hasOnlyNumbers: boolean;
  hasHoreThanHalfNumbers: boolean;
  hasMetadataCategories: boolean;
  allNftsHasTraits: boolean;
}

export const removeSpecialCharacters = (string: string): string => {
  return string?.replace(/[^\dA-Za-z]/g, '');
};

export const evaluateTraitProperties = (
  nfts: NftDatabaseEntry[],
  fieldName: 'raw_traits' | 'raw_stats',
): TraitEvaluation => {
  const traitsByNft = nfts.map((nft) =>
    Object.entries(nft?.[fieldName] || {})
      .filter(([_traitCategory, trait]) => !!trait?.value)
      .map(([traitCategory, trait]) => ({
        traitCategory,
        trait:
          typeof trait?.value === 'string' ? removeSpecialCharacters(trait.value) : (trait?.value as any)?.toString(),
      })),
  );
  const traits = traitsByNft.flat();
  const traitNames = traits.map((trait) => trait.trait);
  const traitCategoryNames = traits.map((trait) => trait.traitCategory?.trim()?.toLowerCase());
  const uniqueTraitNames = _.uniq(traitNames);
  const uniqueTraitCategoryNames = _.uniq(traitCategoryNames);
  return {
    hasMoreTraitsThanCategories: uniqueTraitNames.length > uniqueTraitCategoryNames.length,
    hasCategories: uniqueTraitCategoryNames.length > 0,
    hasTraits: uniqueTraitNames.length > 0,
    hasOnlyNumbers: uniqueTraitNames.every((trait) => /^\d+$/.test(trait)),
    hasHoreThanHalfNumbers:
      // eslint-disable-next-line unicorn/no-array-reduce
      uniqueTraitNames.reduce((sum, trait) => (/\d+/.test(trait) ? sum + 1 : sum), 0) > uniqueTraitNames.length / 2,
    hasMetadataCategories:
      _.intersection(uniqueTraitCategoryNames, [
        'collection',
        'edition',
        'description',
        'copyright',
        'author',
        'artist',
        'website',
      ]).length > 0,
    allNftsHasTraits: traitsByNft.map((nft) => nft.length > 0).every(Boolean),
  };
};

export const containsValidTraits = (evaluation: TraitEvaluation): boolean => {
  const {
    hasMoreTraitsThanCategories,
    hasCategories,
    hasTraits,
    hasOnlyNumbers,
    hasMetadataCategories,
    allNftsHasTraits,
  } = evaluation;
  return (
    hasMoreTraitsThanCategories &&
    hasCategories &&
    hasTraits &&
    !hasOnlyNumbers &&
    !hasMetadataCategories &&
    allNftsHasTraits
  );
};

export const getTraitsFieldName = (nfts: NftDatabaseEntry[]): 'raw_traits' | 'raw_stats' => {
  const propertiesEvaluation = evaluateTraitProperties(nfts, 'raw_traits');

  if (containsValidTraits(propertiesEvaluation)) {
    return 'raw_traits';
  }
  const statsEvaluation = evaluateTraitProperties(nfts, 'raw_stats');
  if (containsValidTraits(statsEvaluation) && !statsEvaluation.hasHoreThanHalfNumbers) {
    return 'raw_stats';
  }
  return null;
};
