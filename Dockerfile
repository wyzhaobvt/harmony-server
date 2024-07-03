# Use a Node.js image with npm as a parent image
FROM node:alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json /app/
RUN npm install --production

# Copy the rest of the Vite project files to /app
COPY . /app/

# Environment variables
ARG JWT_KEY
ARG SERVER_PORT
ARG CLIENT_PORT
ARG DB_HOST
ARG DB_USER
ARG DB_PASSWORD
ARG DB_NAME

ENV JWT_KEY=$JWT_KEY
ENV SERVER_PORT=$SERVER_PORT
ENV CLIENT_PORT=$CLIENT_PORT
ENV DB_HOST=$DB_HOST
ENV DB_USER=$DB_USER
ENV DB_PASSWORD=$DB_PASSWORD
ENV DB_NAME=$DB_NAME

# Expose the port Vite serves on (assuming it's 5000 based on your example)
EXPOSE 5000

# Command to run the application
CMD ["npm", "run", "start"]
