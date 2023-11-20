import dotenv from "dotenv";

dotenv.config();

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

const BDConnectionURI =
  process.env.NODE_ENV === "development"
    ? "mongodb://localhost:27017"
    : `mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}:${MONGODB_DOCKER_PORT}/${MONGODB_DATABASE}?authSource=admin`;

const baseURL = `${host}/${apiVersion}`;

export { baseURL, port, BDConnectionURI };
