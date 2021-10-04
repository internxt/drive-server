FROM mhart/alpine-node:14
LABEL author="internxt"

WORKDIR /app

# Add useful packages
RUN apk add git curl && git clone -b remove-storj https://github.com/internxt/drive-server.git

WORKDIR /app/drive-server

# Install deps
RUN yarn && yarn cache clean

# Create prometheus directories
RUN mkdir -p /mnt/prometheusvol{1,2}

# Start farmer
CMD node app.js