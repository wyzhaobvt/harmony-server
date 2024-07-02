# Use a Node.js image with npm as a parent image
FROM node:alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json /app/
RUN npm install --production

# Copy the rest of the Vite project files to /app
COPY . /app/

# Expose the port Vite serves on (assuming it's 5000 based on your example)
EXPOSE 5000

# Command to run the application
CMD ["npm", "run", "start"]
