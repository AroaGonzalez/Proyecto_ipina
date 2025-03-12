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

const Inventario = sequelizeAjenos.define(
  'Inventario',
  {  
    idArticulo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },  
    articulo: { type: DataTypes.STRING, allowNull: false },  
    estado: { type: DataTypes.ENUM('Activo', 'Pausado'), defaultValue: 'Activo' }  
  },  
  { tableName: 'inventario', timestamps: false }  
);

const Tienda = sequelizeMaestros.define(
  'Tienda',  
  {  
    tiendaId: { type: DataTypes.INTEGER, primaryKey: true },  
    nombre: { type: DataTypes.STRING },  
    direccion: { type: DataTypes.STRING },  
  },  
  { tableName: 'tiendas', timestamps: false }  
);

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

function authenticateToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'Token requerido' });

  jwt.verify(token.split(' ')[1], JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });
    req.user = user;
    next();
  });
}

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
  }

  try {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
          return res.status(400).json({ message: 'El usuario ya está registrado' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ username, password: hashedPassword });

      await newUser.save();
      res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error inesperado en el servidor' });
  }
});

app.post('/checkUser', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ message: 'El nombre de usuario es requerido' });
  }

  try {
    const user = await User.findOne({ username });
    if (user) {
      res.json({ exists: true });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Contraseña incorrecta' });

    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/profile', authenticateToken, async (req, res) => {
  try {
      const user = await User.findOne({ username: req.user.username });
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

      res.json({
          username: user.username,
          name: user.name,
          email: user.email,
          address: user.address,
      });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

app.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, address } = req.body;
    const user = await User.findOneAndUpdate(
      { username: req.user.username },
      { name, email, address },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/stats', async (req, res) => {
  try {
    const pedidosPendientes = await Pedido.countDocuments({ estado: 'Pendiente' });

    const productosInventario = await Inventario.count();

    const tiendasRegistradas = await Tienda.count();

    res.json({
      pedidosPendientes,
      productosInventario,
      tiendasRegistradas,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/profile/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Ambas contraseñas son requeridas.' });
  }

  try {
    if (!req.user || !req.user.username) {
      return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    const user = await User.findOne({ username: req.user.username });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'La contraseña actual es incorrecta.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    res.status(200).json({ message: 'Contraseña actualizada exitosamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});