FROM node:20-alpine
WORKDIR /app
COPY . .
RUN yarn && yarn build
CMD ["yarn", "start"]
EXPOSE 8080