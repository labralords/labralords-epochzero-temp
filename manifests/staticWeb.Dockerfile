# globals
ARG PACKAGE_PATH
ARG NODE_VERSION=16
ARG PNPM_VERSION=8

# base
FROM node:${NODE_VERSION}-alpine AS base
RUN npm --no-update-notifier --no-fund --global install pnpm@${PNPM_VERSION}
WORKDIR /app/monorepo

# development
FROM base AS dev

ARG NPM_TOKEN
ARG PACKAGE_PATH
ENV CI=true

COPY ./meta .
RUN --mount=type=cache,id=pnpm-store,target=/app/.pnpm-store \
  pnpm install --filter "{${PACKAGE_PATH}}..." \
  --frozen-lockfile \
  --unsafe-perm \
  | grep -v "cross-device link not permitted\|Falling back to copying packages from store"

COPY ./deps .
RUN pnpm run --if-present --filter "{${PACKAGE_PATH}}^..." build

COPY ./pkg .

FROM dev AS devAssets
RUN pnpm run --filter "{${PACKAGE_PATH}}" build:dev

FROM dev AS stageAssets
RUN pnpm run --filter "{${PACKAGE_PATH}}" build:stage

FROM dev AS prodAssets
RUN pnpm run --filter "{${PACKAGE_PATH}}" build:prod

# prod
FROM nginxinc/nginx-unprivileged:1.20-alpine AS prod

ARG PACKAGE_PATH

ENV NODE_ENV=production

EXPOSE 3000

WORKDIR /app

COPY --from=devAssets /app/monorepo/${PACKAGE_PATH}/dist /usr/share/nginx/html/development
COPY --from=stageAssets /app/monorepo/${PACKAGE_PATH}/dist /usr/share/nginx/html/stage
COPY --from=prodAssets /app/monorepo/${PACKAGE_PATH}/dist /usr/share/nginx/html/production
COPY --from=dev /app/monorepo/${PACKAGE_PATH}/config/nginx.conf /etc/nginx/templates/nginx.conf.template

USER root
ARG uid=10001

RUN deluser nginx && adduser -DH -h /var/cache/nginx -s /sbin/nologin -u ${uid} nginx
RUN chown -R nginx:nginx /app
RUN chown -R nginx:nginx /usr/share/nginx
RUN chown -R nginx:nginx /etc/nginx
RUN chown -R nginx:nginx /var/log/nginx
RUN chown -R nginx:nginx /var/cache/nginx

USER nginx
CMD ["nginx", "-g", "daemon off;"]
