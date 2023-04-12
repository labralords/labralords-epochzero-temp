export interface OpenseaCollection {
  editors: string[];
  payment_tokens: {
    id: number;
    symbol: string;
    address: string;
    image_url: string;
    name: string;
    decimals: number;
    eth_price: number;
    usd_price: number;
  }[];
  primary_asset_contracts: {
    address: string;
    asset_contract_type: string;
    created_date: string;
    name: string;
    nft_version: string;
    opensea_version: string;
    owner: number;
    schema_name: string;
    symbol: string;
    total_supply: string;
    description: string;
    external_link: string;
    image_url: string;
    default_to_fiat: boolean;
    dev_buyer_fee_basis_points: number;
    dev_seller_fee_basis_points: number;
    only_proxied_transfers: boolean;
    opensea_buyer_fee_basis_points: number;
    opensea_seller_fee_basis_points: number;
    buyer_fee_basis_points: number;
    seller_fee_basis_points: number;
    payout_address: string;
  }[];
  traits: Record<string, Record<string, number>>;
  stats: {
    one_day_volume: number;
    one_day_change: number;
    one_day_sales: number;
    one_day_average_price: number;
    one_day_difference: number;
    seven_day_volume: number;
    seven_day_change: number;
    seven_day_sales: number;
    seven_day_average_price: number;
    seven_day_difference: number;
    thirty_day_volume: number;
    thirty_day_change: number;
    thirty_day_sales: number;
    thirty_day_average_price: number;
    thirty_day_difference: number;
    total_volume: number;
    total_sales: number;
    total_supply: number;
    count: number;
    num_owners: number;
    average_price: number;
    num_reports: number;
    market_cap: number;
    floor_price: number;
  };
  banner_image_url: string;
  chat_url: string;
  created_date: string;
  default_to_fiat: boolean;
  description: string;
  dev_buyer_fee_basis_points: string;
  dev_seller_fee_basis_points: string;
  discord_url: string;
  display_data: { card_display_style: 'contain'; images: [] };
  external_url: string;
  featured: boolean;
  featured_image_url: string;
  hidden: boolean;
  safelist_request_status: 'not_requested';
  image_url: string;
  is_subject_to_whitelist: boolean;
  large_image_url: string;
  medium_username: string;
  name: string;
  only_proxied_transfers: boolean;
  opensea_buyer_fee_basis_points: string;
  opensea_seller_fee_basis_points: string;
  payout_address: string;
  require_email: boolean;
  short_description: string;
  slug: string;
  telegram_url: string;
  twitter_username: string;
  instagram_username: string;
  wiki_url: string;
  is_nsfw: boolean;
  fees: {
    seller_fees: Record<string, number>;
    opensea_fees: Record<string, number>;
  };
  is_rarity_enabled: boolean;
}

export interface OpenseaAsset {
  id: number;
  num_sales: number;
  background_color: string;
  image_url: string;
  image_preview_url: string;
  image_thumbnail_url: string;
  image_original_url: string;
  animation_url: string;
  animation_original_url: string;
  name: string;
  description: string;
  external_link: string;
  asset_contract: {
    address: string;
    asset_contract_type: string;
    created_date: string;
    name: string;
    nft_version: string;
    opensea_version: string;
    owner: string;
    schema_name: string;
    symbol: string;
    total_supply: number;
    description: string;
    external_link: string;
    image_url: string;
    default_to_fiat: boolean;
    dev_buyer_fee_basis_points: number;
    dev_seller_fee_basis_points: number;
    only_proxied_transfers: boolean;
    opensea_buyer_fee_basis_points: number;
    opensea_seller_fee_basis_points: number;
    buyer_fee_basis_points: number;
    seller_fee_basis_points: number;
    payout_address: string;
  };
  permalink: string;
  collection: OpenseaCollection;
  decimals: number;
  token_metadata: string;
  is_nsfw: boolean;
  owner: {
    user: number;
    profile_img_url: string;
    address: string;
    config: string;
  };
  seaport_sell_orders: null;
  creator: {
    user: number;
    profile_img_url: string;
    address: string;
    config: string;
  };
  traits: {
    trait_type: string;
    value: string;
    display_type: null;
    max_value: null;
    trait_count: 6039;
    order: null;
  }[];
  last_sale: {
    asset: {
      decimals: number;
      token_id: string;
    };
    asset_bundle: null;
    event_type: string;
    event_timestamp: string;
    auction_type: null;
    total_price: string;
    payment_token: {
      symbol: string;
      address: string;
      image_url: string;
      name: string;
      decimals: string;
      eth_price: string;
      usd_price: string;
    };
    transaction: {
      block_hash: string;
      block_number: string;
      from_account: {
        user: {
          username: string;
        };
        profile_img_url: string;
        address: string;
        config: string;
      };
      id: number;
      timestamp: string;
      to_account: {
        user: number;
        profile_img_url: string;
        address: string;
        config: string;
      };
      transaction_hash: string;
      transaction_index: string;
    };
    created_date: string;
    quantity: string;
  };
  top_bid: string;
  listing_date: string;
  is_presale: boolean;
  transfer_fee: null;
  transfer_fee_payment_token: null;
  supports_wyvern: boolean;
  rarity_data: null;
  related_assets: [];
  orders: null;
  auctions: [];
  top_ownerships: [
    {
      owner: {
        user: number;
        profile_img_url: string;
        address: string;
        config: string;
      };
      quantity: string;
      created_date: string;
    },
  ];
  ownership: null;
  highest_buyer_commitment: null;
  token_id: string;
}

// export interface OpenseaAssetEvent {
//   id: number;
//   token_id: string;
//   num_sales: number;
//   background_color: string;
//   image_url: string;
//   image_preview_url: string;
//   image_thumbnail_url: string;
//   image_original_url: string;
//   animation_url: string;
//   animation_original_url: string;
//   name: string;
//   description: string;
//   external_link: string;
//   asset_contract: {
//     address: string;
//     asset_contract_type: string;
//     created_date: string;
//     name: string;
//     nft_version: string;
//     opensea_version: string;
//     owner: number;
//     schema_name: string;
//     symbol: string;
//     total_supply: string;
//     description: string;
//     external_link: string;
//     image_url: string;
//     default_to_fiat: boolean;
//     dev_buyer_fee_basis_points: string;
//     dev_seller_fee_basis_points: string;
//     only_proxied_transfers: boolean;
//     opensea_buyer_fee_basis_points: string;
//     opensea_seller_fee_basis_points: string;
//     buyer_fee_basis_points: string;
//     seller_fee_basis_points: string;
//     payout_address: string;
//     display_data: {
//       card_display_style: string;
//     };
//     traits: {
//       trait_type: string;
//       value: string;
//       display_type: string;
//       max_value: number;
//       trait_count: number;
//       order: number;
//     }[];
//   };
// }

export interface OpenseaAssetEvent {
  id: number;
}

export interface OpenseaListing {
  id: number;
}

export interface OpenseaCollectionsResponse {
  collections: OpenseaCollection[];
}

export interface OpenseaAssetsResponse {
  assets: OpenseaAsset[];
}

export interface OpenseaListingsResponse {
  listings: OpenseaListing[];
}

export interface OpenseaEventsResponse {
  events: OpenseaAssetEvent[];
}
