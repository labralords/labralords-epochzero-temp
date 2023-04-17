# Deployment to Epoch Zero

1. Uninstall apache server
2. Install docker
3. Copy `docker-compose.epochzero.yaml` and `epochzero-nginx.conf` to VM
4. Rename `docker-compose.epochzero.yaml` to `docker-compose.yaml`
5. Create a `.env` file that contains `DB_PASSWORD` in the same folder
6. Run this in the same folder as the files:

```sh
docker-compose pull && \
docker-compose --env-file .env up -d
```
