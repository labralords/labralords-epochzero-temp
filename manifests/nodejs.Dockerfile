# globals
ARG PACKAGE_PATH
ARG NODE_VERSION=16
ARG PNPM_VERSION=7.0.0

# base
FROM node:${NODE_VERSION}-alpine AS base
RUN npm --no-fund --location=global install pnpm@${PNPM_VERSION}
RUN pnpm --version
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
RUN NODE_ENV=production pnpm run --filter "{${PACKAGE_PATH}}" build

# assets
FROM dev AS assets
RUN rm -rf node_modules tsconfig.build.json tsconfig.json && pnpm recursive exec rm -rf \
  ./src \
  ./jest.config.cjs \
  ./README.md \
  ./tsconfig.json \
  ./tsconfig.tsbuildinfo \
  ./.eslintrc.cjs \
  ./.prettierrc.cjs \
  ./test \
  ./node_modules

# prod
FROM base AS prod

ARG NPM_TOKEN
ARG PACKAGE_PATH

ENV NODE_ENV=production
ENV HTTP_HOST=0.0.0.0
ENV HTTP_PORT=3000

EXPOSE 3000

COPY ./meta .
RUN --mount=type=cache,id=pnpm-store,target=/app/.pnpm-store \
  pnpm install --filter "{${PACKAGE_PATH}}..." \
  --frozen-lockfile \
  --unsafe-perm \
  --prod \
  | grep -v "cross-device link not permitted\|Falling back to copying packages from store"

COPY --from=assets /app/monorepo .

WORKDIR /app/monorepo/${PACKAGE_PATH}

RUN cp /usr/local/bin/node /app/
ARG user=appuser
ARG group=appuser
ARG uid=10001
ARG gid=10001
RUN adduser -u ${uid} -s /sbin/nologin -h /home/${user} -D ${user}
RUN chown -R ${user}:${group} /app

USER ${uid}:${gid}
CMD [ "/app/node", "./dist/index.js" ]
