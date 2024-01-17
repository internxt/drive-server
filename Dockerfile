FROM node:16
LABEL author="internxt"

WORKDIR /drive-server

# Add useful packages
# RUN apk add git curl

COPY . .

# Install deps
RUN yarn && yarn build && yarn --production && yarn cache clean

# Create prometheus directories
# RUN mkdir -p /mnt/prometheusvol{1,2}

# Start server
CMD node -r newrelic /drive-server/build/app.js
