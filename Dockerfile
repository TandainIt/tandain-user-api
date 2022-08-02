# We use multi-stage builds, those are: base, development, local.
# The base stage has commonalities in both development and local.

FROM node:16-alpine as base

# Create app directory
WORKDIR /usr/app

# Install app dependencies
COPY package.json ./
COPY yarn.lock ./
RUN yarn install

EXPOSE 3001

## DEVELOPMENT

FROM base as development

# Bundle app source
COPY . .
RUN yarn run build
CMD ["yarn", "run", "start"]

## LOCAL

FROM base as local

# Set ownership and permissions
USER node

# Bundle app source
COPY . .

CMD ["yarn", "run", "dev"]