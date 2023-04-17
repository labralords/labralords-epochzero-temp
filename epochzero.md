# Deployment to Epoch Zero

Install docker on ec2.

Copy `docker-compose.epochzero.yaml` to VM, rename as `docker-compose.yaml`. Create a `.env` file that contains `DB_PASSWORD` in the same folder and run:

```sh
docker-compose pull && \
docker-compose --env-file .env up -d
```
