# https://github.com/sapphiredev/spinel/blob/main/Dockerfile

# ================ #
#    Base Stage    #
# ================ #

FROM node:18-alpine as base

WORKDIR /usr/src/app

ENV CI=true
ENV LOG_LEVEL=info

COPY --chown=node:node yarn.lock .
COPY --chown=node:node package.json .
COPY --chown=node:node .env .env

# ================ #
#   Builder Stage  #
# ================ #

FROM base as builder

ENV NODE_ENV="development"

COPY --chown=node:node tsconfig.json .
COPY --chown=node:node prisma/ prisma/
COPY --chown=node:node src/ src/

RUN yarn install --immutable
RUN sed -i 's/roundRect(x: number, y: number, width: number, height: number, radii: number | CornerRadius\[\])/&: any/' node_modules/skia-canvas/lib/index.d.ts
RUN yarn prisma generate
RUN yarn run build

# ================ #
#   Runner Stage   #
# ================ #

FROM base AS runner

ENV NODE_ENV="production"
ENV NODE_OPTIONS="--enable-source-maps"

WORKDIR /usr/src/app

COPY --chown=node:node --from=builder /usr/src/app/dist dist

RUN apk add --no-cache fontconfig font-noto
RUN yarn install --immutable --production

COPY --chown=node:node --from=builder /usr/src/app/node_modules/.prisma node_modules/.prisma
COPY --chown=node:node prisma/ prisma/

RUN chown node:node /usr/src/app/

COPY entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT [ "/usr/local/bin/docker-entrypoint.sh" ]

USER node
VOLUME [ "/data" ]

CMD [ "yarn", "run", "start"]