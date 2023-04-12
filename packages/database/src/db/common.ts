import { TraitFilter } from '@labralords/common';

export const getTraitClauses = (traits: TraitFilter[]): string => {
  const clauses = traits
    .map((trait) => {
      const { traitId, traitCategoryId } = trait;
      return `exists (select * from nft_has_traits where nft_id = n.id and trait_id = '${traitId}' and trait_category_id = '${traitCategoryId}')`;
    })
    .join(` and `);
  return clauses;
};

export default {
  getTraitClauses,
};
