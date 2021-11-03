FROM mhart/alpine-node:14
LABEL author="internxt"

WORKDIR /app

# Add useful packages
RUN apk add git curl && git clone https://github.com/internxt/drive-server.git

WORKDIR /app/drive-server

# Install deps
RUN yarn && yarn build && yarn --production && yarn cache clean

# Create prometheus directories
RUN mkdir -p /mnt/prometheusvol{1,2}

# Start server
CMD node /app/drive-server/build/app.js