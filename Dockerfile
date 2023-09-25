# Use a base image
FROM node:12.18.4

# Set the working directory
WORKDIR /app

# Set an environment variable
#ENV BUILD_ID=dontKillMe

# Copy required files to working dir
COPY . .

# Install PM2, start your application, and save the process list
RUN npm install -g @angular/cli@9 pm2 gulp
#    pm2 start server/bin/oci-uat_server.json && \
#    pm2 save

# Display running PM2 processes
CMD ["npm", "version"]
CMD ["npm","list"]
CMD ["ng","version"]
CMD ["gulp","--version"]
CMD ["pm2","-v"]
