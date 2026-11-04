# Socket.io Console

Web console for connecting to a Socket.io service

View Demo: [https://noobsonly.com/projects/socketclient/](https://noobsonly.com/projects/socketclient/)

## Dev
```sh
# Start dev (detached)
docker-compose --profile dev up -d

# Stop dev
docker-compose --profile dev down

# Run tests (needs Node 20+)
node --test
```

## Build
```sh
VERSION="0.3"
REGISTRY="host.docker.internal:5000"

# Install ws dependencies (copied into the ws image)
(cd ws/files && npm ci)

# Build image
docker-compose build prod

# Tag images
NAME_HTTP="${REGISTRY}/nodeclient-http"
NAME_WS="${REGISTRY}/nodeclient-ws"

docker tag nodeclient-http-prod ${NAME_HTTP}:${VERSION}
docker tag ${NAME_HTTP}:${VERSION} ${NAME_HTTP}:latest

docker tag nodeclient-ws-prod ${NAME_WS}:${VERSION}
docker tag ${NAME_WS}:${VERSION} ${NAME_WS}:latest

# Push image to registry'
docker push ${NAME_HTTP}:${VERSION}
docker push ${NAME_HTTP}:latest

docker push ${NAME_WS}:${VERSION}
docker push ${NAME_WS}:latest
```

#### Updating PHP
```sh
# 1. Bump the FROM lines in http/Dockerfile to the latest 8.3.x patch tag
# 2. Bump VERSION above, then rebuild, tag and push as in Build
# 3. Verify the running container
docker exec nodeclient-http php -v
```

#### Run build
```sh
docker run -d --name nodeclient-http --restart unless-stopped -p 8241:80 host.docker.internal:5000/nodeclient-http:latest
docker run -d --name nodeclient-ws   --restart unless-stopped -p 8242:8242 host.docker.internal:5000/nodeclient-ws:latest
```
