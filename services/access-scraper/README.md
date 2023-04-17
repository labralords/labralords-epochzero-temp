# Access scraper

## Run as docker container

```sh
docker rm -f labralords-access-scraper && \
docker run -d --name labralords-access-scraper \
  -e NODE_ENV=production \
  -e DB_USERNAME=labralords-api \
  -e DB_PASSWORD=labralords \
  labralords/labralords-access-scraper
```
