const express = require('express');
const mongoose = require('mongoose'); // Importar mongoose para MongoDB
const cors = require('cors'); 
const jwt = require('jsonwebtoken'); // Para generar tokens
const bcrypt = require('bcryptjs'); // Para hashear contraseñas
const Pedido = require('./models/pedido'); 
const User = require('./models/user'); // Modelo de Usuario (nuevo)
const cron = require('node-cron');
const PedidoEliminado = require('./models/pedidoEliminado');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const JWT_SECRET = 'your_jwt_secret'; // Clave secreta para firmar tokens
// Configurar Sequelize con la conexión a MySQL
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

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Node.js service running!');
});

// Middleware para verificar autenticación
function authenticateToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'Token requerido' });

  jwt.verify(token.split(' ')[1], JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });
    req.user = user; // Aquí se asigna el usuario al objeto `req.user`
    next();
  });
}

// Crear un nuevo usuario (registro)
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
  }
  try {
      const hashedPassword = await bcrypt.hash(password, 10); // Hashea la contraseña
      const newUser = new User({ username, password: hashedPassword });
      await newUser.save();
      res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
      if (error.code === 11000) { // Código para error de clave duplicada en MongoDB
          return res.status(400).json({ message: 'El usuario ya existe' });
      }
      res.status(500).json({ error: error.message });
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

    const isMatch = await bcrypt.compare(password, user.password); // Compara la contraseña
    if (!isMatch) return res.status(401).json({ message: 'Contraseña incorrecta' });

    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/pedidos', authenticateToken, async (req, res) => {
  try {
    const { tiendaId, productoId, cantidadSolicitada, estado, fechaFin } = req.body;

    // Validar campos requeridos
    if (!tiendaId || !productoId || !cantidadSolicitada || !estado) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    // Validar que el estado sea "Pendiente" o "Completado"
    if (!['Pendiente', 'Completado'].includes(estado)) {
      return res.status(400).json({ message: 'Estado no permitido. Debe ser "Pendiente" o "Completado".' });
    }

    // Validar fechaFin para pedidos pendientes
    if (estado === 'Pendiente' && !fechaFin) {
      return res.status(400).json({ message: 'La fecha de fin es obligatoria para pedidos pendientes.' });
    }

    // Validar que el formato de fechaFin sea correcto
    if (fechaFin && isNaN(Date.parse(fechaFin))) {
      return res.status(400).json({ message: 'El formato de fecha no es válido. Debe ser una fecha válida.' });
    }

    // Validar que el producto existe en el inventario (usando MySQL con Sequelize)
    const producto = await Inventario.findOne({ where: { productoId: Number(productoId) } });
    if (!producto) {
      return res.status(400).json({ message: 'Producto no válido o no disponible en el inventario.' });
    }

    // Validar stock para pedidos completados
    if (estado === 'Completado' && producto.cantidad < cantidadSolicitada) {
      return res.status(400).json({ message: 'Stock insuficiente para este producto.' });
    }

    // Crear el pedido en MongoDB o la base de datos correspondiente
    const nuevoPedido = new Pedido({
      tiendaId,
      productoId,
      cantidadSolicitada,
      estado,
      fechaFin: fechaFin ? new Date(fechaFin) : null, // Asegurar que fechaFin sea un objeto Date
    });

    await nuevoPedido.save();

    // Actualizar el inventario en MySQL solo si el pedido está completado
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

// Obtener todos los pedidos (solo usuarios autenticados)
app.get('/pedidos', authenticateToken, async (req, res) => {
  try {
    const pedidos = await Pedido.find({ estado: 'Completado' }); // Solo pedidos completados
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

// Obtener un pedido por ID (solo usuarios autenticados)
app.get('/pedidos/:id', authenticateToken, async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id); // Buscar un pedido por ID
    if (!pedido) throw new Error('Pedido no encontrado');
    res.json(pedido); // Responder con el pedido encontrado
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

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

// Nueva ruta para obtener los pedidos eliminados
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

// Actualizar stock de un producto
app.put('/inventario/:id', async (req, res) => {
  try {
    const { cantidad } = req.body; // Cantidad que se va a ajustar (puede ser positiva o negativa)
    const productoId = req.params.id;

    // Buscar el producto en el inventario
    const producto = await Inventario.findOne({ productoId });
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Verificar que el nuevo stock no sea negativo
    if (producto.cantidad + cantidad < 0) {
      return res.status(400).json({ message: 'Stock insuficiente' });
    }

    // Ajustar la cantidad correctamente
    producto.cantidad += cantidad;
    await producto.save();

    res.json(producto);
  } catch (error) {
    console.error('Error al actualizar inventario:', error);
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

// Eliminar un pedido pendiente por ID
app.delete('/pedidos/pendientes/:id', async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndDelete(req.params.id); // Buscar y eliminar el pedido
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
    const { name, email, address } = req.body; // Campos a actualizar
    const user = await User.findOneAndUpdate(
      { username: req.user.username }, // Buscar por el usuario autenticado
      { name, email, address }, // Actualizar los campos
      { new: true } // Retornar el usuario actualizado
    );

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user); // Retornar el usuario actualizado
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/stats', async (req, res) => {
  try {
    // Conteo de pedidos pendientes (MongoDB)
    const pedidosPendientes = await Pedido.countDocuments({ estado: 'Pendiente' });

    // Conteo de productos en inventario (MySQL con Sequelize)
    const productosInventario = await Inventario.count(); // Cambiado de MongoDB a Sequelize

    // Conteo de tiendas registradas (MySQL con Sequelize)
    const tiendasRegistradas = await Tienda.count(); // Cambiado de MongoDB a Sequelize

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
      const { id } = req.params; // ID del producto desde el parámetro
      const { cantidadSolicitada } = req.body; // Cantidad solicitada desde el cuerpo de la solicitud

      if (!cantidadSolicitada || cantidadSolicitada <= 0) {
          return res.status(400).json({ message: 'Cantidad solicitada no válida.' });
      }

      // Buscar el producto en el inventario (tabla MySQL con Sequelize)
      const producto = await Inventario.findOne({ where: { productoId: Number(id) } });

      if (!producto) {
          return res.status(404).json({ message: 'Producto no encontrado.' });
      }

      // Simulación: registrar el evento
      console.log(
          `Solicitud de recarga recibida para el producto ${producto.nombreProducto} (ID: ${id}). Cantidad solicitada: ${cantidadSolicitada}`
      );

      // Devuelve una respuesta ficticia
      res.status(200).json({
          message: `Solicitud de recarga para "${producto.nombreProducto}" aceptada. Se recargará cuando el proveedor lo apruebe.`,
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
    // Aquí se asegura que `req.user` existe
    if (!req.user || !req.user.username) {
      return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    const user = await User.findOne({ username: req.user.username });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Verificar la contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'La contraseña actual es incorrecta.' });
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    res.status(200).json({ message: 'Contraseña actualizada exitosamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar el servidor
app.listen(5000, () => {
  console.log('Server is running on port 5000');
});