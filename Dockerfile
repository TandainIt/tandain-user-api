FROM node:16

# Create app directory
WORKDIR /user/src/app

# Install app dependencies
COPY package.json ./
COPY yarn.lock ./
RUN yarn install

# Bundle app source
COPY . .

EXPOSE 3001
CMD ["yarn", "run", "dev"]