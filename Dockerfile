# Build stage with Node.js v20.16.0
FROM node:20.16.0-alpine AS build

WORKDIR /app
COPY . .

RUN npm install
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Replace Nginx default config to listen on port 8080
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build output to Nginx public folder
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
