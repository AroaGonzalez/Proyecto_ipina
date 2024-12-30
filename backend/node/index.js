const express = require('express');
const mongoose = require('mongoose'); // Importar mongoose para MongoDB
const cors = require('cors'); 
const jwt = require('jsonwebtoken'); // Para generar tokens
const bcrypt = require('bcryptjs'); // Para hashear contraseñas
const Pedido = require('./models/pedido'); 
const User = require('./models/user'); // Modelo de Usuario (nuevo)
const Inventario = require('./models/inventario');
const Tienda = require('./models/tienda'); // Importar modelo

const app = express();
const JWT_SECRET = 'your_jwt_secret'; // Clave secreta para firmar tokens

// Configurar CORS para permitir solicitudes desde otros dominios
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware para parsear JSON
app.use(express.json());

// Conexión a MongoDB
mongoose.connect('mongodb://root:rootpassword@mongo:27017/tienda', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  authSource: 'admin',
});

// Coloca el cron aquí, después de la conexión a MongoDB
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const pendientes = await Pedido.find({ estado: 'Pendiente', fechaFin: { $lte: now } });

    for (const pedido of pendientes) {
      pedido.estado = 'Completado';

      // Actualizar inventario al completar el pedido
      const producto = await Inventario.findOne({ productoId: pedido.productoId });
      if (producto) {
        producto.cantidad -= pedido.cantidadSolicitada;
        await producto.save();
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
    req.user = user;
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


// Iniciar sesión y obtener token
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
      return res.status(400).json({ message: 'Estado no permitido' });
    }

    // Validar fechaFin para pedidos pendientes
    if (estado === 'Pendiente' && !fechaFin) {
      return res.status(400).json({ message: 'La fecha de fin es obligatoria para pedidos pendientes' });
    }

    // Validar que el producto existe en el inventario
    const producto = await Inventario.findOne({ productoId });
    if (!producto) {
      return res.status(400).json({ message: 'Producto no válido o no disponible en el inventario' });
    }

    // Validar stock para pedidos completados
    if (estado === 'Completado' && producto.cantidad < cantidadSolicitada) {
      return res.status(400).json({ message: 'Stock insuficiente para este producto' });
    }

    // Crear el pedido
    const nuevoPedido = new Pedido({ tiendaId, productoId, cantidadSolicitada, estado, fechaFin });
    await nuevoPedido.save();

    // Actualizar el inventario solo si el pedido está completado
    if (estado === 'Completado') {
      producto.cantidad -= cantidadSolicitada;
      await producto.save();
    }

    res.status(201).json(nuevoPedido);
  } catch (error) {
    console.error('Error al procesar el pedido:', error);
    res.status(500).json({ error: error.message });
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

app.get('/pedidos/pendientes', authenticateToken, async (req, res) => {
  try {
    const pendientes = await Pedido.find({ estado: 'Pendiente' }); // Solo pedidos pendientes
    res.json(pendientes);
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

    // Si el estado cambia a completado, validar stock y actualizar inventario
    if (estado === 'Completado' && pedidoAnterior.estado === 'Pendiente') {
      const producto = await Inventario.findOne({ productoId });
      if (!producto) {
        return res.status(404).json({ message: 'Producto no encontrado en inventario' });
      }

      if (producto.cantidad < cantidadSolicitada) {
        return res.status(400).json({ message: 'Stock insuficiente para completar el pedido' });
      }

      producto.cantidad -= cantidadSolicitada;
      await producto.save();
    }

    // Actualizar el pedido con los nuevos datos
    pedidoAnterior.tiendaId = tiendaId || pedidoAnterior.tiendaId;
    pedidoAnterior.productoId = productoId || pedidoAnterior.productoId;
    pedidoAnterior.cantidadSolicitada = cantidadSolicitada || pedidoAnterior.cantidadSolicitada;
    pedidoAnterior.estado = estado || pedidoAnterior.estado;
    pedidoAnterior.fechaFin = fechaFin || pedidoAnterior.fechaFin;

    await pedidoAnterior.save();
    res.json(pedidoAnterior);
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar un pedido (solo usuarios autenticados)
app.delete('/pedidos/:id', authenticateToken, async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndDelete(req.params.id); // Eliminar el pedido
    if (!pedido) throw new Error('Pedido no encontrado');
    res.json({ message: 'Pedido eliminado' }); // Responder con un mensaje de éxito
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Obtener todo el inventario
app.get('/inventario', async (req, res) => {
  try {
    const inventarios = await Inventario.find();
    res.json(inventarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Añadir un producto al inventario
app.post('/inventario', async (req, res) => {
  const { productoId, nombreProducto, cantidad, umbralMinimo } = req.body;
  try {
    const nuevoProducto = new Inventario({ productoId, nombreProducto, cantidad, umbralMinimo });
    await nuevoProducto.save();
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

// Obtener todas las tiendas (elimina autenticación temporalmente para pruebas)
app.get('/tiendas', async (req, res) => {
  try {
    const tiendas = await Tienda.find();
    res.json(tiendas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear una tienda nueva
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


// Iniciar el servidor
app.listen(5000, () => {
  console.log('Server is running on port 5000');
});