const {
  HOST: host = "https://hacker-news.firebaseio.com",
  API_VERSION: apiVersion = "v0",
  PORT: port = 8000,
} = process.env;

const baseURL = `${host}/${apiVersion}`;

export { baseURL, port };
