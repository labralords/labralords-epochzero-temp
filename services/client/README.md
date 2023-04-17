# Client

## Run as docker container

```sh
docker rm -f labralords-client && \
docker run -d --name labralords-client \
  -p 80:3000 \
  -e NODE_ENV=production \
  labralords/labralords-client
```
