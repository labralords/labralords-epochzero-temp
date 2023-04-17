# Listing scraper

## Run as docker container

```sh
docker rm -f labralords-listing-scraper && \
docker run -d --name labralords-listing-scraper \
  -e NODE_ENV=production \
  -e DB_USERNAME=labralords-api \
  -e DB_PASSWORD=labralords \
  labralords/labralords-listing-scraper
```
