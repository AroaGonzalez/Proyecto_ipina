# Usa una imagen base de Python
FROM python:3.10-slim

# Establece la carpeta de trabajo dentro del contenedor
WORKDIR /app

# Copia el archivo de dependencias (requirements.txt)
COPY requirements.txt .

# Instala las dependencias necesarias para FastAPI y MySQL
RUN pip install -r requirements.txt

# Copia el script wait-for-it
COPY wait-for-it.sh /wait-for-it.sh

# Dale permisos de ejecución al script
RUN chmod +x /wait-for-it.sh

# Copia el resto del código de tu aplicación al contenedor
COPY . .

# Expone el puerto en el que corre el servicio
EXPOSE 8000

# Define el comando para iniciar la aplicación utilizando wait-for-it.sh
CMD ["./wait-for-it.sh", "mysqldb:3306", "--", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
