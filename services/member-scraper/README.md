# Member scraper

## Run as docker container

```sh
docker rm -f labralords-member-scraper && \
docker run -d --name labralords-member-scraper \
  -e NODE_ENV=production \
  -e DB_USERNAME=labralords-api \
  -e DB_PASSWORD=labralords \
  labralords/labralords-member-scraper
```
