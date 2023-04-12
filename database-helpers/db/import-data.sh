#!/bin/bash
DOCKER_POSTGRES_IMAGE="${DOCKER_POSTGRES_IMAGE:-postgres:13.4}"

DB_HOST="${DB_HOST:-localhost}"
DB_DATABASE="${DB_DATABASE:-labralords}"
DB_USERNAME="${DB_USERNAME:-labralords-api}"

# Enter password
echo -n "Enter password for user '$DB_USERNAME' on '${DB_HOST}': "
read -r -s DB_PASSWORD
echo

# echo "Importing collection-data.csv..."
docker run -it -v "$PWD/db":/opt/db -e PGPASSWORD="$DB_PASSWORD" --entrypoint=/bin/bash "$DOCKER_POSTGRES_IMAGE" \
  -c "psql -h $DB_HOST -d $DB_DATABASE -U $DB_USERNAME -c \"\copy public.collections (id, name, description, source, source_collection_id, has_valid_ranks, included_in_trial, nfts_minted, nft_count, mint_price, royalties_fee, available_from, twitter_username, discord_username, created_at, updated_at) from STDIN with CSV HEADER delimiter as ','\" < /opt/db/collection-data.csv"

echo "Importing nft-data.csv..."
docker run -it -v "$PWD/db":/opt/db -e PGPASSWORD="$DB_PASSWORD" --entrypoint=/bin/bash "$DOCKER_POSTGRES_IMAGE" \
  -c "psql -h $DB_HOST -d $DB_DATABASE -U $DB_USERNAME -c \"\copy public.nfts (id, collection_id, name, source_nft_id, source, media_source, is_listed, is_auctioned, current_price, owner_address, listed_at, created_at, updated_at) from STDIN with CSV HEADER delimiter as ','\" < /opt/db/nft-data.csv"

echo "Importing listing-data.csv..."
docker run -it -v "$PWD/db":/opt/db -e PGPASSWORD="$DB_PASSWORD" --entrypoint=/bin/bash "$DOCKER_POSTGRES_IMAGE" \
  -c "psql -h $DB_HOST -d $DB_DATABASE -U $DB_USERNAME -c \"\copy public.listings (id, collection_id, nft_id, timestamp, is_auctioned, list_price, owner_address) from STDIN with CSV HEADER delimiter as ','\" < /opt/db/listing-data.csv"

echo "Importing trait-category-data.csv..."
docker run -it -v "$PWD/db":/opt/db -e PGPASSWORD="$DB_PASSWORD" --entrypoint=/bin/bash "$DOCKER_POSTGRES_IMAGE" \
  -c "psql -h $DB_HOST -d $DB_DATABASE -U $DB_USERNAME -c \"\copy public.trait_categories (id, trait_category, trait_category_label) from STDIN with CSV HEADER delimiter as ','\" < /opt/db/trait-category-data.csv"

echo "Importing trait-data.csv'..."
docker run -it -v "$PWD/db":/opt/db -e PGPASSWORD="$DB_PASSWORD" --entrypoint=/bin/bash "$DOCKER_POSTGRES_IMAGE" \
  -c "psql -h $DB_HOST -d $DB_DATABASE -U $DB_USERNAME -c \"\copy public.traits (id, trait, trait_label) from STDIN with CSV HEADER delimiter as ','\" < /opt/db/trait-data.csv"

echo "Importing nft-has-trait-data.csv..."
docker run -it -v "$PWD/db":/opt/db -e PGPASSWORD="$DB_PASSWORD" --entrypoint=/bin/bash "$DOCKER_POSTGRES_IMAGE" \
  -c "psql -h $DB_HOST -d $DB_DATABASE -U $DB_USERNAME -c \"\copy public.nft_has_traits (id, collection_id, nft_id, trait_id, trait_category_id) from STDIN with CSV HEADER delimiter as ','\" < /opt/db/nft-has-trait-data.csv"

echo "Done!"
