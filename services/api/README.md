# Api

## Run as docker container

```sh
docker rm -f labralords-api && \
docker run -d --name labralords-api \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_USERNAME=labralords-api \
  -e DB_PASSWORD=labralords \
  labralords/labralords-api
```
