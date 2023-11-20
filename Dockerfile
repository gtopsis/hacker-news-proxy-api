# From the base image node
FROM node
WORKDIR /app

# Copy all the files from your file system to the container file system
COPY package*.json ./

# Install all dependencies
RUN npm i

# Copy other files as well
COPY . .

# Expose the port
EXPOSE 8080

# Command to execute when the image is instantiated
CMD ["npm","build"]
CMD ["npm","start"]
            