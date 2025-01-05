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
    host: process.env.MYSQL_HOST || 'mysqldb', // Cambiar si es necesario a '127.0.0.1'
    dialect: 'mysql',
    logging: console.log, // Habilitar logs para depuración
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
    process.exit(1); // Finaliza el proceso si la conexión falla
  }
}

connectToMongoDB();


async function connectWithRetry() {
  let retries = 10; // Aumentar el número de intentos
  while (retries > 0) {
    try {
      await sequelize.sync({ alter: true }); // Sincroniza tablas, ajusta si es necesario
      console.log('Conexión a MySQL establecida y tablas sincronizadas.');
      break;
    } catch (error) {
      console.error('Error al conectar o sincronizar con MySQL:', error.message);
      retries -= 1;
      console.log(`Reintentando conexión en 10 segundos (${retries} intentos restantes)...`);
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Espera más tiempo entre intentos
    }
  }
  if (retries === 0) {
    console.error('No se pudo conectar a MySQL después de varios intentos.');
    process.exit(1);
  }
}

connectWithRetry();

// Definir el modelo para "inventario" (MySQL)
const Inventario = sequelize.define(
  'Inventario',
  {
    productoId: { type: DataTypes.INTEGER, primaryKey: true },
    nombreProducto: { type: DataTypes.STRING },
    cantidad: { type: DataTypes.INTEGER },
    umbralMinimo: { type: DataTypes.INTEGER },
    ultimaActualizacion: { type: DataTypes.DATE },
  },
  { tableName: 'inventario', timestamps: false }
);

// Definir el modelo para "tiendas" (MySQL)
const Tienda = sequelize.define(
  'Tienda',
  {
    tiendaId: { type: DataTypes.INTEGER, primaryKey: true },
    nombre: { type: DataTypes.STRING },
    direccion: { type: DataTypes.STRING },
  },
  { tableName: 'tiendas', timestamps: false }
);

// Configurar CORS para permitir solicitudes desde otros dominios
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware para parsear JSON
app.use(express.json());

cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const pendientes = await Pedido.find({ estado: 'Pendiente', fechaFin: { $lte: now } });

    for (const pedido of pendientes) {
      pedido.estado = 'Completado';

      // Actualizar inventario al completar el pedido
      const producto = await Inventario.findOne({ where: { productoId: pedido.productoId } });
      if (producto) {
        producto.cantidad -= pedido.cantidadSolicitada;
        if (producto.cantidad < 0) producto.cantidad = 0; // Asegurar que no sea negativo
        await producto.save();
      } else {
        console.error(`Producto con ID ${pedido.productoId} no encontrado en el inventario`);
      }

      await pedido.save();
    }

    console.log('Pedidos pendientes actualizados automáticamente.');
  } catch (error) {
    console.error('Error al actualizar pedidos pendientes automáticamente:', error);
  }
});


app.get('/', (req, res) => {
  res.send('Node.js service running!');
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

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Registro de un nuevo usuario.
 *     description: Permite registrar un nuevo usuario proporcionando un nombre de usuario y una contraseña. La contraseña se almacena de manera segura usando hashing.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Nombre de usuario único.
 *                 example: usuario123
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario.
 *                 example: password123
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario registrado exitosamente
 *       400:
 *         description: Faltan datos o el usuario ya existe.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario y contraseña requeridos
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error inesperado en el servidor
 */
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
  }
  try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ username, password: hashedPassword });
      await newUser.save();
      res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
      if (error.code === 11000) { 
          return res.status(400).json({ message: 'El usuario ya existe' });
      }
      res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /checkUser:
 *   post:
 *     summary: Verifica si un usuario existe.
 *     description: Comprueba si un nombre de usuario específico ya está registrado en el sistema.
 *     tags:
 *       - Usuarios
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: El nombre de usuario a verificar.
 *                 example: usuario123
 *     responses:
 *       200:
 *         description: Verificación exitosa.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 *                   description: Indica si el usuario existe o no.
 *                   example: true
 *       400:
 *         description: Nombre de usuario faltante en la solicitud.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: El nombre de usuario es requerido
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error interno del servidor
 */
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

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Iniciar sesión en el sistema.
 *     description: Permite a un usuario autenticarse proporcionando un nombre de usuario y contraseña válidos. Devuelve un token JWT para acceder a los recursos protegidos.
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: El nombre de usuario registrado.
 *                 example: usuario123
 *               password:
 *                 type: string
 *                 description: La contraseña correspondiente al usuario.
 *                 example: password123
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT generado para el usuario autenticado.
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Faltan datos requeridos en la solicitud.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario y contraseña requeridos
 *       401:
 *         description: Contraseña incorrecta.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Contraseña incorrecta
 *       404:
 *         description: Usuario no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error inesperado en el servidor
 */
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const isMatch = await bcrypt.compare(password, user.password); // Compara la contraseña
    if (!isMatch) return res.status(401).json({ message: 'Contraseña incorrecta' });

    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /pedidos:
 *   post:
 *     summary: Crear un nuevo pedido.
 *     description: Permite a un usuario autenticado crear un nuevo pedido con información de la tienda, producto, cantidad y estado.
 *     tags:
 *       - Pedidos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tiendaId:
 *                 type: string
 *                 description: ID de la tienda donde se realiza el pedido.
 *                 example: "1"
 *               productoId:
 *                 type: string
 *                 description: ID del producto solicitado.
 *                 example: "101"
 *               cantidadSolicitada:
 *                 type: number
 *                 description: Cantidad del producto solicitado.
 *                 example: 10
 *               estado:
 *                 type: string
 *                 description: Estado del pedido, que puede ser "Pendiente" o "Completado".
 *                 enum: ["Pendiente", "Completado"]
 *                 example: "Pendiente"
 *               fechaFin:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha límite para completar el pedido (solo para pedidos "Pendientes").
 *                 example: "2025-01-15T12:00:00Z"
 *     responses:
 *       201:
 *         description: Pedido creado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pedido'
 *       400:
 *         description: Error en la validación de datos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Todos los campos son obligatorios"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error interno del servidor."
 */
app.post('/pedidos', authenticateToken, async (req, res) => {
  try {
    const { tiendaId, productoId, cantidadSolicitada, estado, fechaFin } = req.body;

    if (!tiendaId || !productoId || !cantidadSolicitada || !estado) {
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

    const producto = await Inventario.findOne({ where: { productoId: Number(productoId) } });
    if (!producto) {
      return res.status(400).json({ message: 'Producto no válido o no disponible en el inventario.' });
    }

    if (estado === 'Completado' && producto.cantidad < cantidadSolicitada) {
      return res.status(400).json({ message: 'Stock insuficiente para este producto.' });
    }

    const nuevoPedido = new Pedido({
      tiendaId,
      productoId,
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

/**
 * @swagger
 * /pedidos:
 *   get:
 *     summary: Obtener todos los pedidos completados.
 *     description: Devuelve una lista de todos los pedidos cuyo estado sea "Completado". Requiere autenticación.
 *     tags:
 *       - Pedidos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos completados.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pedido'
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error interno del servidor."
 */
app.get('/pedidos', authenticateToken, async (req, res) => {
  try {
    const pedidos = await Pedido.find({ estado: 'Completado' }); // Solo pedidos completados
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /pedidos/pendientes:
 *   get:
 *     summary: Obtener todos los pedidos pendientes.
 *     description: Devuelve una lista de todos los pedidos cuyo estado sea "Pendiente".
 *     tags:
 *       - Pedidos
 *     responses:
 *       200:
 *         description: Lista de pedidos pendientes.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pedido'
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error interno del servidor."
 */
app.get('/pedidos/pendientes', async (req, res) => {
  try {
    const pedidosPendientes = await Pedido.find({ estado: "Pendiente" });
    res.json(pedidosPendientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Pedido:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único del pedido generado por MongoDB.
 *           example: "641c5f2b45e8e5a1c6f4d5e3"
 *         tiendaId:
 *           type: string
 *           description: ID de la tienda donde se realizó el pedido.
 *           example: "1"
 *         productoId:
 *           type: string
 *           description: ID del producto solicitado.
 *           example: "101"
 *         cantidadSolicitada:
 *           type: number
 *           description: Cantidad del producto solicitado.
 *           example: 10
 *         estado:
 *           type: string
 *           description: Estado del pedido, que puede ser "Pendiente" o "Completado".
 *           example: "Pendiente"
 *         fechaPedido:
 *           type: string
 *           format: date-time
 *           description: Fecha en que se realizó el pedido.
 *           example: "2025-01-01T12:00:00Z"
 *         fechaFin:
 *           type: string
 *           format: date-time
 *           description: Fecha límite para completar el pedido (solo para pedidos "Pendiente").
 *           example: "2025-01-15T12:00:00Z"
 */
app.get('/pedidos/:id', authenticateToken, async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id); 
    if (!pedido) throw new Error('Pedido no encontrado');
    res.json(pedido); 
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Pedido:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único del pedido generado por MongoDB.
 *           example: "641c5f2b45e8e5a1c6f4d5e3"
 *         tiendaId:
 *           type: string
 *           description: ID de la tienda donde se realizó el pedido.
 *           example: "1"
 *         productoId:
 *           type: string
 *           description: ID del producto solicitado.
 *           example: "101"
 *         cantidadSolicitada:
 *           type: number
 *           description: Cantidad del producto solicitado.
 *           example: 10
 *         estado:
 *           type: string
 *           description: Estado del pedido, que puede ser "Pendiente" o "Completado".
 *           example: "Pendiente"
 *         fechaPedido:
 *           type: string
 *           format: date-time
 *           description: Fecha en que se realizó el pedido.
 *           example: "2025-01-01T12:00:00Z"
 *         fechaFin:
 *           type: string
 *           format: date-time
 *           description: Fecha límite para completar el pedido (solo para pedidos "Pendiente").
 *           example: "2025-01-15T12:00:00Z"
 */
app.put('/pedidos/:id', authenticateToken, async (req, res) => {
  try {
    const { tiendaId, productoId, cantidadSolicitada, estado, fechaFin } = req.body;

    // Obtener el pedido previo
    const pedidoAnterior = await Pedido.findById(req.params.id);
    if (!pedidoAnterior) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Verificar si el producto o la cantidad han cambiado
    const productoPrevioId = pedidoAnterior.productoId;
    const cantidadPrevia = pedidoAnterior.cantidadSolicitada;

    if (productoPrevioId !== productoId || cantidadPrevia !== cantidadSolicitada) {
      // Revertir inventario del producto anterior
      const productoAnterior = await Inventario.findOne({ where: { productoId: productoPrevioId } });
      if (productoAnterior) {
        productoAnterior.cantidad += cantidadPrevia; // Revertir cantidad previa
        await productoAnterior.save();
      }

      // Actualizar inventario del producto nuevo
      const productoNuevo = await Inventario.findOne({ where: { productoId } });
      if (!productoNuevo) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      if (productoNuevo.cantidad < cantidadSolicitada) {
        return res.status(400).json({ message: 'Stock insuficiente' });
      }

      productoNuevo.cantidad -= cantidadSolicitada; // Descontar nueva cantidad
      await productoNuevo.save();
    }

    // Actualizar el pedido
    pedidoAnterior.tiendaId = tiendaId || pedidoAnterior.tiendaId;
    pedidoAnterior.productoId = productoId;
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

/**
 * @swagger
 * /pedidos/{id}:
 *   delete:
 *     summary: Eliminar un pedido por ID.
 *     description: Elimina un pedido específico de la base de datos y registra la información del pedido eliminado en una colección separada.
 *     tags:
 *       - Pedidos
 *     security:
 *       - bearerAuth: []  # Requiere autenticación con token.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           description: ID único del pedido.
 *           example: "641c5f2b45e8e5a1c6f4d5e3"
 *     responses:
 *       200:
 *         description: Pedido eliminado y registrado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Pedido eliminado y registrado correctamente."
 *       404:
 *         description: Pedido no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Pedido no encontrado."
 *       401:
 *         description: No autorizado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Token requerido."
 *       403:
 *         description: Token inválido.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Token inválido."
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error interno del servidor."
 */
app.delete('/pedidos/:id', authenticateToken, async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) throw new Error('Pedido no encontrado');

    // Registrar el pedido eliminado
    const pedidoEliminado = new PedidoEliminado({
      tiendaId: pedido.tiendaId,
      productoId: pedido.productoId,
      cantidadSolicitada: pedido.cantidadSolicitada,
      estado: pedido.estado,
      fechaPedido: pedido.fechaPedido,
    });
    await pedidoEliminado.save();

    // Eliminar el pedido original
    await pedido.deleteOne();
    res.json({ message: 'Pedido eliminado y registrado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /pedidos-eliminados:
 *   get:
 *     summary: Obtener todos los pedidos eliminados.
 *     description: Recupera una lista de todos los pedidos que han sido eliminados y registrados en la colección `PedidoEliminado`.
 *     tags:
 *       - Pedidos
 *     responses:
 *       200:
 *         description: Lista de pedidos eliminados recuperada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: ID único del registro.
 *                     example: "641c5f2b45e8e5a1c6f4d5e3"
 *                   tiendaId:
 *                     type: string
 *                     description: ID de la tienda asociada al pedido.
 *                     example: "1"
 *                   productoId:
 *                     type: string
 *                     description: ID del producto asociado al pedido.
 *                     example: "101"
 *                   cantidadSolicitada:
 *                     type: number
 *                     description: Cantidad solicitada en el pedido.
 *                     example: 50
 *                   estado:
 *                     type: string
 *                     description: Estado del pedido antes de ser eliminado.
 *                     example: "Completado"
 *                   fechaPedido:
 *                     type: string
 *                     format: date-time
 *                     description: Fecha en que se realizó el pedido.
 *                     example: "2023-01-01T12:00:00.000Z"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error interno del servidor."
 */
app.get('/pedidos-eliminados',  async (req, res) => {
  try {
    const pedidosEliminados = await PedidoEliminado.find();
    res.json(pedidosEliminados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /inventario:
 *   get:
 *     summary: Obtener todos los productos en el inventario.
 *     description: Recupera una lista de todos los productos registrados en el inventario desde la base de datos MySQL.
 *     tags:
 *       - Inventario
 *     responses:
 *       200:
 *         description: Lista de productos en el inventario recuperada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   productoId:
 *                     type: integer
 *                     description: ID único del producto.
 *                     example: 1
 *                   nombreProducto:
 *                     type: string
 *                     description: Nombre del producto.
 *                     example: "Camisa"
 *                   cantidad:
 *                     type: integer
 *                     description: Cantidad disponible del producto.
 *                     example: 100
 *                   umbralMinimo:
 *                     type: integer
 *                     description: Nivel mínimo del producto en el inventario.
 *                     example: 10
 *                   ultimaActualizacion:
 *                     type: string
 *                     format: date-time
 *                     description: Fecha y hora de la última actualización del producto.
 *                     example: "2025-01-05T12:34:56.789Z"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error interno del servidor."
 */
app.get('/inventario', async (req, res) => {
  try {
    const inventarios = await Inventario.findAll();
    res.json(inventarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /inventario:
 *   post:
 *     summary: Crear un nuevo producto en el inventario.
 *     description: Añade un nuevo producto al inventario con los detalles proporcionados.
 *     tags:
 *       - Inventario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productoId:
 *                 type: integer
 *                 description: ID único del producto.
 *                 example: 1
 *               nombreProducto:
 *                 type: string
 *                 description: Nombre del producto.
 *                 example: "Camisa"
 *               cantidad:
 *                 type: integer
 *                 description: Cantidad disponible del producto.
 *                 example: 100
 *               umbralMinimo:
 *                 type: integer
 *                 description: Cantidad mínima requerida para el inventario.
 *                 example: 10
 *     responses:
 *       201:
 *         description: Producto creado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 productoId:
 *                   type: integer
 *                   description: ID único del producto.
 *                   example: 1
 *                 nombreProducto:
 *                   type: string
 *                   description: Nombre del producto.
 *                   example: "Camisa"
 *                 cantidad:
 *                   type: integer
 *                   description: Cantidad disponible del producto.
 *                   example: 100
 *                 umbralMinimo:
 *                   type: integer
 *                   description: Cantidad mínima requerida para el inventario.
 *                   example: 10
 *       400:
 *         description: Error de validación o de entrada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "El producto ya existe en el inventario."
 */
app.post('/inventario', async (req, res) => {
  const { productoId, nombreProducto, cantidad, umbralMinimo } = req.body;
  try {
    const nuevoProducto = await Inventario.create({
      productoId,
      nombreProducto,
      cantidad,
      umbralMinimo,
    });
    res.status(201).json(nuevoProducto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /inventario/{id}:
 *   put:
 *     summary: Actualizar la cantidad de un producto en el inventario.
 *     description: Ajusta la cantidad disponible de un producto en el inventario. La cantidad puede ser positiva o negativa.
 *     tags:
 *       - Inventario
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único del producto en el inventario.
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cantidad:
 *                 type: integer
 *                 description: Cantidad a ajustar (puede ser positiva o negativa).
 *                 example: -10
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 productoId:
 *                   type: integer
 *                   description: ID único del producto.
 *                   example: 1
 *                 nombreProducto:
 *                   type: string
 *                   description: Nombre del producto.
 *                   example: "Camisa"
 *                 cantidad:
 *                   type: integer
 *                   description: Cantidad disponible después de la actualización.
 *                   example: 90
 *                 umbralMinimo:
 *                   type: integer
 *                   description: Cantidad mínima requerida para el inventario.
 *                   example: 10
 *       404:
 *         description: Producto no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Producto no encontrado"
 *       400:
 *         description: Stock insuficiente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Stock insuficiente"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error al actualizar inventario"
 */
app.put('/inventario/:id', async (req, res) => {
  try {
    const { cantidad } = req.body; 
    const productoId = req.params.id;

    const producto = await Inventario.findOne({ productoId });
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    if (producto.cantidad + cantidad < 0) {
      return res.status(400).json({ message: 'Stock insuficiente' });
    }

    producto.cantidad += cantidad;
    await producto.save();

    res.json(producto);
  } catch (error) {
    console.error('Error al actualizar inventario:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /tiendas:
 *   get:
 *     summary: Obtiene todas las tiendas registradas.
 *     description: Devuelve una lista de todas las tiendas disponibles en la base de datos.
 *     tags:
 *       - Tiendas
 *     responses:
 *       200:
 *         description: Lista de tiendas obtenida exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   tiendaId:
 *                     type: integer
 *                     description: ID único de la tienda.
 *                     example: 1
 *                   nombre:
 *                     type: string
 *                     description: Nombre de la tienda.
 *                     example: "Zara Gran Vía"
 *                   direccion:
 *                     type: string
 *                     description: Dirección de la tienda.
 *                     example: "Gran Vía 32, Madrid"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error al obtener las tiendas"
 */
app.get('/tiendas', async (req, res) => {
  try {
    const tiendas = await Tienda.findAll();
    res.json(tiendas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /tiendas:
 *   post:
 *     summary: Registra una nueva tienda.
 *     description: Crea una nueva tienda en la base de datos con la información proporcionada.
 *     tags:
 *       - Tiendas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tiendaId:
 *                 type: integer
 *                 description: ID único de la tienda.
 *                 example: 41
 *               nombre:
 *                 type: string
 *                 description: Nombre de la tienda.
 *                 example: "Zara Sevilla"
 *               direccion:
 *                 type: string
 *                 description: Dirección de la tienda.
 *                 example: "Calle Sierpes 10, Sevilla"
 *     responses:
 *       201:
 *         description: Tienda registrada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tiendaId:
 *                   type: integer
 *                   description: ID único de la tienda.
 *                   example: 41
 *                 nombre:
 *                   type: string
 *                   description: Nombre de la tienda.
 *                   example: "Zara Sevilla"
 *                 direccion:
 *                   type: string
 *                   description: Dirección de la tienda.
 *                   example: "Calle Sierpes 10, Sevilla"
 *       400:
 *         description: Error en la solicitud (falta de campos requeridos o error al guardar).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Todos los campos son obligatorios"
 *                 error:
 *                   type: string
 *                   example: "Error al guardar la tienda en la base de datos"
 */
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

/**
 * @swagger
 * /pedidos/pendientes/{id}:
 *   delete:
 *     summary: Elimina un pedido pendiente por su ID.
 *     description: Permite eliminar un pedido pendiente de la base de datos utilizando su ID.
 *     tags:
 *       - Pedidos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del pedido pendiente a eliminar.
 *         example: 63f3b7f67e7d4b0012345678
 *     responses:
 *       200:
 *         description: Pedido eliminado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Pedido eliminado exitosamente
 *       404:
 *         description: Pedido no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Pedido no encontrado
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error interno del servidor
 */
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

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Obtiene el perfil del usuario autenticado.
 *     description: Devuelve la información del perfil del usuario que realizó la solicitud, siempre y cuando esté autenticado correctamente.
 *     tags:
 *       - Perfil
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario autenticado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                   description: Nombre de usuario.
 *                   example: usuario123
 *                 name:
 *                   type: string
 *                   description: Nombre del usuario.
 *                   example: Juan Pérez
 *                 email:
 *                   type: string
 *                   description: Correo electrónico del usuario.
 *                   example: juan.perez@example.com
 *                 address:
 *                   type: string
 *                   description: Dirección del usuario.
 *                   example: Calle Falsa 123, Ciudad Ejemplo
 *       401:
 *         description: Token de autenticación faltante o inválido.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token inválido
 *       404:
 *         description: Usuario no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error interno del servidor
 */
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

/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Actualizar el perfil del usuario autenticado.
 *     description: Permite a un usuario autenticado actualizar su nombre, correo electrónico o dirección.
 *     tags:
 *       - Perfil
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del usuario.
 *                 example: Juan Pérez
 *               email:
 *                 type: string
 *                 description: Correo electrónico del usuario.
 *                 example: juan.perez@example.com
 *               address:
 *                 type: string
 *                 description: Dirección del usuario.
 *                 example: Calle Falsa 123, Ciudad Ejemplo
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                   description: Nombre de usuario.
 *                   example: usuario123
 *                 name:
 *                   type: string
 *                   description: Nombre del usuario actualizado.
 *                   example: Juan Pérez
 *                 email:
 *                   type: string
 *                   description: Correo electrónico actualizado.
 *                   example: juan.perez@example.com
 *                 address:
 *                   type: string
 *                   description: Dirección actualizada.
 *                   example: Calle Falsa 123, Ciudad Ejemplo
 *       404:
 *         description: Usuario no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error interno del servidor
 */
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

/**
 * @swagger
 * /stats:
 *   get:
 *     summary: Obtiene estadísticas generales del sistema.
 *     description: Devuelve estadísticas sobre pedidos pendientes, productos en inventario y tiendas registradas.
 *     tags:
 *       - Estadísticas
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pedidosPendientes:
 *                   type: integer
 *                   description: Número total de pedidos en estado pendiente.
 *                   example: 15
 *                 productosInventario:
 *                   type: integer
 *                   description: Número total de productos registrados en el inventario.
 *                   example: 200
 *                 tiendasRegistradas:
 *                   type: integer
 *                   description: Número total de tiendas registradas.
 *                   example: 40
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error interno del servidor
 */
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

/**
 * @swagger
 * /recargar-producto/{id}:
 *   post:
 *     summary: Solicita recarga de stock para un producto específico.
 *     description: Permite realizar una solicitud de recarga para un producto del inventario, especificando la cantidad requerida.
 *     tags:
 *       - Inventario
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del producto que requiere recarga.
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cantidadSolicitada:
 *                 type: integer
 *                 description: Cantidad solicitada para la recarga.
 *                 example: 50
 *     responses:
 *       200:
 *         description: Solicitud de recarga procesada con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Solicitud de recarga para "Camisa" aceptada. Se recargará cuando el proveedor lo apruebe.
 *       400:
 *         description: Solicitud inválida (datos faltantes o erróneos).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cantidad solicitada no válida.
 *       404:
 *         description: Producto no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Producto no encontrado.
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error interno del servidor.
 */
app.post('/recargar-producto/:id', async (req, res) => {
  try {
      const { id } = req.params; 
      const { cantidadSolicitada } = req.body;

      if (!cantidadSolicitada || cantidadSolicitada <= 0) {
          return res.status(400).json({ message: 'Cantidad solicitada no válida.' });
      }

      const producto = await Inventario.findOne({ where: { productoId: Number(id) } });

      if (!producto) {
          return res.status(404).json({ message: 'Producto no encontrado.' });
      }

      console.log(
          `Solicitud de recarga recibida para el producto ${producto.nombreProducto} (ID: ${id}). Cantidad solicitada: ${cantidadSolicitada}`
      );

      res.status(200).json({
          message: `Solicitud de recarga para "${producto.nombreProducto}" aceptada. Se recargará cuando el proveedor lo apruebe.`,
      });
  } catch (error) {
      console.error('Error al procesar la solicitud de recarga:', error);
      res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

/**
 * @swagger
 * /profile/change-password:
 *   put:
 *     summary: Cambiar la contraseña del usuario autenticado.
 *     description: Permite a un usuario autenticado cambiar su contraseña proporcionando la contraseña actual y la nueva.
 *     tags:
 *       - Perfil
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Contraseña actual del usuario.
 *                 example: password123
 *               newPassword:
 *                 type: string
 *                 description: Nueva contraseña que desea establecer el usuario.
 *                 example: newpassword456
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Contraseña actualizada exitosamente.
 *       400:
 *         description: Solicitud inválida (datos faltantes o contraseña incorrecta).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Ambas contraseñas son requeridas.
 *       401:
 *         description: Usuario no autenticado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario no autenticado.
 *       404:
 *         description: Usuario no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario no encontrado.
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error inesperado en el servidor.
 */
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

/**
 * @swagger
 * /pedidos-eliminados/{id}:
 *   delete:
 *     summary: Eliminar un pedido eliminado definitivamente.
 *     description: Permite eliminar un pedido de la lista de pedidos eliminados de forma permanente.
 *     tags:
 *       - Pedidos Eliminados
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del pedido eliminado que se desea eliminar definitivamente.
 *         schema:
 *           type: string
 *           example: 64b3f5e7b6d3b9c9a4a1b123
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pedido eliminado definitivamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Pedido eliminado definitivamente.
 *       404:
 *         description: Pedido no encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Pedido no encontrado.
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error interno del servidor.
 */
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

// Iniciar el servidor
app.listen(5000, () => {
  console.log('Server is running on port 5000');
});