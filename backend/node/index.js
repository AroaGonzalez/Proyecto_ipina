const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors'); 
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes } = require('sequelize');
const tiendaRoutes = require('./routes/tiendaRoutes');
const app = express();
const JWT_SECRET = 'your_jwt_secret'; 
const ajenoRamRoutes = require('./routes/AjenoRamRoutes');

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

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
  }

  try {
    const user = await User.findOne({ 
      where: { username } 
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username }, 
      JWT_SECRET, 
      { expiresIn: '8h' }
    );
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

app.post('/register', async (req, res) => {
  const { username, password, name, email } = req.body;
   
  if (!username || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
  }

  try {
    const existingUser = await User.findOne({ 
      where: { username } 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await User.create({
      username,
      password: hashedPassword,
      name: name || '',
      email: email || ''
    });

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

app.use('/ajenos', ajenoRamRoutes);
app.use('/inventario', ajenoRamRoutes);
app.use('/tiendas', tiendaRoutes);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error al verificar token:', error);
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'name', 'email', 'address']
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, address } = req.body;
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    user.name = name || user.name;
    user.email = email || user.email;
    user.address = address || user.address;
    await user.save();
    
    res.json({ message: 'Perfil actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.put('/profile/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Se requieren ambas contraseñas' });
    }
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Contraseña actual incorrecta' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});