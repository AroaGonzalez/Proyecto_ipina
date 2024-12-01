# Usa una imagen base de Node.js
FROM node:18-alpine

# Establece la carpeta de trabajo dentro del contenedor
WORKDIR /app

# Copia el archivo package.json y package-lock.json al contenedor
COPY package*.json ./

# Instala las dependencias necesarias para la aplicación
RUN npm install

# Copia el resto del código de tu aplicación al contenedor
COPY . .

# Define el comando para iniciar la aplicación
CMD ["npm", "start"]

# Expone el puerto en el que corre el servicio
EXPOSE 5000