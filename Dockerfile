# Builds songs.json/songs.xml fresh from songs/ and serves them over HTTP with
# the repo's built-in server (src/scripts/serve.ts). ts-node is a devDependency
# and is needed at runtime, so we keep the full dependency install.
FROM node:lts-alpine

WORKDIR /app/
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

EXPOSE 8080
CMD ["yarn", "serve", "8080"]
