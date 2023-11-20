const {
  HACKER_NEWS_HOST: host = "https://hacker-news.firebaseio.com",
  HACKER_NEWS_API_VERSION: apiVersion = "v0",
  NODE_DOCKER_PORT: port = 8000,
  MONGODB_USER,
  MONGODB_PASSWORD,
  MONGODB_DATABASE,
  MONGODB_DOCKER_PORT,
  MONGODB_HOST,
} = process.env;

const BDConnectionURI = `mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}:${MONGODB_DOCKER_PORT}/${MONGODB_DATABASE}?authSource=admin`;

const baseURL = `${host}/${apiVersion}`;

export { baseURL, port, BDConnectionURI };
