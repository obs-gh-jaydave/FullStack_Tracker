# Use official Node.js image for the back-end
FROM node:16

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the app's source code
COPY . .

# Expose port 3001
EXPOSE 3001

# Start the app
CMD ["node", "app.js"]