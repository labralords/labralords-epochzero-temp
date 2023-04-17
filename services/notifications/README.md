# Notifications

## Run as docker container

```sh
docker rm -f labralords-notifications && \
docker run -d --name labralords-notifications \
  -e NODE_ENV=production \
  -e DB_USERNAME=labralords-api \
  -e DB_PASSWORD=labralords \
  labralords/labralords-notifications
```
