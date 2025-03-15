const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors'); 
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const JWT_SECRET = 'your_jwt_secret'; 

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Gestión de Inventario y Pedidos',
      version: '1.0.0',
      description: 'Documentación de la API RESTful para la gestión de inventario, pedidos y usuarios.',
    },
    servers: [
      {
        url: 'http://localhost:5000',
      },
    ],
  },
  apis: ['./routes/*.js', './index.js'], 
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Conexión a AJENOS
const sequelizeAjenos = new Sequelize(
  'AJENOS',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD || 'root',
  {
    host: process.env.MYSQL_HOST || 'mysqldb',
    dialect: 'mysql',
    logging: console.log,
  }
);

// Conexión a MAESTROS
const sequelizeMaestros = new Sequelize(
  'MAESTROS',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD || 'root',
  {
    host: process.env.MYSQL_HOST || 'mysqldb',
    dialect: 'mysql',
    logging: console.log,
  }
);

// Función para conectar a ambas bases de datos
async function connectWithRetry() {
  let retries = 10;
  while (retries > 0) {
    try {
      await sequelizeAjenos.sync({ alter: true });
      await sequelizeMaestros.sync({ alter: true });
      console.log('Conexión a MySQL establecida y tablas sincronizadas.');
      break;
    } catch (error) {
      console.error('Error al conectar o sincronizar con MySQL:', error.message);
      retries -= 1;
      console.log(`Reintentando conexión en 10 segundos (${retries} intentos restantes)...`);
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }
  if (retries === 0) {
    console.error('No se pudo conectar a MySQL después de varios intentos.');
    process.exit(1);
  }
}

connectWithRetry();

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

const User = require('./models/user')(sequelizeAjenos);

// Para la ruta de login, reemplazar el código existente
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
  }

  try {
    // Buscar usuario en la base de datos
    const user = await User.findOne({ 
      where: { username } 
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Comparar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username }, 
      JWT_SECRET, 
      { expiresIn: '8h' }
    );
    
    // Devolver token y datos básicos del usuario
    res.json({ 
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name || ''
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// backend/node/index.js (Registro)
app.post('/register', async (req, res) => {
  const { username, password, name, email } = req.body;
   
  if (!username || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
  }

  try {
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ 
      where: { username } 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear nuevo usuario
    const newUser = await User.create({
      username,
      password: hashedPassword,
      name: name || '',
      email: email || ''
    });

    // Generar token para login automático
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username }, 
      JWT_SECRET, 
      { expiresIn: '8h' }
    );
    
    res.status(201).json({ 
      message: 'Usuario registrado exitosamente',
      token
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

const ajenoRamRoutes = require('./routes/AjenoRamRoutes');

app.use('/inventario', ajenoRamRoutes);

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});