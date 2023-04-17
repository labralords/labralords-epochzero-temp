# Trade scraper

## Run as docker container

```sh
docker rm -f labralords-trade-scraper && \
docker run -d --name labralords-trade-scraper \
  -e NODE_ENV=production \
  -e DB_USERNAME=labralords-api \
  -e DB_PASSWORD=labralords \
  labralords/labralords-trade-scraper
```
