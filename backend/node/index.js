const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Pedido = require('./models/pedido'); 
const User = require('./models/user');
const cron = require('node-cron');
const PedidoEliminado = require('./models/pedidoEliminado');
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

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'tienda',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD || 'root',
  {
    host: process.env.MYSQL_HOST || 'mysqldb',
    dialect: 'mysql',
    logging: console.log,
  }
);

async function connectToMongoDB() {
  try {
    console.log('Intentando conectar a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://root:rootpassword@mongodb:27017/tienda', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conexión a MongoDB establecida.');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
}

connectToMongoDB();

async function connectWithRetry() {
  let retries = 10;
  while (retries > 0) {
    try {
      await sequelize.sync({ alter: true });
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

const Inventario = sequelize.define(
  'Inventario',
  {
      idArticulo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      articulo: { type: DataTypes.STRING, allowNull: false },
      estado: { type: DataTypes.ENUM('Activo', 'Pausado'), defaultValue: 'Activo' }
  },
  { tableName: 'inventario', timestamps: false }
);

const Tienda = sequelize.define(
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

cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const pendientes = await Pedido.find({ estado: 'Pendiente', fechaFin: { $lte: now } });

    for (const pedido of pendientes) {
      pedido.estado = 'Completado';

      const producto = await Inventario.findOne({ where: { idArticulo: pedido.idArticulo } });
      if (producto) {
        producto.cantidad -= pedido.cantidadSolicitada;
        if (producto.cantidad < 0) producto.cantidad = 0;
        await producto.save();
      } else {
        console.error(`Producto con ID ${pedido.idArticulo} no encontrado en el inventario`);
      }

      await pedido.save();
    }

    console.log('Pedidos pendientes actualizados automáticamente.');
  } catch (error) {
    console.error('Error al actualizar pedidos pendientes automáticamente:', error);
  }
});

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

app.post('/pedidos', authenticateToken, async (req, res) => {
  try {
    const { tiendaId, idArticulo, cantidadSolicitada, estado, fechaFin } = req.body;

    if (!tiendaId || !idArticulo || !cantidadSolicitada || !estado) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    if (!['Pendiente', 'Completado'].includes(estado)) {
      return res.status(400).json({ message: 'Estado no permitido. Debe ser "Pendiente" o "Completado".' });
    }

    if (estado === 'Pendiente' && !fechaFin) {
      return res.status(400).json({ message: 'La fecha de fin es obligatoria para pedidos pendientes.' });
    }

    if (fechaFin && isNaN(Date.parse(fechaFin))) {
      return res.status(400).json({ message: 'El formato de fecha no es válido. Debe ser una fecha válida.' });
    }

    const producto = await Inventario.findOne({ where: { idArticulo: Number(idArticulo) } });
    if (!producto) {
      return res.status(400).json({ message: 'Producto no válido o no disponible en el inventario.' });
    }

    if (estado === 'Completado' && producto.cantidad < cantidadSolicitada) {
      return res.status(400).json({ message: 'Stock insuficiente para este producto.' });
    }

    const nuevoPedido = new Pedido({
      tiendaId,
      idArticulo,
      cantidadSolicitada,
      estado,
      fechaFin: fechaFin ? new Date(fechaFin) : null,
    });

    await nuevoPedido.save();

    if (estado === 'Completado') {
      producto.cantidad -= cantidadSolicitada;
      await producto.save();
    }

    res.status(201).json(nuevoPedido);
  } catch (error) {
    console.error('Error al procesar el pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.get('/pedidos', authenticateToken, async (req, res) => {
  try {
    const pedidos = await Pedido.find({ estado: 'Completado' });
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/pedidos/pendientes', async (req, res) => {
  try {
    const pedidosPendientes = await Pedido.find({ estado: "Pendiente" });
    res.json(pedidosPendientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/pedidos/:id', authenticateToken, async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id); 
    if (!pedido) throw new Error('Pedido no encontrado');
    res.json(pedido); 
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.put('/pedidos/:id', authenticateToken, async (req, res) => {
  try {
    const { tiendaId, idArticulo, cantidadSolicitada, estado, fechaFin } = req.body;

    const pedidoAnterior = await Pedido.findById(req.params.id);
    if (!pedidoAnterior) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const productoPrevioId = pedidoAnterior.idArticulo;
    const cantidadPrevia = pedidoAnterior.cantidadSolicitada;

    if (productoPrevioId !== idArticulo || cantidadPrevia !== cantidadSolicitada) {
      const productoAnterior = await Inventario.findOne({ where: { idArticulo: productoPrevioId } });
      if (productoAnterior) {
        productoAnterior.cantidad += cantidadPrevia;
        await productoAnterior.save();
      }

      const productoNuevo = await Inventario.findOne({ where: { idArticulo } });
      if (!productoNuevo) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      if (productoNuevo.cantidad < cantidadSolicitada) {
        return res.status(400).json({ message: 'Stock insuficiente' });
      }

      productoNuevo.cantidad -= cantidadSolicitada;
      await productoNuevo.save();
    }

    pedidoAnterior.tiendaId = tiendaId || pedidoAnterior.tiendaId;
    pedidoAnterior.idArticulo = idArticulo;
    pedidoAnterior.cantidadSolicitada = cantidadSolicitada;
    pedidoAnterior.estado = estado || pedidoAnterior.estado;
    pedidoAnterior.fechaFin = fechaFin || pedidoAnterior.fechaFin;

    await pedidoAnterior.save();
    res.json(pedidoAnterior);
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/pedidos/:id', authenticateToken, async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) throw new Error('Pedido no encontrado');

    const pedidoEliminado = new PedidoEliminado({
      tiendaId: pedido.tiendaId,
      idArticulo: pedido.idArticulo,
      cantidadSolicitada: pedido.cantidadSolicitada,
      estado: pedido.estado,
      fechaPedido: pedido.fechaPedido,
    });
    await pedidoEliminado.save();

    await pedido.deleteOne();
    res.json({ message: 'Pedido eliminado y registrado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/pedidos-eliminados',  async (req, res) => {
  try {
    const pedidosEliminados = await PedidoEliminado.find();
    res.json(pedidosEliminados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/inventario', async (req, res) => {
  try {
    const inventarios = await Inventario.findAll();
    res.json(inventarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/inventario', async (req, res) => {
  const { idArticulo, articulo } = req.body;
  try {
    const nuevoProducto = await Inventario.create({
      idArticulo,
      articulo
    });
    res.status(201).json(nuevoProducto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/inventario/estado', async (req, res) => {
  try {
    const { ids, estado } = req.body;

    if (!['Activo', 'Pausado'].includes(estado)) {
      return res.status(400).json({ message: 'Estado no válido' });
    }

    const productos = await Inventario.findAll({ where: { idArticulo: ids } });

    if (productos.length === 0) {
      return res.status(404).json({ message: 'Productos no encontrados' });
    }

    await Inventario.update({ estado }, { where: { idArticulo: ids } });

    res.json({ message: 'Estados actualizados correctamente' });
  } catch (error) {
    console.error('Error al actualizar estados:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/tiendas', async (req, res) => {
  try {
    const tiendas = await Tienda.findAll();
    res.json(tiendas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/tiendas', async (req, res) => {
  const { tiendaId, nombre, direccion } = req.body;
  if (!tiendaId || !nombre || !direccion) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }
  try {
    const nuevaTienda = new Tienda({ tiendaId, nombre, direccion });
    await nuevaTienda.save();
    res.status(201).json(nuevaTienda);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/pedidos/pendientes/:id', async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndDelete(req.params.id); 
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    res.json({ message: 'Pedido eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
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

app.post('/recargar-producto/:id', async (req, res) => {
  try {
      const { id } = req.params; 
      const { cantidadSolicitada } = req.body;

      if (!cantidadSolicitada || cantidadSolicitada <= 0) {
          return res.status(400).json({ message: 'Cantidad solicitada no válida.' });
      }

      const producto = await Inventario.findOne({ where: { idArticulo: Number(id) } });

      if (!producto) {
          return res.status(404).json({ message: 'Producto no encontrado.' });
      }

      console.log(
          `Solicitud de recarga recibida para el producto ${producto.articulo} (ID: ${id}). Cantidad solicitada: ${cantidadSolicitada}`
      );

      res.status(200).json({
          message: `Solicitud de recarga para "${producto.articulo}" aceptada. Se recargará cuando el proveedor lo apruebe.`,
      });
  } catch (error) {
      console.error('Error al procesar la solicitud de recarga:', error);
      res.status(500).json({ error: 'Error interno del servidor.' });
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

app.delete('/pedidos-eliminados/:id', async (req, res) => {
  try {
    const pedido = await PedidoEliminado.findByIdAndDelete(req.params.id);
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }
    res.json({ message: 'Pedido eliminado definitivamente.' });
  } catch (error) {
    console.error('Error al eliminar pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});