# Production
FROM node:24.22.2-alpine AS production
COPY ws/files/ /var/www/ws/
USER node
CMD ["node", "/var/www/ws/noobnode.js"]

# Development
FROM node:24.22.2-alpine AS development
USER node
CMD ["node", "/var/www/ws/noobnode.js"]
