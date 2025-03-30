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

#### Old Setup

```bash
ws/server.sh -i
$ cd /var/www/ws/files/
$ npm install socket.io@1.3.7
$ exit
ws/server.sh
http/server.sh
```
