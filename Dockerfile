# We use multi-stage builds, those are: base, development, local.
# The base stage has commonalities in both development and local.


FROM node:16-alpine as base

# Create app directory
WORKDIR /src

COPY package.json ./
COPY yarn.lock ./

EXPOSE 3001

FROM base as development
ENV NODE_ENV=development

# Bundle app source
COPY /dist .

CMD ["yarn", "run", "build"]


FROM base as local
ENV NODE_ENV=local

# Install app dependencies
RUN yarn install

# Bundle app source
COPY . .

CMD ["yarn", "run", "dev"]