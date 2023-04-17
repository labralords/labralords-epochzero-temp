# Deployment to Epoch Zero

1. Uninstall apache server
2. Install docker
3. Install python3 and docker-compose
4. Copy `docker-compose.epochzero.yaml` and `epochzero-nginx.conf` to VM
5. Rename `docker-compose.epochzero.yaml` to `docker-compose.yaml`
6. Create a `.env` file that contains `DB_PASSWORD` in the same folder
7. Run this in the same folder as the files:

```sh
docker-compose pull && \
docker-compose --env-file .env up -d
```
