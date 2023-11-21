# hacker-news proxy api

Implementation of a service that acts as a layer between the source hacker-news and a third-party which provides list of stories.

## Technologies and tools

- Node
- Express
- MongoDB
- OpenAPI 3

## Usage

### 1. Clone the repository.

```bash
git clone https://github.com/gtopsis/hacker-news-proxy-api.git
```

### 2. Create .env file with the following:

```bash
HACKER_NEWS_HOST=https://hacker-news.firebaseio.com
HACKER_NEWS_API_VERSION=v0

MONGODB_USER=root
MONGODB_PASSWORD=123456
MONGODB_DATABASE=hacker_news_proxy_api_db
MONGODB_LOCAL_PORT=7017
MONGODB_DOCKER_PORT=27017
MONGODB_NAME=hackerNewsDB
MONGODB_HOST=mongodb

NODE_LOCAL_PORT=6868
NODE_DOCKER_PORT=8080
```

### 3. Build the app and use Docker:

```bash
npm run build
```

### 4. Start and attach to containers the service.

```bash
docker compose up --build
```

## Available services (see also **API document**)

- http://localhost:6868/api-docs (API doc with swagger-UI)
- http://localhost:6868/news?type=recent
- http://localhost:6868/news?type=popular
- http://localhost:6868/news/highlight
- http://localhost:6868/news/refresh (POST request)
