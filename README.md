# Socket.io Console

Web console for connecting to a Socket.io service

View Demo: [https://noobsonly.com/projects/socketclient/](https://noobsonly.com/projects/socketclient/)

## Dev
```sh
# Start dev (detached)
docker-compose --profile dev up -d

# Stop dev
docker-compose --profile dev down
```

## Build
```sh
VERSION="0.2"
REGISTRY="host.docker.internal:5000"

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

#### Run build
```sh
docker run -d --name nodeclient-http --restart unless-stopped -p 8241:80 host.docker.internal:5000/nodeclient-http:latest
docker run -d --name nodeclient-ws   --restart unless-stopped -p 8242:80 host.docker.internal:5000/nodeclient-ws:latest
```

#### Old Setup

```bash
ws/server.sh -i
$ cd /var/www/ws/files/
$ npm install socket.io@1.3.7
$ exit
ws/server.sh
http/server.sh
```
