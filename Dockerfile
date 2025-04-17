# Use Node.js official image
FROM node:18

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Install dependencies
RUN npm install

# Start the bot
CMD ["npm", "start"]