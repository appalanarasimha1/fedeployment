FROM node:12.18.4 as builder
WORKDIR /app
COPY ./package*.json ./
RUN npm install
RUN npm install -g @angular/cli@9
RUN npm install -g pm2 --save
RUN echo 'hosts: files mdns4_minimal [NOTFOUND=return] dns mdns4' >> /etc/nsswitch.conf
FROM node:12.18.4 as production
WORKDIR /app
COPY --from=builder /usr/local/lib/node_modules/pm2 /usr/local/lib/node_modules/pm2
ENV PATH="/usr/local/lib/node_modules/pm2/bin:${PATH}"
COPY . .
CMD pm2 start server/bin/oci-prod_server.json && pm2 save && pm2 list && tail -f /dev/null
