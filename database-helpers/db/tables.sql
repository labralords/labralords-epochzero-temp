-- CREATE DATABASE labralords;
-- CREATE USER "labralords-api" WITH ENCRYPTED PASSWORD '<password>';

CREATE EXTENSION IF NOT EXISTS "timescaledb" CASCADE;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

SET timezone TO 'UTC';

-- User data
CREATE TABLE IF NOT EXISTS users (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "source" text NOT NULL DEFAULT 'soonaverse',
  "eth_address" text NOT NULL,
  "iota_address" text DEFAULT NULL,
  "smr_address" text DEFAULT NULL,
  "username" text DEFAULT NULL,
  "about" text DEFAULT NULL,
  "twitter" text DEFAULT NULL,
  "discord" text DEFAULT NULL,
  "github" text DEFAULT NULL,
  "access" BOOLEAN NOT NULL DEFAULT FALSE,
  "nonce" UUID NOT NULL DEFAULT uuid_generate_v4(),
  PRIMARY KEY ("id"),
  UNIQUE(eth_address)
);

-- User tokens
CREATE TABLE IF NOT EXISTS tokens (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "token" text NOT NULL,
  "family" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "browser_info" jsonb NOT NULL,
  PRIMARY KEY ("id"),
  UNIQUE(token),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Collections
CREATE TABLE IF NOT EXISTS collections (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "name" text NOT NULL,
  "description" text NOT NULL,
  "source_collection_id" text NOT NULL,
  "source" text NOT NULL DEFAULT 'soonaverse',
  "network" text NOT NULL,
  "included_in_trial" BOOLEAN DEFAULT FALSE,
  "has_valid_ranks" BOOLEAN DEFAULT FALSE,
  "has_custom_ranks" BOOLEAN DEFAULT FALSE,
  "has_preset_ranks" BOOLEAN DEFAULT FALSE,
  "traits_field_name" text NOT NULL DEFAULT 'properties',
  "show_placeholder_only" BOOLEAN DEFAULT FALSE,
  "nfts_minted" INTEGER NOT NULL,
  "nft_count" INTEGER NOT NULL,
  "mint_price" BIGINT,
  "royalties_fee" REAL NOT NULL DEFAULT 0.0,
  "available_from" timestamp with time zone NOT NULL,
  "twitter_username" text,
  "discord_username" text,
  "owner_address" text,
  "rejected" BOOLEAN NOT NULL DEFAULT FALSE,
  "collection_content_updated_at" timestamp with time zone DEFAULT NOW(),
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL,
  PRIMARY KEY ("id"),
  UNIQUE("source", "source_collection_id")
);

CREATE TABLE IF NOT EXISTS cursors (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "service" text NOT NULL,
  "type" text NOT NULL,
  "ref" text,
  PRIMARY KEY ("id"),
  UNIQUE("service", "type")
);

CREATE TABLE IF NOT EXISTS collection_fetch_queue (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "collection_id" UUID NOT NULL REFERENCES collections(id),
  "type" text NOT NULL,
  "fetched_at" timestamp with time zone,
  "locked_at" timestamp with time zone,
  locked BOOLEAN DEFAULT FALSE,
  PRIMARY KEY ("id"),
  UNIQUE("collection_id", "type")
);

-- NFTs
CREATE TABLE IF NOT EXISTS nfts (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "collection_id" UUID NOT NULL REFERENCES collections(id),
  "name" text NOT NULL,
  "source_nft_id" text NOT NULL,
  "source" text NOT NULL DEFAULT 'soonaverse',
  "media_source" text,
  "media_url" text NOT NULL DEFAULT '',
  "is_listed" boolean NOT NULL DEFAULT FALSE,
  "is_auctioned" boolean NOT NULL DEFAULT FALSE,
  "network" text NOT NULL,
  "current_price" bigint,
  "owner_address" text NOT NULL,
  "owner_type" text NOT NULL,
  "rank" integer,
  "listed_at" timestamp with time zone,
  "missing_metadata" boolean NOT NULL DEFAULT FALSE,
  "raw_traits" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "raw_stats" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL,
  PRIMARY KEY ("id"),
  UNIQUE("source", "source_nft_id")
);

CREATE INDEX idx_nfts_collection_id ON nfts (collection_id);
CREATE INDEX idx_nfts_owner_address ON nfts (owner_address);
CREATE INDEX idx_nfts_is_auctioned ON nfts (is_auctioned);
CREATE INDEX idx_nfts_current_price ON nfts (current_price);

-- Listings
CREATE TABLE IF NOT EXISTS listings (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "collection_id" UUID NOT NULL REFERENCES collections(id),
  "nft_id" UUID NOT NULL REFERENCES nfts(id),
  "timestamp" timestamp with time zone NOT NULL,
  "list_price" bigint NOT NULL,
  "is_auctioned" boolean NOT NULL DEFAULT FALSE,
  "owner_address" text NOT NULL,
  PRIMARY KEY ("nft_id", "timestamp")
);
SELECT create_hypertable('listings', 'timestamp', chunk_time_interval := interval '7 day', create_default_indexes := false, if_not_exists => TRUE);

-- Trades
CREATE TABLE IF NOT EXISTS trades (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "nft_id" UUID NOT NULL,
  "collection_id" UUID NOT NULL,
  "type" text NOT NULL,
  "timestamp" timestamp with time zone NOT NULL,
  "network" text NOT NULL,
  "sale_price" bigint NOT NULL,
  "buyer_address" text NOT NULL,
  "seller_address" text NOT NULL,
  "tx_hash" text NOT NULL DEFAULT '',
  "source_member_id" text,
  PRIMARY KEY ("nft_id", "timestamp", "type")
);
SELECT create_hypertable('trades', 'timestamp', chunk_time_interval := interval '7 day', create_default_indexes := false, if_not_exists => TRUE);

-- Traits
CREATE TABLE IF NOT EXISTS trait_categories (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "trait_category" text NOT NULL,
  "trait_category_label" text NOT NULL,
  PRIMARY KEY ("id"),
  UNIQUE(trait_category)
);

CREATE TABLE IF NOT EXISTS traits (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "trait" text NOT NULL,
  "trait_label" text NOT NULL,
  PRIMARY KEY ("id"),
  UNIQUE(trait)
);

CREATE TABLE IF NOT EXISTS nft_has_traits (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "collection_id" UUID NOT NULL REFERENCES collections(id),
  "nft_id" UUID NOT NULL REFERENCES nfts(id),
  "trait_category_id" UUID NOT NULL REFERENCES trait_categories(id),
  "trait_id" UUID NOT NULL REFERENCES traits(id),
  PRIMARY KEY ("id"),
  UNIQUE(nft_id, trait_category_id)
);
CREATE INDEX collection_id_trait_id_idx ON nft_has_traits(collection_id, trait_id);
CREATE INDEX collection_id_trait_category_id_idx ON nft_has_traits(collection_id, trait_category_id);

CREATE TABLE IF NOT EXISTS collection_traits (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "collection_id" UUID NOT NULL REFERENCES collections(id),
  "trait_category_id" UUID NOT NULL REFERENCES trait_categories(id),
  "trait_id" UUID NOT NULL REFERENCES traits(id),
  "trait_count" integer NOT NULL,
  "percentage" real NOT NULL,
  PRIMARY KEY ("id"),
  UNIQUE(collection_id, trait_category_id, trait_id)
);

CREATE TABLE IF NOT EXISTS ranks (
  "collection_id" UUID NOT NULL REFERENCES collections(id),
  "name" text NOT NULL,
  "rank" integer NOT NULL,
  PRIMARY KEY ("collection_id", "name")
);

CREATE TABLE IF NOT EXISTS notify_items (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "item_id" UUID NOT NULL, -- id of the item that triggered the notification
  "item_type" text NOT NULL, -- listing, offer, sale, price, floor
  PRIMARY KEY ("id"),
  UNIQUE(item_id, item_type)
);

CREATE TABLE IF NOT EXISTS user_notifications (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "notify_item_id" UUID NOT NULL REFERENCES notify_items(id),
  PRIMARY KEY ("id"),
  UNIQUE(user_id, notify_item_id)
);

CREATE TABLE IF NOT EXISTS notify_queue (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "notify_item_id" UUID NOT NULL REFERENCES notify_items(id),
  "old_value" jsonb,
  "new_value" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE(notify_item_id, created_at)
);

CREATE TABLE IF NOT EXISTS notifications (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES users(id),
  "notify_type" text NOT NULL,
  "notify_item_id" UUID NOT NULL REFERENCES notify_items(id),
  "context" json NOT NULL,
  "notified" BOOLEAN NOT NULL DEFAULT FALSE, 
  "notified_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "acknowledged" BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY ("id"),
  UNIQUE(user_id, notify_item_id, created_at)
);

CREATE OR REPLACE FUNCTION public.create_notify_item() RETURNS TRIGGER
LANGUAGE plpgsql AS
$$
DECLARE
  n_id UUID;
  i_type text; 
BEGIN
  i_type := TG_ARGV[0];
  INSERT INTO notify_items (item_id, item_type)
  VALUES (NEW.id, i_type) ON CONFLICT (item_id, item_type) DO UPDATE
  SET item_type = excluded.item_type
  RETURNING notify_items.id INTO n_id;
  INSERT INTO notify_queue (notify_item_id, created_at, old_value, new_value) VALUES (n_id, NOW(), row_to_json(OLD.*), row_to_json(NEW.*));
  RETURN NULL;
END
$$;

-- DROP TRIGGER notify_listing ON nfts;
CREATE TRIGGER notify_listing
AFTER UPDATE
ON nfts
FOR EACH ROW
WHEN
	(NEW.is_listed = TRUE
	AND OLD.is_listed = FALSE)
EXECUTE FUNCTION public.create_notify_item('item_listed');

-- DROP TRIGGER notify_sale IF EXISTS ON nfts;
CREATE TRIGGER notify_sale
AFTER UPDATE
ON nfts
FOR EACH ROW
WHEN
  (OLD.owner_address <> NEW.owner_address)
EXECUTE FUNCTION public.create_notify_item('item_sold');

-- DROP TRIGGER IF EXISTS notify_price_change ON nfts;
CREATE TRIGGER notify_price_change
AFTER UPDATE
ON nfts
FOR EACH ROW
WHEN
  (OLD.current_price <> NEW.current_price AND NEW.current_price IS NOT NULL AND OLD.current_price IS NOT NULL)
EXECUTE FUNCTION public.create_notify_item('price_change');
