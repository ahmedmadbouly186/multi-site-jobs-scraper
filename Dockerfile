FROM apify/actor-node-playwright-chrome:22-1.62.1

COPY package*.json ./

RUN npm ci --omit=dev --omit=optional

COPY . ./

CMD npm start --silent