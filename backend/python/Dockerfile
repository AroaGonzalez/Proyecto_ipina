# Usa una imagen base de Python
FROM python:3.10-slim

# Establece la carpeta de trabajo dentro del contenedor
WORKDIR /app

# Copia el archivo de dependencias (requirements.txt)
COPY requirements.txt .

# Instala las dependencias necesarias para FastAPI y MySQL
RUN pip install --no-cache-dir -r requirements.txt

# Copia el resto del código de tu aplicación al contenedor
COPY . .

# Expone el puerto en el que corre el servicio
EXPOSE 8000

# Define el comando para iniciar la aplicación directamente con uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]