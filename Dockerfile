FROM amazonlinux:2

WORKDIR /tmp

# shadow-utils is used for groupadd/useradd package
RUN yum install tar gzip shadow-utils -y

# Installing NodeJS (v16.13.0)
RUN curl -sL https://nodejs.org/dist/v16.13.0/node-v16.13.0-linux-x64.tar.gz -o node.tar.gz &&\
  echo "bb20c3f845896272f18bd8c91d1c9b07  node.tar.gz" | md5sum -c &&\
  tar -xf node.tar.gz --strip 1 -C /usr/local &&\
  rm -rf /tmp/node.tar.gz

# Set log level
ENV NPM_CONFIG_LOGLEVEL=warn

# create project directory in container
RUN mkdir -p /app

# set /app directory as default working directory
WORKDIR /app

#Expose 4000 port to the host
EXPOSE 4000

# Copy the src content into image
COPY client client
COPY configs configs
COPY server server
COPY package.json .
COPY package-lock.json .
COPY .babelrc .

ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# Install only prod packages
RUN npm install --unsafe-perm --production

# Updated code for serving
RUN npm run construct

# Initial command to start the server
CMD ["npm","start"]
