FROM ubuntu:20.04

WORKDIR /app

# https://docs.diladele.com/docker/timezones.html
# Prevent docker to stop build due to asking timezone, 
# (see https://rtfm.co.ua/en/docker-configure-tzdata-and-timezone-during-build/)
ENV TZ=Etc/UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Create package cache
RUN apt update

# Install utilities
RUN apt install curl cron build-essential python git -y \
  && git clone https://github.com/internxt/drive-server.git

RUN echo "*/10 * * * * find /app/drive-server/uploads /app/drive-server/downloads -type f -mmin +60 -exec rm -f {} \; \n*/10 * * * * find /app/drive-server/uploads /app/drive-server/downloads -mindepth 1 -maxdepth 1 -type d -mmin +60 -exec rm -rf {} \; " | crontab - 

# Install nvm
ENV NVM_DIR /root/.nvm
ENV NODE_VERSION 10.23.0
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash  \
  && . $NVM_DIR/nvm.sh \
  && nvm install $NODE_VERSION \
  && npm i -g yarn \ 
  && cd drive-server \
  && yarn

ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

WORKDIR /app/drive-server

RUN mkdir -p /app/drive-server/downloads

# Create Prometheus directories
RUN mkdir -p /mnt/prometheusvol1
RUN mkdir -p /mnt/prometheusvol2

CMD cron && node app.js