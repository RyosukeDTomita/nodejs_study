FROM mcr.microsoft.com/devcontainers/typescript-node:22-bookworm AS devcontainers
WORKDIR /app
COPY ./package.json yarn.lock ./
RUN <<EOF bash -ex
yarn install
yarn cache clean
EOF

FROM devcontainers AS compile
COPY . .
RUN <<EOF bash -ex
yarn run package
yarn remove $(jq -r '.devDependencies | keys | join(" ")' package.json)
EOF

FROM node:22-slim AS deploy
COPY --from=compile /app/dist/ /app/dist/
COPY --from=compile /app/node_modules/ /app/node_modules/
ENTRYPOINT ["node", "/app/dist/index.js"]
