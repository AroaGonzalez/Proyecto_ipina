# 🛠️ Configuración e Inicio del Proyecto

Este proyecto está compuesto por varios microservicios desarrollados en tecnologías como **Node.js**, **Python (FastAPI)**, y bases de datos como **MongoDB** y **MySQL**. Sigue los pasos a continuación para poner en marcha la aplicación.

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalados los siguientes programas en tu sistema:

- **Docker** y **Docker Compose**: Para gestionar los contenedores.
- **Node.js** y **npm**: Para ejecutar el frontend.
- **Python** (opcional, solo necesario si decides instalar dependencias localmente).
- Un navegador web: Para acceder a la aplicación.

## 📦 Dependencias Necesarias
Ejecuta el siguiente comando en la raíz del proyecto frontend:

    npm install
El archivo package.json debe incluir las siguientes dependencias para el proyecto frontend y backend:

Dependencias del Frontend
    {
    "dependencies": {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-router-dom": "^6.11.2",
        "axios": "^1.4.0"
    }
    }

Dependencias del Backend (Node.js)

    {
    "dependencies": {
        "express": "^4.18.2",
        "swagger-jsdoc": "^6.2.8",
        "swagger-ui-express": "^4.6.3",
        "mongoose": "^7.2.2",
        "cors": "^2.8.5",
        "jsonwebtoken": "^9.0.0",
        "bcryptjs": "^2.4.3",
        "node-cron": "^3.0.2",
        "sequelize": "^6.31.1",
        "mysql2": "^3.2.0"
    }
    }

Ejecuta en el backend:

    npm install


## 🚀 Comandos para Iniciar el Proyecto

### 1. Iniciar los servicios con Docker
Primero, asegúrate de que Docker esté funcionando correctamente. Luego, ejecuta los siguientes comandos en la raíz del proyecto:

docker-compose down
docker-compose up --build

### 2. Iniciar el Frontend

Para iniciar el servidor del frontend y acceder a la página principal:

### 2.1. Navega al directorio del frontend:

   cd frontend

Inicia el servidor del frontend:

    npm start

El servidor del frontend estará disponible en: http://localhost:3000.

## 🧩 Servicios Iniciados Correctamente
Una vez que los comandos anteriores hayan sido ejecutados, los servicios estarán disponibles en las siguientes direcciones:

API Gateway: http://localhost:8080
Servicio de Python (FastAPI): http://localhost:8000
Servicio de Node.js: http://localhost:5000
MongoDB: Disponible en el puerto 27017.
MySQL: Disponible en el puerto 3306.

## 📚 Documentación de las APIs

FastAPI (MySQL)
    Swagger: http://localhost:8000/docs
    Redoc: http://localhost:8000/redoc
Node.js (MongoDB)
    Swagger: http://localhost:5000/api-docs

## 📊 Visualización de Datos

### 1. Ver usuarios creados (MongoDB)
### 1.1. Abre un terminal y accede al contenedor de MongoDB:

    docker exec -it mongodb mongosh -u root -p rootpassword

### 1.2. Dentro del cliente de MongoDB, ejecuta los siguientes comandos:
    use tienda
    show collections
    db.users.find()

### 2. Ver inventario (MySQL)
### 2.1. Abre un terminal y accede al contenedor de MySQL:

    docker exec -it mysqldb mysql -u root -p

### 2.2. Dentro del cliente de MySQL, selecciona la base de datos y consulta los datos:

    Quizás pida una contraseña, en este caso introducir "root"
    USE tienda;
    SELECT * FROM inventario;
    SELECT * FROM tiendas;

### 2.3. También puedes acceder al inventario a través del endpoint en tu navegador:

    http://localhost:5000/inventario

### ✨ Funcionalidades Principales

Usuarios

    /register: Registro de nuevos usuarios.
    /login: Autenticación de usuarios.
    /profile: Consulta y actualización del perfil.
    /profile/change-password: Cambio de contraseña.

Inventarios
    /inventario: Visualización y ajuste de los inventarios.
    /recargar-producto/{id}: Solicitar recarga de stock para un producto específico.

Pedidos
    /pedidos: Creación y seguimiento de pedidos.
    /pedidos/pendientes: Consulta de pedidos pendientes.
    /pedidos/{id}: Actualización o eliminación de un pedido específico.

Estadísticas
    /stats: Generación de reportes y estadísticas del sistema.