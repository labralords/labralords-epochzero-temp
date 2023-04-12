-- INSERT INTO public.user_data (id, "eth_address", "iota_address") VALUES 
--   ('d7378e2b-b3be-48e0-901d-7ae74944bb6d', '0x9Ec33D533Ee4dFC4cB1B182a537A271c8c189eC8', 'iota1qrw93e6mpj8s4uxg5rxecs44uw07rc2r0awegvc9k9zdxk38rx9vs7wu9r9'),
--   ('31c1467b-1929-429c-81ce-0cee246d5ad1', '0x712405661EcF1A044b5a804803Bcb3238319C317', 'iota1qzedfjw5tzrk74kvf04cfhjkf5m3379d3v77g2xkc4um94c9qvsnqjp33kv')
-- ;

-- INSERT INTO public.sales (id, "nft_id", "timestamp", "sale_price", "seller_address", "buyer_address") VALUES 
--   ('14661457-83d3-4c38-a38e-66ebec0bb8b9', 'eab00de2-1070-4ffe-80d8-547e87269f07', NOW() - interval '2 minutes', 2000000, '0xC5F8c6dBd922f5379b2D3Ce9e08B6b87cF22ca4b', '0x9Ec33D533Ee4dFC4cB1B182a537A271c8c189eC8'),
--   ('ef5030b6-a0bd-4c44-b821-6f73a9888e3b', 'c264191e-be0d-4211-a825-0ca5f64d6f92', NOW() - interval '4 minutes', 1200000, '0xAD286C06a330e8D316A3345FD2A009F3F27d297F', '0x712405661EcF1A044b5a804803Bcb3238319C317')
-- ;

-- COPY collections (id, name, description, source, source_collection_id, has_valid_ranks, included_in_trial, nfts_minted, nft_count, mint_price, royalties_fee, available_from, twitter_username, discord_username, created_at, updated_at) FROM '/collection-data.csv' WITH DELIMITER ',' CSV HEADER;

-- COPY nfts (id, collection_id, name, source_nft_id, source, media_source, is_listed, is_auctioned, current_price, owner_address, owner_type, listed_at, created_at, updated_at) FROM '/nft-data.csv' WITH DELIMITER ',' CSV HEADER;

-- COPY listings (id, collection_id, nft_id, timestamp, is_auctioned, list_price, owner_address) FROM '/listing-data.csv' WITH DELIMITER ',' CSV HEADER;

-- COPY trait_categories (id, trait_category, trait_category_label) FROM '/trait-category-data.csv' WITH DELIMITER ',' CSV HEADER;

-- COPY traits (id, trait, trait_label) FROM '/trait-data.csv' WITH DELIMITER ',' CSV HEADER;

-- COPY nft_has_traits (id, collection_id, nft_id, trait_id, trait_category_id) FROM '/nft-has-trait-data.csv' WITH DELIMITER ',' CSV HEADER;
