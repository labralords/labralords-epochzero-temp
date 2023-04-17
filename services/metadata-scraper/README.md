# Metadata scraper

## Run as docker container

```sh
docker rm -f labralords-metadata-scraper && \
docker run -d --name labralords-metadata-scraper \
  -e NODE_ENV=production \
  -e DB_USERNAME=labralords-api \
  -e DB_PASSWORD=labralords \
  labralords/labralords-metadata-scraper
```
